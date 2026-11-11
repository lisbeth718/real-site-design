// Browser-side detectors shared by measure.mjs and check.mjs.
//
// Every exported function is passed to page.evaluate(), so each one must be
// self-contained. install() defines window.__rsd (the helpers); the other
// functions read from it, so run install() first on every page.

export function install() {
  if (window.__rsd) return;
  const R = {};
  const WHITE = { r: 255, g: 255, b: 255, a: 1 };
  R.WHITE = WHITE;

  // Colours -----------------------------------------------------------------
  const colourCache = new Map();
  let ctx = null;
  // Parses any computed colour (rgb, rgba, oklch, color(), ...) to {r,g,b,a}.
  // Returns null for transparent.
  R.parseColor = (c) => {
    if (!c || c === 'transparent' || c === 'none') return null;
    if (colourCache.has(c)) return colourCache.get(c);
    let out = null;
    const m = c.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean);
      const n = (s, i) => (s.endsWith('%') ? (parseFloat(s) / 100) * (i < 3 ? 255 : 1) : Number(s));
      out = { r: n(p[0], 0), g: n(p[1], 1), b: n(p[2], 2), a: p.length > 3 ? n(p[3], 3) : 1 };
    } else {
      // Non-sRGB syntax (Tailwind v4 uses oklch): let the browser paint it.
      ctx = ctx || new OffscreenCanvas(1, 1).getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000';
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      out = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    }
    if (out && out.a <= 0.01) out = null;
    colourCache.set(c, out);
    return out;
  };
  R.blend = (fg, bg) => {
    const a = fg.a == null ? 1 : fg.a;
    return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
  };
  R.hex = (c) =>
    c ? '#' + [c.r, c.g, c.b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('').toUpperCase() : null;
  R.hexOf = (css) => R.hex(R.parseColor(css));
  R.dist = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
  R.luminance = (c) => {
    const ch = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  };
  R.contrast = (a, b) => {
    const la = R.luminance(a), lb = R.luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };
  R.hsl = (c) => {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h, s, l };
  };
  // "Chromatic" = a real hue, not a grey, near-white or near-black.
  R.isChromatic = (c) => {
    if (!c) return false;
    const { s, l } = R.hsl(c);
    const spread = Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
    return s >= 0.25 && l >= 0.12 && l <= 0.92 && spread > 30;
  };

  // Visibility ----------------------------------------------------------------
  R.visible = (el) => {
    if (!el || el.nodeType !== 1) return false;
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return false;
    // Off-canvas: skip links, closed drawers and slides.
    if (r.right <= 0 || r.left >= document.documentElement.clientWidth) return false;
    if (r.bottom + window.scrollY <= 0) return false;
    if (cs.clipPath === 'inset(50%)' || /rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(cs.clip)) return false;
    return true;
  };
  R.inBanner = (el) =>
    !!el.closest(
      '[id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i], [id*="onetrust" i], [id*="didomi" i], [id*="cookiebot" i], [id*="usercentrics" i], [class*="gdpr" i]'
    );
  R.text = (el, n = 80) => (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, n);
  R.ownText = (el) => {
    let t = '';
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.nodeValue;
    return t.trim().replace(/\s+/g, ' ');
  };
  R.docTop = (el) => el.getBoundingClientRect().top + window.scrollY;
  R.firstFamily = (ff) => (ff || '').split(',')[0].replace(/["']/g, '').trim();
  R.isIconFont = (fam) => /icon|awesome|material symbols|glyph|fontello|dashicons/i.test(fam);
  R.isMono = (ff) => {
    const fam = R.firstFamily(ff);
    return fam === 'monospace' || /mono|code|courier|consol|menlo|monaco/i.test(fam);
  };
  R.mode = (arr) => {
    const counts = {};
    for (const v of arr) counts[v] = (counts[v] || 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count }));
  };
  R.median = (arr) => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };

  // Effective background behind an element: composites translucent layers up
  // the tree. image=true when a background image or gradient sits in between.
  R.bgOf = (el) => {
    const layers = [];
    let image = false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') image = true;
      const c = R.parseColor(cs.backgroundColor);
      if (c) {
        layers.push(c);
        if (c.a >= 0.99) break;
      }
    }
    let base = WHITE;
    for (let i = layers.length - 1; i >= 0; i--) base = R.blend(layers[i], base);
    return { colour: base, image };
  };

  // Page background: the effective background of the deepest full-width
  // element that covers most of the page (a body-wide wrapper counts).
  R.pageBg = () => {
    const cw = document.documentElement.clientWidth;
    const docH = document.documentElement.scrollHeight;
    let deepest = document.body;
    const walk = (el, depth) => {
      if (depth > 6) return;
      for (const c of el.children) {
        const r = c.getBoundingClientRect();
        if (r.width >= cw - 2 && r.height >= docH * 0.8 && R.visible(c)) {
          deepest = c;
          walk(c, depth + 1);
          return;
        }
      }
    };
    walk(document.body, 0);
    return R.bgOf(deepest).colour;
  };

  // Radius --------------------------------------------------------------------
  R.radiusPx = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const v = cs.borderTopLeftRadius || '0px';
    let px = parseFloat(v) || 0;
    if (v.includes('%')) px = (px / 100) * Math.min(r.width, r.height);
    return Math.min(px, Math.min(r.width, r.height) / 2);
  };
  // Radius of a box. If the element itself is square, look at its first child
  // when that child fills the box (a rounded inner wrapper, or an element with
  // overflow:hidden that clips a rounded child).
  R.radiusOf = (el) => {
    const own = R.radiusPx(el);
    if (own > 0.5) return own;
    const kid = el.firstElementChild;
    if (kid) {
      const r = el.getBoundingClientRect(), kr = kid.getBoundingClientRect();
      if (kr.width >= r.width * 0.9 && kr.height >= r.height * 0.5) {
        const k = R.radiusPx(kid);
        if (k > 0.5) return k;
      }
    }
    return 0;
  };
  R.radiusLabel = (px, height) => (px >= 12 && px >= height / 2 - 1 ? 'pill' : `${Math.round(px)}px`);

  // Box: does the element have a visible background, full border or shadow
  // that sets it apart from what is behind it?
  R.boxOf = (el) => {
    const cs = getComputedStyle(el);
    const sides = ['Top', 'Right', 'Bottom', 'Left'].map((s) => {
      const w = parseFloat(cs[`border${s}Width`]) || 0;
      return w > 0 && cs[`border${s}Style`] !== 'none' && R.parseColor(cs[`border${s}Color`]) ? w : 0;
    });
    const hasBorder = sides.every((w) => w > 0);
    const behind = el.parentElement ? R.bgOf(el.parentElement).colour : WHITE;
    const bg = R.parseColor(cs.backgroundColor);
    const hasBg = !!bg && R.dist(R.blend(bg, behind), behind) > 8;
    const hasShadow =
      cs.boxShadow !== 'none' &&
      cs.boxShadow
        .split(/,(?![^(]*\))/)
        .some((sh) => {
          const m = sh.match(/rgba?\([^)]*\)|#[0-9a-f]+/i);
          const c = m ? R.parseColor(m[0]) : { a: 1 };
          const lens = (sh.replace(/rgba?\([^)]*\)/, '').match(/-?[\d.]+px/g) || []).map(parseFloat);
          return c && c.a > 0.02 && lens.some((v) => v !== 0);
        });
    const hasImage = cs.backgroundImage !== 'none';
    const gradient = /gradient\(/.test(cs.backgroundImage);
    return {
      any: hasBg || hasBorder || hasShadow || hasImage,
      hasBg: hasBg || gradient,
      hasBorder,
      hasShadow,
      background: hasBg ? R.hex(R.blend(bg, behind)) : gradient ? 'gradient' : null,
      border: hasBorder ? `${sides[0]}px ${cs.borderTopStyle} ${R.hexOf(cs.borderTopColor)}` : 'none',
      shadow: hasShadow
        ? cs.boxShadow
            .split(/,(?![^(]*\))/)
            .filter((sh) => !/rgba\([^)]*,\s*0\)/.test(sh))
            .join(',')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 60)
        : 'none',
    };
  };
  // Box of the element, or of a first child that fills it.
  R.boxOrChild = (el) => {
    const own = R.boxOf(el);
    if (own.any) return { ...own, node: el };
    const kid = el.firstElementChild;
    if (kid) {
      const r = el.getBoundingClientRect(), kr = kid.getBoundingClientRect();
      if (kr.width >= r.width * 0.9 && kr.height >= r.height * 0.6) {
        const k = R.boxOf(kid);
        if (k.any) return { ...k, node: kid };
      }
    }
    return { ...own, node: el };
  };

  // Header nav ----------------------------------------------------------------
  // Links in the top-most header / [role=banner] that starts in the top 200px,
  // or else in the first nav that starts there. Visible links only.
  R.headerRoot = () => {
    if (R._headerRoot !== undefined) return R._headerRoot;
    const ok = (el) =>
      R.visible(el) && !R.inBanner(el) && !el.closest('footer, article, aside, [role="contentinfo"]') && R.docTop(el) < 200;
    const heads = Array.from(document.querySelectorAll('header, [role="banner"]')).filter(ok);
    const outer = heads.filter((el) => !heads.some((o) => o !== el && o.contains(el)));
    outer.sort((a, b) => R.docTop(a) - R.docTop(b));
    let root = outer[0] || null;
    let source = 'header';
    if (!root) {
      root = Array.from(document.querySelectorAll('nav, [role="navigation"]')).find(ok) || null;
      source = 'nav';
    }
    if (!root) {
      // No semantic header: take the outermost full-width bar (at most 200px
      // tall) around the first visible link near the top.
      const cw = document.documentElement.clientWidth;
      const first = Array.from(document.querySelectorAll('a[href]')).find((a) => R.visible(a) && !R.inBanner(a) && R.docTop(a) < 200);
      for (let n = first; n && n !== document.body; n = n.parentElement) {
        const r = n.getBoundingClientRect();
        if (r.height > 200) break;
        if (r.width >= cw * 0.9 && R.docTop(n) < 200) {
          root = n;
          source = 'top bar';
        }
      }
    }
    R._headerRoot = root ? { el: root, source } : null;
    return R._headerRoot;
  };
  R.headerNav = () => {
    const h = R.headerRoot();
    if (!h) return { source: null, count: 0, items: [] };
    const top = R.docTop(h.el);
    const tall = h.el.getBoundingClientRect().height > 300;
    const els = Array.from(h.el.querySelectorAll('a[href], button, [role="menuitem"]')).filter((el) => R.visible(el) && !R.inBanner(el) && (!tall || R.docTop(el) < top + 250));
    const items = els
      .filter((el) => !els.some((o) => o !== el && o.contains(el)))
      .map((el) => {
        const t = R.text(el, 40) || el.getAttribute('aria-label') || '';
        return t || (el.querySelector('img, svg') ? '(icon)' : '');
      })
      .filter(Boolean);
    return { source: h.source, count: items.length, items };
  };

  // Buttons -------------------------------------------------------------------
  // Native buttons, [role=button], and links styled as buttons (own fill or
  // full border, horizontal padding, 32-64px tall).
  R.buttons = () => {
    if (R._buttons) return R._buttons;
    const out = [];
    const take = (el, kind) => {
      if (out.some((b) => b.el === el || b.el.contains(el) || el.contains(b.el))) return;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const box = R.boxOrChild(el);
      out.push({
        el,
        kind,
        text: R.text(el, 40) || el.getAttribute('aria-label') || el.value || '',
        height: Math.round(r.height),
        width: Math.round(r.width),
        radiusPx: R.radiusOf(el),
        radius: R.radiusLabel(R.radiusOf(el), r.height),
        boxed: box.hasBg || box.hasBorder,
        background: box.background,
        border: box.border,
        color: R.hexOf(cs.color),
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        textTransform: cs.textTransform,
      });
    };
    const native = document.querySelectorAll(
      'button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"]'
    );
    for (const el of native) {
      if (!R.visible(el) || R.inBanner(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.height < 24 || r.width < 24) continue;
      if (!(R.text(el, 1) || el.getAttribute('aria-label') || el.value)) continue;
      take(el, 'button');
    }
    for (const a of document.querySelectorAll('a[href]')) {
      if (!R.visible(a) || R.inBanner(a)) continue;
      const r = a.getBoundingClientRect();
      if (r.height < 32 || r.height > 64 || r.width > 420) continue;
      const t = R.text(a, 60);
      if (!t || t.length > 40) continue;
      const cs = getComputedStyle(a);
      const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const box = R.boxOrChild(a);
      if (!(box.hasBg || box.hasBorder)) continue;
      if (pad < 12 && box.node === a) continue;
      take(a, 'link');
    }
    R._buttons = out;
    return out;
  };

  // Cards ---------------------------------------------------------------------
  // 3+ siblings with the same tag and classes (or the same child structure when
  // there are no classes), each with a visible background, border or shadow
  // (on itself or a first child that fills it) and a heading or image inside.
  R.cardGroups = () => {
    if (R._cards) return R._cards;
    const head = R.headerRoot();
    const foot = R.footerRoot();
    const sigOf = (c) => {
      const cls = Array.from(c.classList)
        .filter((k) => !/^(is-|has-)?(active|selected|current|first|last|odd|even|open|hover|focus)/i.test(k))
        .sort()
        .join('.');
      return cls ? `${c.tagName}.${cls}` : `${c.tagName}>${Array.from(c.children).map((k) => k.tagName).join(',')}`;
    };
    const hasContent = (c) =>
      !!c.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"], img, picture, video') ||
      Array.from(c.querySelectorAll('svg')).some((s) => s.getBoundingClientRect().width >= 24);
    const groups = [];
    for (const p of document.querySelectorAll('body *')) {
      if (p.childElementCount < 3) continue;
      if ((head && head.el.contains(p)) || (foot && foot.contains(p)) || R.inBanner(p)) continue;
      const bySig = new Map();
      for (const c of p.children) {
        if (!R.visible(c)) continue;
        const sig = sigOf(c);
        if (!bySig.has(sig)) bySig.set(sig, []);
        bySig.get(sig).push(c);
      }
      for (const [sig, kids] of bySig) {
        if (kids.length < 3) continue;
        const members = kids.filter((c) => {
          const r = c.getBoundingClientRect();
          return r.width >= 100 && r.width <= 900 && r.height >= 60 && hasContent(c) && R.boxOrChild(c).any;
        });
        if (members.length < 3) continue;
        groups.push({ parent: p, sig, members });
      }
    }
    // Drop groups nested inside a member of another group.
    const kept = groups.filter((g) => !groups.some((o) => o !== g && o.members.some((m) => m.contains(g.parent))));
    R._cards = kept;
    return kept;
  };
  R.cardInfo = (el) => {
    const box = R.boxOrChild(el);
    const r = el.getBoundingClientRect();
    return {
      radius: R.radiusLabel(R.radiusOf(el), r.height),
      radiusPx: R.radiusOf(el),
      border: box.border,
      shadow: box.shadow,
      background: box.background,
    };
  };

  // Footer --------------------------------------------------------------------
  R.footerRoot = () => {
    if (R._footer !== undefined) return R._footer;
    const fs = Array.from(document.querySelectorAll('footer, [role="contentinfo"]')).filter(
      (el) => R.visible(el) && !el.closest('article, aside') && !R.inBanner(el)
    );
    const outer = fs.filter((el) => !fs.some((o) => o !== el && o.contains(el)));
    const area = (el) => {
      const r = el.getBoundingClientRect();
      return r.width * r.height;
    };
    outer.sort((a, b) => area(b) - area(a));
    let root = outer[0] || null;
    if (!root) {
      // No semantic footer: the full-width block around the last visible link
      // that reaches the bottom of the page. Prefer one with its own background.
      const cw = document.documentElement.clientWidth;
      const docH = document.documentElement.scrollHeight;
      const links = Array.from(document.querySelectorAll('a[href]')).filter((a) => R.visible(a) && !R.inBanner(a));
      const cands = [];
      for (let n = links[links.length - 1]; n && n !== document.body; n = n.parentElement) {
        const r = n.getBoundingClientRect();
        if (r.height > docH * 0.4) break;
        if (r.width >= cw * 0.9 && r.bottom + window.scrollY >= docH - 120) cands.push(n);
      }
      root = cands.find((n) => R.boxOf(n).hasBg) || cands[cands.length - 1] || null;
    }
    R._footer = root;
    return R._footer;
  };
  // Columns: find the smallest link groups in the footer (a heading or bold
  // title with links, or 2+ links stacked vertically), then count the distinct
  // left edges they start at. Wrappers and nesting do not change the count.
  R.footer = () => {
    const root = R.footerRoot();
    if (!root) return null;
    const headingLike = (el) =>
      Array.from(el.querySelectorAll('h2, h3, h4, h5, h6, [role="heading"], strong, b, p, span, div, li')).some((h) => {
        if (!R.visible(h) || h.closest('a, button')) return false;
        if (h.matches('h2, h3, h4, h5, h6, [role="heading"]')) return true;
        const own = R.ownText(h);
        return own.length > 1 && own.length <= 40 && Number(getComputedStyle(h).fontWeight) >= 600;
      });
    const isGroup = (el) => {
      const links = Array.from(el.querySelectorAll('a[href]')).filter(R.visible);
      if (!links.length) return false;
      if (headingLike(el)) return true;
      if (links.length < 2) return false;
      return new Set(links.map((a) => Math.round(a.getBoundingClientRect().top / 6))).size >= 2;
    };
    const minimal = [];
    const walk = (el, depth) => {
      const kids = Array.from(el.children).filter(R.visible);
      const sub = kids.filter(isGroup);
      if (!sub.length || depth > 8) {
        if (isGroup(el)) minimal.push(el);
        return;
      }
      for (const k of sub) walk(k, depth + 1);
    };
    walk(root, 0);
    const lefts = [];
    for (const g of minimal) {
      const l = g.getBoundingClientRect().left;
      if (!lefts.some((x) => Math.abs(x - l) <= 24)) lefts.push(l);
    }
    const columns = lefts.length;
    const r = root.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(root).lineHeight) || parseFloat(getComputedStyle(root).fontSize) * 1.4 || 20;
    return {
      columns,
      links: Array.from(root.querySelectorAll('a[href]')).filter(R.visible).length,
      height: Math.round(r.height),
      textLines: Math.round(r.height / lh),
      headings: Array.from(root.querySelectorAll('h2, h3, h4, h5, h6, [role="heading"]')).filter(R.visible).length,
    };
  };

  // Images --------------------------------------------------------------------
  R.isRasterSrc = (src) => !!src && !/\.svg(\?|#|$)|^data:image\/svg/i.test(src);
  R.media = () => {
    const out = [];
    for (const el of document.querySelectorAll('img, video, canvas, iframe[src*="map" i]')) {
      if (!R.visible(el) || R.inBanner(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 120 || r.height < 80) continue;
      const src = el.currentSrc || el.src || el.poster || '';
      if (el.tagName === 'IMG' && !R.isRasterSrc(src)) continue;
      out.push({ el, kind: el.tagName.toLowerCase(), top: R.docTop(el), width: r.width, height: r.height });
    }
    for (const el of document.querySelectorAll('body *')) {
      const bi = getComputedStyle(el).backgroundImage;
      if (!bi || !bi.includes('url(')) continue;
      const urls = bi.match(/url\(["']?([^"')]+)/g) || [];
      if (!urls.some((u) => R.isRasterSrc(u.replace(/^url\(["']?/, '')))) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 200 || r.height < 150 || !R.visible(el) || R.inBanner(el)) continue;
      out.push({ el, kind: 'background', top: R.docTop(el), width: r.width, height: r.height });
    }
    return out;
  };

  // Fold order ----------------------------------------------------------------
  // Major blocks that start within the first `limit` px, in reading order.
  R.foldOrder = (limit = 900) => {
    const blocks = [];
    const head = R.headerRoot();
    const groups = R.cardGroups();
    const inCards = (el) => groups.some((g) => g.members.some((m) => m.contains(el)));
    const inHead = (el) => head && head.el.contains(el);
    const add = (type, el, label) => {
      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY;
      if (top >= limit || r.bottom + window.scrollY <= 0) return;
      blocks.push({ type, top: Math.round(top), left: Math.round(r.left), el, label: label || '' });
    };
    if (head) add('nav', head.el, `${R.headerNav().count} links`);
    for (const el of document.querySelectorAll('nav, [role="navigation"]')) {
      if (!R.visible(el) || R.inBanner(el) || inHead(el) || inCards(el)) continue;
      if (blocks.some((b) => b.type === 'nav' && b.el.contains(el))) continue;
      const n = Array.from(el.querySelectorAll('a[href]')).filter(R.visible).length;
      if (n) add('nav', el, `${n} links`);
    }
    for (const g of groups) {
      const r = g.parent.getBoundingClientRect();
      if (r.top + window.scrollY < limit) add('card-grid', g.members[0], `${g.members.length} cards`);
    }
    for (const el of document.querySelectorAll('h1, h2, h3')) {
      if (!R.visible(el) || R.inBanner(el) || inHead(el) || inCards(el)) continue;
      add('heading', el, `${el.tagName.toLowerCase()}: ${R.text(el, 50)}`);
    }
    const seenForms = new Set();
    for (const el of document.querySelectorAll('form, [role="search"], input:not([type="hidden"]), select, textarea')) {
      if (!R.visible(el) || R.inBanner(el) || inHead(el) || inCards(el)) continue;
      const f = el.closest('form, [role="search"]') || el;
      if (seenForms.has(f) || (f !== el && (inHead(f) || !R.visible(f)))) continue;
      seenForms.add(f);
      const isSearch =
        f.matches('[role="search"]') ||
        !!f.querySelector('input[type="search"]') ||
        (el.matches('input') && el.type === 'search') ||
        [f, el, f.querySelector('input')].some(
          (n) =>
            n &&
            /search|haku|hae|etsi|query|(^|\s)q(\s|$)/i.test(
              ['action', 'class', 'name', 'placeholder', 'aria-label', 'id'].map((a) => n.getAttribute(a) || '').join(' ')
            )
        );
      add(isSearch ? 'search' : 'form', f);
    }
    // Search widgets without a form (buttons and comboboxes), and other CTAs.
    for (const b of R.buttons()) {
      if (!b.boxed || inHead(b.el) || inCards(b.el)) continue;
      if (blocks.some((x) => (x.type === 'search' || x.type === 'form') && x.el.contains(b.el))) continue;
      const searchy = /search|find|hae|haku|etsi|löydä|vertaa|compare/i.test(b.text + ' ' + (b.el.getAttribute('aria-label') || ''));
      let host = null;
      if (searchy) {
        for (let n = b.el.parentElement; n && n !== document.body; n = n.parentElement) {
          const r = n.getBoundingClientRect();
          if (r.width >= 300 && r.height <= 300 && R.boxOf(n).any) {
            host = n;
            break;
          }
        }
      }
      if (host) {
        if (!blocks.some((x) => x.el === host)) add('search', host, b.text);
      } else add('cta', b.el, b.text);
    }
    for (const m of R.media()) {
      if (inHead(m.el) || inCards(m.el)) continue;
      add('image', m.el, `${Math.round(m.width)}x${Math.round(m.height)} ${m.kind}`);
    }
    for (const el of document.querySelectorAll('p, div, span')) {
      if (!R.visible(el) || R.inBanner(el) || inHead(el) || inCards(el) || el.closest('nav, form, footer, button, a')) continue;
      if (el.tagName === 'P' ? R.text(el, 200).length < 40 : R.ownText(el).length < 40) continue;
      if (blocks.some((x) => x.type === 'text' && x.el.contains(el))) continue;
      add('text', el, R.text(el, 40));
    }
    // Drop blocks nested inside a media, form or card block.
    const containers = blocks.filter((b) => ['image', 'form', 'search', 'cta'].includes(b.type));
    const kept = blocks.filter((b) => !containers.some((c) => c !== b && c.el.contains(b.el) && b.type !== 'heading'));
    kept.sort((a, b) => a.top - b.top || a.left - b.left);
    const merged = [];
    for (const b of kept) {
      const last = merged[merged.length - 1];
      if (last && last.type === b.type && (b.type === 'text' || b.type === 'image' || b.type === 'cta')) {
        last.count = (last.count || 1) + 1;
        continue;
      }
      merged.push(b);
    }
    return merged.map(({ el, ...b }) => b);
  };

  window.__rsd = R;
}

// Full measurement used by measure.mjs.
export function measure(foldLimit) {
  const R = window.__rsd;
  const all = Array.from(document.querySelectorAll('body *')).filter((el) => R.visible(el));
  const bodyCs = getComputedStyle(document.body);
  const typo = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      text: R.text(el),
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      textTransform: cs.textTransform,
      color: R.hexOf(cs.color),
    };
  };

  let ps = Array.from(document.querySelectorAll('p')).filter((p) => R.visible(p) && !R.inBanner(p) && R.text(p, 1));
  if (ps.length < 3) {
    // Some sites set body copy in divs and spans only.
    ps = Array.from(document.querySelectorAll('div, span')).filter((el) => R.ownText(el).length >= 40 && R.visible(el) && !R.inBanner(el));
  }
  const pStyles = ps.map((p) => {
    const cs = getComputedStyle(p);
    return `${cs.fontSize}|${cs.lineHeight}|${R.hexOf(cs.color)}|${R.firstFamily(cs.fontFamily)}`;
  });
  const topP = R.mode(pStyles)[0];
  const [pSize, pLh, pColor, pFamily] = topP ? topP.value.split('|') : [];
  const h1 = Array.from(document.querySelectorAll('h1')).find((el) => R.visible(el) && !R.inBanner(el)) || null;
  const h2 = Array.from(document.querySelectorAll('h2')).find((el) => R.visible(el) && !R.inBanner(el)) || null;

  const colours = new Set(), textColours = new Set(), bgColours = new Set();
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (R.ownText(el)) {
      const c = R.hexOf(cs.color);
      if (c) colours.add(c), textColours.add(c);
    }
    const bg = R.hexOf(cs.backgroundColor);
    if (bg) colours.add(bg), bgColours.add(bg);
    if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') {
      const bc = R.hexOf(cs.borderTopColor);
      if (bc) colours.add(bc);
    }
  }
  const hexToC = (h) => {
    const n = parseInt(h.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  };

  const vw = document.documentElement.clientWidth;
  const maxWidths = [];
  for (const el of all) {
    const mw = getComputedStyle(el).maxWidth;
    if (!mw.endsWith('px')) continue;
    const v = parseFloat(mw);
    if (v >= 600 && v < vw && el.getBoundingClientRect().width >= vw * 0.4) maxWidths.push(Math.round(v));
  }
  const maxWidthModes = R.mode(maxWidths).slice(0, 5);

  const btns = R.buttons();
  const boxed = btns.filter((b) => b.boxed);
  const heights = boxed.map((b) => b.height);

  const groups = R.cardGroups();
  const cards = groups.flatMap((g) => g.members.map(R.cardInfo));

  let shadowCount = 0;
  const borderWidths = [];
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.boxShadow !== 'none') shadowCount++;
    for (const side of ['Top', 'Bottom']) {
      const w = parseFloat(cs[`border${side}Width`]);
      if (w > 0 && cs[`border${side}Style`] !== 'none') borderWidths.push(`${w}px`);
    }
  }

  const media = R.media();
  const vh = window.innerHeight;

  const uppercaseLabels = all.filter((el) => {
    const cs = getComputedStyle(el);
    return cs.textTransform === 'uppercase' && parseFloat(cs.letterSpacing) > 0 && parseFloat(cs.fontSize) < 15 && R.ownText(el);
  }).length;

  return {
    title: document.title,
    fontsLoaded: Array.from(
      new Set(Array.from(document.fonts).filter((f) => f.status === 'loaded').map((f) => `${f.family.replace(/["']/g, '')} ${f.weight}`))
    ),
    body: { fontFamily: bodyCs.fontFamily, fontSize: bodyCs.fontSize, lineHeight: bodyCs.lineHeight, color: R.hexOf(bodyCs.color) },
    paragraph: topP ? { fontFamily: pFamily, fontSize: pSize, lineHeight: pLh, color: pColor, sampleCount: topP.count } : null,
    h1: typo(h1),
    h2: typo(h2),
    colours: {
      pageBackground: R.hex(R.pageBg()),
      text: Array.from(textColours),
      backgrounds: Array.from(bgColours),
      distinctCount: colours.size,
      chromatic: Array.from(colours).filter((h) => R.isChromatic(hexToC(h))),
    },
    maxContentWidth: maxWidthModes.length ? Math.max(...maxWidthModes.map((m) => Number(m.value))) : null,
    maxWidthValues: maxWidthModes,
    buttons: {
      count: btns.length,
      boxed: boxed.length,
      radius: R.mode(boxed.map((b) => b.radius)).slice(0, 5),
      height: heights.length ? { min: Math.min(...heights), median: R.median(heights), max: Math.max(...heights) } : null,
      heights: R.mode(heights.map((h) => `${h}px`)).slice(0, 5),
      samples: boxed.slice(0, 6).map(({ el, radiusPx, ...b }) => b),
    },
    cards: {
      groups: groups.length,
      count: cards.length,
      radius: R.mode(cards.map((c) => c.radius)).slice(0, 4),
      border: R.mode(cards.map((c) => c.border)).slice(0, 3),
      shadow: R.mode(cards.map((c) => c.shadow)).slice(0, 3),
      background: R.mode(cards.map((c) => c.background || 'none')).slice(0, 3),
      samples: groups.slice(0, 6).map((g) => {
        const r = g.members[0].getBoundingClientRect();
        return {
          size: g.members.length,
          signature: g.sig.slice(0, 80),
          width: Math.round(r.width),
          height: Math.round(r.height),
          top: Math.round(R.docTop(g.members[0])),
          ...R.cardInfo(g.members[0]),
        };
      }),
    },
    bordersAndShadows: { elementsWithShadow: shadowCount, borderWidths: R.mode(borderWidths).slice(0, 5) },
    images: {
      count: media.filter((m) => m.kind !== 'background').length,
      aboveFold: media.filter((m) => m.kind !== 'background' && m.top < vh).length,
      largeBackgroundImages: media.filter((m) => m.kind === 'background').length,
      svgCount: document.querySelectorAll('svg').length,
    },
    headerNav: R.headerNav(),
    footer: R.footer(),
    foldOrder: R.foldOrder(foldLimit),
    uppercaseTrackedLabels: uppercaseLabels,
  };
}

// Raw values for the fingerprint checks at desktop width (check.mjs).
export function desktopData(foldLimit) {
  const R = window.__rsd;
  const cw = document.documentElement.clientWidth;
  const all = Array.from(document.querySelectorAll('body *')).filter((el) => R.visible(el) && !R.inBanner(el));
  const out = {};

  // h1 ---------------------------------------------------------------------
  const h1 = Array.from(document.querySelectorAll('h1')).find((el) => R.visible(el) && !R.inBanner(el)) || null;
  if (h1) {
    const cs = getComputedStyle(h1);
    const fs = parseFloat(cs.fontSize);
    const lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight);
    const ls = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing);
    // Fluid size declared in CSS: clamp() or vw in a rule that matches the h1.
    let cssFluid = false;
    const fluid = (v) => {
      if (!v) return false;
      let s = v;
      for (let i = 0; i < 4 && /var\(/.test(s); i++) {
        s = s.replace(/var\((--[\w-]+)[^)]*\)/g, (_, name) => getComputedStyle(h1).getPropertyValue(name) || '');
      }
      return /clamp\(|[\d.]vw|[\d.]vi\b|[\d.]cqi/.test(s);
    };
    const scan = (rules) => {
      for (const rule of rules) {
        if (cssFluid) return;
        if (rule.cssRules && !rule.selectorText) scan(rule.cssRules);
        else if (rule.selectorText && rule.style) {
          let match = false;
          try {
            match = h1.matches(rule.selectorText);
          } catch {
            match = false;
          }
          if (match && fluid(rule.style.fontSize || rule.style.getPropertyValue('font'))) cssFluid = true;
        }
      }
    };
    let sheetsReadable = 0, sheetsBlocked = 0;
    for (const sheet of document.styleSheets) {
      try {
        scan(sheet.cssRules);
        sheetsReadable++;
      } catch {
        sheetsBlocked++;
      }
    }
    if (fluid(h1.style.fontSize)) cssFluid = true;
    out.h1 = {
      text: R.text(h1, 60),
      fontSize: fs,
      lineHeightRatio: Math.round((lh / fs) * 100) / 100,
      letterSpacingEm: Math.round((ls / fs) * 1000) / 1000,
      cssFluid,
      sheetsReadable,
      sheetsBlocked,
      endsWithStop: /[.]$/.test(R.text(h1, 500)),
    };
  } else out.h1 = null;

  // Background and accents -------------------------------------------------
  const page = R.pageBg();
  out.background = { hex: R.hex(page), luminance: Math.round(R.luminance(page) * 1000) / 1000, ...R.hsl(page) };
  const uses = new Map();
  const use = (c) => {
    if (!R.isChromatic(c)) return;
    const h = R.hex(c);
    uses.set(h, (uses.get(h) || 0) + 1);
  };
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (R.ownText(el)) {
      const c = R.parseColor(cs.color);
      if (c) use(R.blend(c, R.bgOf(el).colour));
    }
    const box = R.boxOf(el);
    if (box.hasBg && box.background !== 'gradient') use(R.parseColor(box.background));
    for (const s of ['Top', 'Right', 'Bottom', 'Left']) {
      if ((parseFloat(cs[`border${s}Width`]) || 0) > 0 && cs[`border${s}Style`] !== 'none') {
        const c = R.parseColor(cs[`border${s}Color`]);
        if (c) use(c);
      }
    }
  }
  // Cluster colours by hue (within 20 degrees), most used first.
  const hexToC = (h) => {
    const n = parseInt(h.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  };
  const sorted = Array.from(uses.entries()).sort((a, b) => b[1] - a[1]);
  const clusters = [];
  for (const [hx, n] of sorted) {
    const c = hexToC(hx);
    const { h } = R.hsl(c);
    const cl = clusters.find((k) => Math.min(Math.abs(k.hue - h), 360 - Math.abs(k.hue - h)) <= 20);
    if (cl) cl.uses += n;
    else clusters.push({ hue: Math.round(h), hex: hx, uses: n, ...(({ s, l }) => ({ s: Math.round(s * 100) / 100, l: Math.round(l * 100) / 100 }))(R.hsl(c)) });
  }
  clusters.sort((a, b) => b.uses - a.uses);
  out.accents = clusters.slice(0, 8);

  // Shell and full-bleed bands ---------------------------------------------
  const shells = [];
  const bands = [];
  const docH = document.documentElement.scrollHeight;
  for (const el of all) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const mw = parseFloat(cs.maxWidth);
    if (cs.maxWidth.endsWith('px') && mw >= 1200 && mw <= 1440 && r.width <= mw + 1 && r.width < cw - 40) {
      const centred = Math.abs(r.left - (cw - r.right)) < 4;
      if (centred) shells.push(Math.round(mw));
    }
    if (r.width >= cw - 2 && r.height >= 60 && r.height < docH * 0.8) {
      const box = R.boxOf(el);
      const differs = box.hasBg && box.background !== 'gradient' && R.dist(R.parseColor(box.background), page) > 10;
      const media = Array.from(el.querySelectorAll('img, video, canvas, iframe')).some(
        (m) => m.getBoundingClientRect().width >= cw * 0.9 && R.visible(m)
      );
      const img = cs.backgroundImage !== 'none';
      if (differs || media || img || ['IMG', 'VIDEO', 'CANVAS', 'IFRAME'].includes(el.tagName)) bands.push(el);
    }
  }
  const outerBands = bands.filter((b) => !bands.some((o) => o !== b && o.contains(b)));
  out.shell = {
    width: R.mode(shells)[0] ? Number(R.mode(shells)[0].value) : null,
    shellElements: shells.length,
    fullBleedBands: outerBands.length,
    bandSamples: outerBands.slice(0, 5).map((b) => `${b.tagName.toLowerCase()}${b.id ? '#' + b.id : ''} ${Math.round(b.getBoundingClientRect().height)}px`),
  };

  // Ruled-row lists --------------------------------------------------------
  const lists = Array.from(document.querySelectorAll('ul, ol')).filter((l) => {
    if (!R.visible(l) || R.inBanner(l)) return false;
    return Array.from(l.children).filter((c) => c.tagName === 'LI' && R.visible(c)).length >= 2;
  });
  const ruledLists = lists.filter((l) => {
    if (getComputedStyle(l).listStyleType !== 'none') {
      const lis = Array.from(l.children).filter((c) => c.tagName === 'LI');
      if (lis.every((li) => getComputedStyle(li).listStyleType !== 'none')) return false;
    }
    const lis = Array.from(l.children).filter((c) => c.tagName === 'LI' && R.visible(c));
    const ruled = lis.filter((li) => {
      const t = li.firstElementChild && li.children.length === 1 ? [li, li.firstElementChild] : [li];
      return t.some((n) => {
        const cs = getComputedStyle(n);
        return ['Top', 'Bottom'].some((s) => {
          const w = parseFloat(cs[`border${s}Width`]) || 0;
          return w > 0 && w <= 2 && cs[`border${s}Style`] !== 'none' && (parseFloat(cs[`border${s === 'Top' ? 'Left' : 'Right'}Width`]) || 0) === 0;
        });
      });
    });
    return ruled.length >= lis.length * 0.5;
  });
  out.ruledLists = { lists: lists.length, ruled: ruledLists.length };

  // Thick + thin rules ------------------------------------------------------
  let thick = 0, thin = 0;
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width < 300) continue;
    const cs = getComputedStyle(el);
    for (const s of ['Top', 'Bottom']) {
      const w = parseFloat(cs[`border${s}Width`]) || 0;
      if (!w || cs[`border${s}Style`] === 'none') continue;
      const sideW = parseFloat(cs.borderLeftWidth) || 0;
      if (sideW > 0) continue; // a box, not a rule
      const c = R.parseColor(cs[`border${s}Color`]);
      if (!c) continue;
      if (w >= 2 && w <= 4 && R.luminance(R.blend(c, page)) < 0.2) thick++;
      else if (w <= 1.5) thin++;
    }
  }
  for (const hr of document.querySelectorAll('hr')) {
    if (!R.visible(hr)) continue;
    const h = hr.getBoundingClientRect().height;
    if (h >= 2 && h <= 5) thick++;
    else thin++;
  }
  out.rules = { thick, thin };

  // Photos ---------------------------------------------------------------
  const media = R.media();
  out.photos = { count: media.length, aboveFold: media.filter((m) => m.top < foldLimit).length };

  // Uppercase tracked labels and kickers ------------------------------------
  const isLabel = (el) => {
    if (!el || !R.visible(el)) return false;
    const cs = getComputedStyle(el);
    return cs.textTransform === 'uppercase' && parseFloat(cs.letterSpacing) > 0 && parseFloat(cs.fontSize) < 15 && !!R.text(el, 1);
  };
  const labels = all.filter((el) => isLabel(el) && R.ownText(el) && !el.closest('button, [role="button"]'));
  let kickers = 0;
  for (const h of document.querySelectorAll('h1, h2')) {
    if (!R.visible(h)) continue;
    let prev = h.previousElementSibling;
    if (!prev && h.parentElement) prev = h.parentElement.previousElementSibling;
    if (prev && (isLabel(prev) || Array.from(prev.querySelectorAll('*')).some(isLabel) || /\S\s·\s\S/.test(R.text(prev, 200)))) kickers++;
  }
  out.labels = { count: labels.length, kickers };

  // Text nodes: middots, fonts, mono ------------------------------------------
  let middots = 0, middotsInFold = 0;
  const famChars = {};
  let monoChars = 0, monoEls = new Set(), totalChars = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.nodeValue.trim();
    if (!t) continue;
    const p = n.parentElement;
    if (!p || p.closest('script, style, noscript, template') || !R.visible(p) || R.inBanner(p)) continue;
    const m = t.match(/\S\s+·\s+\S/g);
    if (m) {
      middots += m.length;
      if (R.docTop(p) < foldLimit) middotsInFold += m.length;
    }
    const cs = getComputedStyle(p);
    const fam = R.firstFamily(cs.fontFamily);
    if (R.isIconFont(fam)) continue;
    const code = !!p.closest('code, pre, kbd, samp, var, tt');
    if (code) continue;
    totalChars += t.length;
    famChars[fam] = (famChars[fam] || 0) + t.length;
    if (R.isMono(cs.fontFamily)) {
      monoChars += t.length;
      monoEls.add(p);
    }
  }
  out.middots = { count: middots, inFold: middotsInFold };
  out.fonts = {
    families: Object.entries(famChars)
      .map(([family, chars]) => ({ family, share: Math.round((chars / Math.max(totalChars, 1)) * 1000) / 1000 }))
      .sort((a, b) => b.share - a.share),
    monoElements: monoEls.size,
    monoShare: Math.round((monoChars / Math.max(totalChars, 1)) * 1000) / 1000,
  };

  // Footer ----------------------------------------------------------------
  out.footer = R.footer();

  // Square corners --------------------------------------------------------
  const radii = [];
  for (const b of R.buttons()) if (b.boxed) radii.push(b.radiusPx);
  for (const el of document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), select, textarea')) {
    if (!R.visible(el)) continue;
    const box = R.boxOrChild(el);
    if (box.hasBg || box.hasBorder) radii.push(R.radiusOf(el));
  }
  for (const g of R.cardGroups()) for (const m of g.members) radii.push(R.radiusOf(m));
  out.corners = {
    elements: radii.length,
    square: radii.filter((r) => r <= 1).length,
    max: radii.length ? Math.round(Math.max(...radii)) : null,
  };

  // h2 + narrow lead --------------------------------------------------------
  const h2s = Array.from(document.querySelectorAll('h2')).filter((h) => R.visible(h) && !R.inBanner(h));
  let leads = 0;
  for (const h of h2s) {
    const p = h.nextElementSibling;
    if (!p || p.tagName !== 'P' || !R.visible(p)) continue;
    const words = R.text(p, 2000).split(/\s+/).filter(Boolean).length;
    const w = p.getBoundingClientRect().width;
    const parentW = p.parentElement.getBoundingClientRect().width;
    if (words >= 10 && words <= 25 && w <= 620 && w < parentW * 0.85) leads++;
  }
  out.leads = { h2: h2s.length, withNarrowLead: leads };

  // Code skeleton -----------------------------------------------------------
  const rootCs = getComputedStyle(document.documentElement);
  const tokens = ['--bg', '--ink', '--ink-2', '--line', '--focus', '--paper', '--rule', '--measure', '--shell', '--wide'].filter(
    (t) => rootCs.getPropertyValue(t).trim() !== ''
  );
  const sections = Array.from(document.querySelectorAll('section'));
  out.skeleton = {
    tokens,
    sections: sections.length,
    labelledby: sections.filter((s) => s.hasAttribute('aria-labelledby')).length,
  };

  // Split hero ------------------------------------------------------------
  let split = false;
  if (h1) {
    let a = h1;
    for (let i = 0; i < 6 && a.parentElement && a.parentElement !== document.body; i++, a = a.parentElement) {
      const ra = a.getBoundingClientRect();
      const sibs = Array.from(a.parentElement.children).filter((s) => {
        if (s === a || !R.visible(s)) return false;
        const rs = s.getBoundingClientRect();
        return rs.top < ra.bottom && rs.bottom > ra.top && (rs.left >= ra.right - 1 || rs.right <= ra.left + 1);
      });
      if (sibs.length) {
        split = sibs.some((s) => s.querySelector('form, input, select, textarea, table') || s.matches('form, ul, ol, table') || Array.from(s.querySelectorAll('ul, ol')).some((l) => l.children.length >= 3));
        break;
      }
    }
  }
  out.splitHero = split;

  // tabular-nums outside tables --------------------------------------------
  out.tabularNums = all.filter(
    (el) => /tabular-nums/.test(getComputedStyle(el).fontVariantNumeric) && R.ownText(el) && !el.closest('table')
  ).length;

  // Contrast ----------------------------------------------------------------
  const mediaRects = media.filter((m) => m.kind !== 'background').map((m) => m.el.getBoundingClientRect());
  const fails = [];
  let checked = 0, unknown = 0;
  for (const el of all) {
    const own = R.ownText(el);
    if (!own || el.closest('[disabled], [aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el);
    const fg = R.parseColor(cs.color);
    if (!fg) continue;
    const { colour: bg, image } = R.bgOf(el);
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (image || mediaRects.some((m) => cx >= m.left && cx <= m.right && cy >= m.top && cy <= m.bottom && !el.contains(document.elementFromPoint?.(cx, cy)))) {
      unknown++;
      continue;
    }
    const ratio = R.contrast(R.blend(fg, bg), bg);
    const size = parseFloat(cs.fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
    const min = large ? 3 : 4.5;
    checked++;
    if (ratio < min) fails.push({ text: own.slice(0, 40), ratio: Math.round(ratio * 100) / 100, fg: R.hex(R.blend(fg, bg)), bg: R.hex(bg), min });
  }
  fails.sort((a, b) => a.ratio - b.ratio);
  out.contrast = { checked, unknown, failing: fails.length, worst: fails.slice(0, 5) };

  // Copy ----------------------------------------------------------------------
  const head = R.headerRoot();
  const foot = R.footerRoot();
  const prose = [];
  for (const el of document.querySelectorAll('p, li, blockquote, dd, figcaption')) {
    if (!R.visible(el) || R.inBanner(el) || el.closest('nav, button, [role="button"]')) continue;
    if ((head && head.el.contains(el)) || (foot && foot.contains(el))) continue;
    if (el.querySelector('p, li')) continue; // take the innermost block
    const t = R.text(el, 5000);
    if (t.split(/\s+/).length < 3) continue;
    prose.push(t);
  }
  // Copy set in divs and spans (no <p>): take their own text when it reads as prose.
  for (const el of document.querySelectorAll('div, span')) {
    const own = R.ownText(el);
    if (own.split(/\s+/).length < 6 || !R.visible(el) || R.inBanner(el) || el.closest('nav, button, a, [role="button"], p, li')) continue;
    if ((head && head.el.contains(el)) || (foot && foot.contains(el))) continue;
    prose.push(own);
  }
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, [role="heading"]'))
    .filter((h) => R.visible(h) && !R.inBanner(h))
    .map((h) => R.text(h, 200));
  const shortLines = [];
  for (const el of document.querySelectorAll('p, span, small, li, div, strong, em, dd')) {
    if (!R.visible(el) || R.inBanner(el) || el.closest('a, button, [role="button"], label, select')) continue;
    const own = R.ownText(el);
    if (!own) continue;
    const t = R.text(el, 200);
    if (t.split(/\s+/).length <= 8 && !Array.from(el.children).some((c) => /^(P|DIV|LI|UL)$/.test(c.tagName))) shortLines.push(t);
  }
  out.copy = { prose, headings, shortLines, allText: document.body.innerText };
  return out;
}

// h1 font size at the current viewport width (for the fluid-size probe).
export function h1Size() {
  const R = window.__rsd;
  const h1 = Array.from(document.querySelectorAll('h1')).find((el) => R.visible(el) && !R.inBanner(el));
  return h1 ? parseFloat(getComputedStyle(h1).fontSize) : null;
}

// Raw values at mobile width (check.mjs).
export function mobileData() {
  const R = window.__rsd;
  const de = document.documentElement;
  const cw = de.clientWidth;
  const overflow = Math.max(de.scrollWidth, document.body.scrollWidth) - cw;
  let widest = null;
  if (overflow > 1) {
    let max = cw;
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.right > max + 1 && R.visible(el)) {
        max = r.right;
        widest = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''} (${Math.round(r.right)}px)`;
      }
    }
  }
  const small = [];
  let targets = 0;
  const sel = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])';
  const els = Array.from(document.querySelectorAll(sel)).filter((el) => R.visible(el) && !R.inBanner(el));
  for (const el of els) {
    if (els.some((o) => o !== el && o.contains(el))) continue; // count the outer target
    let r = el.getBoundingClientRect();
    if (el.matches('input[type="checkbox"], input[type="radio"]')) {
      const lab = el.closest('label') || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`));
      if (lab) r = lab.getBoundingClientRect();
    }
    // Links inside running text are exempt.
    if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') {
      const block = el.closest('p, li, td, dd, blockquote, figcaption, span');
      if (block && R.text(block, 2000).length > R.text(el, 2000).length + 10) continue;
    }
    targets++;
    if (r.width < 44 || r.height < 44) {
      small.push(`${(R.text(el, 24) || el.getAttribute('aria-label') || el.tagName.toLowerCase())} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  }
  return { overflow: Math.max(0, Math.round(overflow)), widest, targets, small: small.length, smallSamples: small.slice(0, 6) };
}

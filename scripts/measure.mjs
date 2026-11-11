#!/usr/bin/env node
// Measure the computed design conventions of real sites.
//
// Usage:
//   node scripts/measure.mjs <url> [<url> ...] [--out <dir>]
//
// Prints a JSON array (one object per URL) to stdout and saves a 1440x900
// screenshot of the first screen per URL into the output dir (default
// ./measure-out). Needs Playwright: `npm install` then
// `npx playwright install chromium` if no browser is cached yet.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
let outDir = 'measure-out';
const urls = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') outDir = args[++i];
  else if (args[i] === '-h' || args[i] === '--help') {
    console.error('Usage: node scripts/measure.mjs <url> [<url> ...] [--out <dir>]');
    process.exit(0);
  } else urls.push(args[i]);
}
if (urls.length === 0) {
  console.error('Usage: node scripts/measure.mjs <url> [<url> ...] [--out <dir>]');
  process.exit(1);
}

const VIEWPORT = { width: 1440, height: 900 };
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

// Best effort: close a cookie or consent dialog so it does not cover the
// screenshot. Tries a reject button first, then accept. Silent if none found.
const CONSENT_BUTTONS = [
  /^(reject all|reject|decline|reject analytics cookies|use necessary cookies only|only necessary)$/i,
  /^(accept all|accept|accept all cookies|accept cookies|allow all|agree|i agree|got it|ok)$/i,
];
async function dismissConsent(page) {
  for (const name of CONSENT_BUTTONS) {
    const btn = page.getByRole('button', { name }).first();
    try {
      if (await btn.isVisible({ timeout: 500 })) {
        await btn.click({ timeout: 2000 });
        await page.waitForTimeout(800);
        return true;
      }
    } catch {
      // ignore and try the next pattern
    }
  }
  return false;
}

function slug(url) {
  const u = new URL(url);
  return (u.hostname + u.pathname).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

// Runs inside the page. Must be self-contained.
function collect() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return false;
    // visually hidden pattern (clip / 1px boxes)
    if (r.width <= 1 && r.height <= 1) return false;
    return true;
  };

  const rgbToHex = (c) => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    if (p.length >= 4 && p[3] === 0) return null; // transparent
    return '#' + p.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, '0')).join('').toUpperCase();
  };

  const firstFamily = (ff) => (ff || '').split(',')[0].replace(/["']/g, '').trim();

  const text = (el, n = 80) => (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, n);

  const typo = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      text: text(el),
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      textTransform: cs.textTransform,
      color: rgbToHex(cs.color),
    };
  };

  const mode = (arr) => {
    const counts = {};
    for (const v of arr) counts[v] = (counts[v] || 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count }));
  };

  // Skip cookie and consent banners so their buttons and headings do not count.
  const inBanner = (el) => !!el.closest('[id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i], [id*="onetrust" i]');

  const all = Array.from(document.querySelectorAll('body *')).filter(visible);

  // Page background: first non-transparent of body, html; else white.
  const bodyCs = getComputedStyle(document.body);
  const pageBg =
    rgbToHex(bodyCs.backgroundColor) || rgbToHex(getComputedStyle(document.documentElement).backgroundColor) || '#FFFFFF';

  // Body text: the most common style among visible <p> elements, falling back to body.
  const ps = Array.from(document.querySelectorAll('main p, article p, p')).filter(visible);
  const pStyles = ps.map((p) => {
    const cs = getComputedStyle(p);
    return `${cs.fontSize}|${cs.lineHeight}|${rgbToHex(cs.color)}|${firstFamily(cs.fontFamily)}`;
  });
  const topP = mode(pStyles)[0];
  const [pSize, pLh, pColor, pFamily] = topP ? topP.value.split('|') : [];

  const h1 = Array.from(document.querySelectorAll('h1')).find((el) => visible(el) && !inBanner(el)) || null;
  const h2 = Array.from(document.querySelectorAll('h2')).find((el) => visible(el) && !inBanner(el)) || null;

  // Colours across visible elements (text, background, borders).
  const colours = new Set();
  const textColours = new Set();
  const bgColours = new Set();
  for (const el of all) {
    const cs = getComputedStyle(el);
    const c = rgbToHex(cs.color);
    if (c && (el.childNodes.length && text(el, 1))) {
      colours.add(c);
      textColours.add(c);
    }
    const bg = rgbToHex(cs.backgroundColor);
    if (bg) {
      colours.add(bg);
      bgColours.add(bg);
    }
    if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') {
      const bc = rgbToHex(cs.borderTopColor);
      if (bc) colours.add(bc);
    }
  }
  const isChromatic = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    return max - min > 40; // crude saturation test: not grey/white/black
  };

  // Max content width: px max-width values on wide visible elements.
  const maxWidths = [];
  for (const el of all) {
    const mw = getComputedStyle(el).maxWidth;
    if (!mw.endsWith('px')) continue;
    const v = parseFloat(mw);
    const w = el.getBoundingClientRect().width;
    if (v >= 600 && v < vw && w >= vw * 0.4) maxWidths.push(Math.round(v));
  }
  const maxWidthModes = mode(maxWidths).slice(0, 5);

  // Buttons.
  const btnSel =
    'button, [role="button"], input[type="submit"], input[type="button"], a[class*="btn" i], a[class*="button" i], a[class*="cta" i]';
  const buttons = Array.from(document.querySelectorAll(btnSel))
    .filter((el) => visible(el) && !inBanner(el))
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width >= 40 && r.height >= 24;
    });
  const btnInfo = buttons.map((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      text: text(el, 40),
      radius: cs.borderTopLeftRadius,
      background: rgbToHex(cs.backgroundColor),
      color: rgbToHex(cs.color),
      height: Math.round(r.height),
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      textTransform: cs.textTransform,
    };
  });
  const filledButtons = btnInfo.filter((b) => b.background);

  // Cards: 140-600px wide, contains an image or heading, and has its own
  // radius, border, shadow or background.
  const cards = all.filter((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 140 || r.width > 600 || r.height < 80) return false;
    if (!el.querySelector('img, picture, svg, h2, h3, h4')) return false;
    const cs = getComputedStyle(el);
    const hasRadius = parseFloat(cs.borderTopLeftRadius) > 0;
    const hasBorder = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
    const hasShadow = cs.boxShadow !== 'none';
    const bg = rgbToHex(cs.backgroundColor);
    const parentBg = el.parentElement ? rgbToHex(getComputedStyle(el.parentElement).backgroundColor) : null;
    const hasBg = bg && bg !== parentBg;
    return hasRadius || hasBorder || hasShadow || hasBg;
  });
  const cardInfo = cards.map((el) => {
    const cs = getComputedStyle(el);
    const bw = parseFloat(cs.borderTopWidth);
    return {
      radius: cs.borderTopLeftRadius,
      border: bw > 0 && cs.borderTopStyle !== 'none' ? `${cs.borderTopWidth} ${cs.borderTopStyle} ${rgbToHex(cs.borderTopColor)}` : 'none',
      shadow: cs.boxShadow,
      background: rgbToHex(cs.backgroundColor),
    };
  });

  // Borders and shadows on the whole page.
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

  // Images.
  const imgs = Array.from(document.querySelectorAll('img, picture > img, video')).filter(visible);
  const bigImgs = imgs.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 80 && r.height > 80;
  });
  const aboveFold = bigImgs.filter((el) => el.getBoundingClientRect().top < vh);
  const bgImages = all.filter((el) => {
    const bi = getComputedStyle(el).backgroundImage;
    const r = el.getBoundingClientRect();
    return bi && bi.includes('url(') && r.width > 200 && r.height > 150;
  });

  // Header nav items: visible links and buttons in the page header, plus any
  // <nav> that starts in the top 600px of the document (many sites put the main
  // nav just below <header>, and cookie banners can push it down).
  const navRoots = Array.from(document.querySelectorAll('header, [role="banner"], nav')).filter(
    (el) => visible(el) && !inBanner(el) && el.getBoundingClientRect().top + window.scrollY < 600 && !el.closest('footer, main, article, aside')
  );
  const navEls = new Set();
  for (const root of navRoots) {
    for (const el of root.querySelectorAll('a, button')) if (visible(el)) navEls.add(el);
  }
  const navItems = Array.from(navEls)
    .map((el) => text(el, 40))
    .filter(Boolean);

  // Footer columns (rough): direct-ish link groups in the footer.
  const footer = document.querySelector('footer') || document.querySelector('[role="contentinfo"]');
  let footerLinkCount = 0;
  let footerColumns = 0;
  if (footer) {
    footerLinkCount = Array.from(footer.querySelectorAll('a')).filter(visible).length;
    footerColumns = Array.from(footer.querySelectorAll('ul, ol')).filter(
      (el) => visible(el) && el.querySelectorAll('a').length >= 2 && !el.parentElement.closest('ul, ol')
    ).length;
  }

  // Uppercase tracked small labels (a common AI-template tell).
  const uppercaseLabels = all.filter((el) => {
    const cs = getComputedStyle(el);
    return (
      cs.textTransform === 'uppercase' &&
      parseFloat(cs.letterSpacing) > 0 &&
      parseFloat(cs.fontSize) < 15 &&
      text(el, 1)
    );
  }).length;

  return {
    title: document.title,
    fontsLoaded: Array.from(new Set(Array.from(document.fonts).filter((f) => f.status === 'loaded').map((f) => `${f.family.replace(/["']/g, '')} ${f.weight}`))),
    body: {
      fontFamily: bodyCs.fontFamily,
      fontSize: bodyCs.fontSize,
      lineHeight: bodyCs.lineHeight,
      color: rgbToHex(bodyCs.color),
    },
    paragraph: topP ? { fontFamily: pFamily, fontSize: pSize, lineHeight: pLh, color: pColor, sampleCount: topP.count } : null,
    h1: typo(h1),
    h2: typo(h2),
    colours: {
      pageBackground: pageBg,
      text: Array.from(textColours),
      backgrounds: Array.from(bgColours),
      distinctCount: colours.size,
      chromatic: Array.from(colours).filter(isChromatic),
    },
    maxContentWidth: maxWidthModes.length ? Math.max(...maxWidthModes.map((m) => Number(m.value))) : null,
    maxWidthValues: maxWidthModes,
    buttons: {
      count: btnInfo.length,
      radius: mode(btnInfo.map((b) => b.radius)).slice(0, 4),
      filledSamples: filledButtons.slice(0, 5),
    },
    cards: {
      count: cardInfo.length,
      radius: mode(cardInfo.map((c) => c.radius)).slice(0, 4),
      border: mode(cardInfo.map((c) => c.border)).slice(0, 3),
      shadow: mode(cardInfo.map((c) => c.shadow)).slice(0, 3),
    },
    bordersAndShadows: {
      elementsWithShadow: shadowCount,
      borderWidths: mode(borderWidths).slice(0, 5),
    },
    images: {
      count: bigImgs.length,
      aboveFold: aboveFold.length,
      largeBackgroundImages: bgImages.length,
      svgCount: document.querySelectorAll('svg').length,
    },
    headerNav: {
      count: navItems.length,
      items: navItems.slice(0, 20),
    },
    footer: footer ? { links: footerLinkCount, linkLists: footerColumns } : null,
    uppercaseTrackedLabels: uppercaseLabels,
  };
}

const browser = await chromium.launch();
const results = [];
try {
  await mkdir(outDir, { recursive: true });
  for (const url of urls) {
    const context = await browser.newContext({ viewport: VIEWPORT, userAgent: UA, locale: 'en-GB' });
    const page = await context.newPage();
    const started = Date.now();
    try {
      const res = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      const consentDismissed = await dismissConsent(page);
      await page.evaluate(() => document.fonts.ready);
      const status = res ? res.status() : null;
      const screenshot = path.join(outDir, `${slug(url)}.png`);
      await page.screenshot({ path: screenshot, fullPage: false });
      const data = await page.evaluate(collect);
      results.push({
        url,
        status,
        measuredAt: new Date().toISOString(),
        viewport: `${VIEWPORT.width}x${VIEWPORT.height}`,
        screenshot,
        consentDismissed,
        ms: Date.now() - started,
        ...data,
      });
      if (status && status >= 400) console.error(`warn: ${url} returned HTTP ${status}; swap the site, do not guess values`);
    } catch (err) {
      results.push({ url, error: String(err && err.message ? err.message : err) });
      console.error(`error: ${url}: ${err && err.message ? err.message : err}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));

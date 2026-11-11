#!/usr/bin/env node
// Check a page against the measurable fingerprints in
// references/claude-fingerprints.md.
//
// Usage:
//   node scripts/check.mjs <url-or-file> [...] [--out <dir>] [--json] [--allow-no-photos]
//
// Loads each page at 1440x900 and 390x844 in headless Chromium, prints
// PASS / FAIL / SKIP per fingerprint with the measured value, saves both
// screenshots into the output dir (default ./check-out) and exits 1 if any
// check fails (2 if a page could not be loaded). PASS means the fingerprint
// was not found, not that the design is good: look at the screenshots.
//
// --allow-no-photos skips the photo check, for categories whose real sites use
// no photos (calculators, some tools).

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { desktopData, mobileData, h1Size } from './lib/browser.js';
import { openPage, toUrl, slug } from './lib/load.mjs';

const USAGE = 'Usage: node scripts/check.mjs <url-or-file> [...] [--out <dir>] [--json] [--allow-no-photos]';
const args = process.argv.slice(2);
let outDir = 'check-out';
let json = false;
let allowNoPhotos = false;
const urls = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') outDir = args[++i];
  else if (args[i] === '--json') json = true;
  else if (args[i] === '--allow-no-photos') allowNoPhotos = true;
  else if (args[i] === '-h' || args[i] === '--help') {
    console.log(USAGE);
    process.exit(0);
  } else urls.push(toUrl(args[i]));
}
if (!urls.length) {
  console.error(USAGE);
  process.exit(2);
}

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const FOLD = 900;

// Copy helpers ---------------------------------------------------------------
const W = "[\\p{L}\\p{N}][\\p{L}\\p{N}'\u2019-]*";
const ITEM = `${W}(?: ${W}){0,2}`;
const CONJ = '(?:and|or|ja|tai|sekä|och|eller|und|oder|et|ou|y|o)';
const LIST_RE = new RegExp(`${ITEM}(?:, ${ITEM})+,? ${CONJ} ${W}`, 'giu');
const CONJ_TAIL = new RegExp(`,? ${CONJ} \\S+$`, 'iu');

function triplets(sentence) {
  let n = 0;
  for (const m of sentence.matchAll(LIST_RE)) {
    const items = m[0].replace(CONJ_TAIL, '').split(', ').length + 1;
    if (items === 3) n++;
  }
  return n;
}

function sentences(blocks) {
  return blocks
    .flatMap((b) => b.split(/(?<=[.!?\u2026])\s+|\n+/u))
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 2);
}

const HOW_RE = [
  /^how (it|this|.{1,30}) works?\b/i,
  /^how to (get started|use)\b/i,
  /\bin short\b/i,
  /^the short (answer|version)\b/i,
  /^näin\b/i,
  /\blyhyesti\b/i,
  /^miten (se |palvelu )?toimii/i,
];
const REASSURE_RE = [
  /^(it'?s |100% |totally |completely )?free[.!]?$/i,
  /\bno (account|sign[- ]?up|signup|registration|commitment|credit card|card|login|log-in|strings|catch|spam|obligation)s?\b/i,
  /\b(free forever|free to use|cancel any ?time|always free|completely free|nothing to install)\b/i,
  /\b(does not|doesn't|won't|will not) commit you\b/i,
  /\bei (rekisteröitymistä|kirjautumista|sitoumusta|tiliä|tunnuksia|maksua)\b/i,
  /^(maksuton|ilmainen|veloituksetta)[.!]?$/i,
];
const STAMP_RE = /\b(checked|updated|last updated|verified|reviewed|tarkistettu|päivitetty)\b[^.\n]{0,24}?(\d{1,2}[./]\d{1,2}[./]\d{2,4}|\d{4}-\d{2}-\d{2})/giu;

// Checks -----------------------------------------------------------------------
// Each returns [status, value]. status: 'PASS' | 'FAIL' | 'SKIP'.
function runChecks(d, m, h1Fluid) {
  const results = [];
  const add = (id, fingerprint, fn) => {
    try {
      const [status, value] = fn();
      results.push({ id, fingerprint, status, value });
    } catch (err) {
      results.push({ id, fingerprint, status: 'SKIP', value: `error: ${err.message}` });
    }
  };
  const pct = (x) => `${Math.round(x * 100)}%`;
  const ok = (bad) => (bad ? 'FAIL' : 'PASS');

  add('h1-display', '3: h1 clamp(vw) + negative tracking + line-height <= 1.05', () => {
    const h = d.h1;
    if (!h) return ['SKIP', 'no visible h1'];
    const fluid = h.cssFluid || h1Fluid.fluid;
    const bad = fluid && h.letterSpacingEm < 0 && h.lineHeightRatio <= 1.05;
    return [ok(bad), `${h.fontSize}px, line-height ${h.lineHeightRatio}, tracking ${h.letterSpacingEm}em, fluid ${fluid ? 'yes' : 'no'} (${h1Fluid.sizes.join('/')}px at ${h1Fluid.widths.join('/')})`];
  });

  const strong = d.accents.filter((a) => a.uses >= 3);
  add('palette', '4: white or cream page with fewer than 2 reused accent hues', () => {
    const b = d.background;
    const white = b.luminance >= 0.97;
    const cream = b.luminance >= 0.83 && b.h >= 30 && b.h <= 60 && b.s < 0.5 && b.s > 0.05;
    const bad = (white || cream) && strong.length < 2;
    return [ok(bad), `background ${b.hex} (luminance ${b.luminance}, hue ${Math.round(b.h)}, ${white ? 'white' : cream ? 'cream' : 'tinted'}), ${strong.length} accent hue(s) used 3+ times: ${strong.map((a) => `${a.hex} x${a.uses}`).join(', ') || 'none'}`];
  });

  add('accent-hue', '5: main accent is brick red or cobalt blue', () => {
    const a = strong[0];
    if (!a) return ['PASS', 'no accent used 3+ times'];
    const brick = (a.hue <= 15 || a.hue >= 350) && a.l >= 0.3 && a.l <= 0.45;
    const cobalt = a.hue >= 218 && a.hue <= 232 && a.s > 0.6;
    return [ok(brick || cobalt), `main accent ${a.hex}: hue ${a.hue}, saturation ${a.s}, lightness ${a.l}${brick ? ' (brick red)' : cobalt ? ' (cobalt)' : ''}`];
  });

  add('shell', '2: centred 1200-1440px shell that nothing breaks', () => {
    const s = d.shell;
    const bad = !!s.width && s.fullBleedBands === 0;
    return [ok(bad), `shell ${s.width ? s.width + 'px' : 'none'}, ${s.fullBleedBands} full-bleed band(s)${s.bandSamples.length ? ': ' + s.bandSamples.join(', ') : ''}`];
  });

  add('ruled-lists', '6: more than 2 ruled-row lists', () => [ok(d.ruledLists.ruled > 2), `${d.ruledLists.ruled} of ${d.ruledLists.lists} lists are ruled rows`]);

  add('thick-thin-rules', '7: thick 2-4px ink rule plus 1px hairlines', () => [ok(d.rules.thick >= 1 && d.rules.thin >= 2), `${d.rules.thick} thick, ${d.rules.thin} hairline rule(s)`]);

  add('photos', '8: no photos', () => {
    if (allowNoPhotos) return ['SKIP', `${d.photos.count} photo(s); skipped by --allow-no-photos`];
    return [ok(d.photos.count === 0), `${d.photos.count} photo(s), ${d.photos.aboveFold} above the fold`];
  });

  add('uppercase-labels', '11: small uppercase tracked labels or a kicker above h1/h2', () => [ok(d.labels.kickers >= 1 || d.labels.count >= 3), `${d.labels.count} label(s), ${d.labels.kickers} kicker(s) above a heading`]);

  add('middots', '11: " · " separators', () => [ok(d.middots.inFold >= 1 || d.middots.count >= 3), `${d.middots.count} on the page, ${d.middots.inFold} in the first ${FOLD}px`]);

  const fams = d.fonts.families.filter((f) => f.share >= 0.03);
  add('font-families', '10: more than one font family', () => [ok(fams.length >= 2), fams.map((f) => `${f.family} ${pct(f.share)}`).join(', ') || 'none']);

  add('mono', '10/18: mono font outside code', () => [ok(d.fonts.monoElements >= 1), `${d.fonts.monoElements} element(s), ${pct(d.fonts.monoShare)} of text`]);

  add('footer', '19: one-line footer', () => {
    const f = d.footer;
    if (!f) return ['FAIL', 'no footer found'];
    return [ok(f.columns <= 1 || f.height < 120), `${f.columns} column(s), ${f.links} links, ${f.height}px tall`];
  });

  add('square-corners', '14: square corners as a reflex', () => {
    const c = d.corners;
    if (c.elements < 3) return ['SKIP', `only ${c.elements} button/input/card box(es)`];
    const share = c.square / c.elements;
    return [ok(share >= 0.8), `${pct(share)} of ${c.elements} buttons, inputs and cards are square (max radius ${c.max}px)`];
  });

  add('h2-lead', '15: h2 followed by a narrow 10-25 word lead', () => {
    const l = d.leads;
    if (l.h2 < 3) return ['PASS', `${l.withNarrowLead} of ${l.h2} h2`];
    return [ok(l.withNarrowLead / l.h2 >= 0.4), `${l.withNarrowLead} of ${l.h2} h2 (${pct(l.withNarrowLead / l.h2)})`];
  });

  add('split-hero', '16: split hero (h1 left, form or list right)', () => [ok(d.splitHero), d.splitHero ? 'h1 column sits beside a form or list' : 'no']);

  add('code-skeleton', '12: --bg/--ink/--line tokens, aria-labelledby on every section', () => {
    const s = d.skeleton;
    const all = s.sections >= 3 && s.labelledby === s.sections;
    return [ok(s.tokens.length >= 3 || all), `tokens: ${s.tokens.join(' ') || 'none'}; ${s.labelledby} of ${s.sections} sections use aria-labelledby`];
  });

  add('tabular-nums', '18: tabular-nums outside tables', () => [ok(d.tabularNums >= 3), `${d.tabularNums} element(s)`]);

  const allText = d.copy.allText;
  const stamps = [...allText.matchAll(STAMP_RE)].map((x) => x[0]);
  add('date-stamps', '17: "checked <date>" stamps', () => [ok(stamps.length >= 2), `${stamps.length}${stamps.length ? ': ' + stamps.slice(0, 3).join(' | ') : ''}`]);

  add('overflow-390', 'layout: sideways scroll at 390px', () => [ok(m.overflow > 1), m.overflow > 1 ? `${m.overflow}px wider than the viewport; widest: ${m.widest}` : 'none']);

  add('tap-targets', 'access: tap targets under 44px at 390px', () => [ok(m.small > 0), `${m.small} of ${m.targets} target(s)${m.smallSamples.length ? ': ' + m.smallSamples.join(', ') : ''}`]);

  add('contrast', 'access: text contrast under 4.5:1 (3:1 for large text)', () => {
    const c = d.contrast;
    return [ok(c.failing > 0), `${c.failing} of ${c.checked} text element(s) fail${c.worst.length ? ': ' + c.worst.slice(0, 3).map((w) => `"${w.text}" ${w.ratio}:1 (${w.fg} on ${w.bg})`).join(', ') : ''}${c.unknown ? `; ${c.unknown} over images not checked` : ''}`];
  });

  // Copy ---------------------------------------------------------------------
  const sents = sentences(d.copy.prose);
  const tripletCount = sents.reduce((n, s) => n + triplets(s), 0) + d.copy.headings.reduce((n, s) => n + triplets(s), 0);
  const tripletShare = sents.length ? sents.filter((s) => triplets(s) > 0).length / sents.length : 0;
  add('copy-triplets', '13: "A, B and C" triplets as a habit', () => [ok(tripletCount > 3 && tripletShare >= 0.08), `${tripletCount} triplet(s), in ${pct(tripletShare)} of ${sents.length} sentences`]);

  const how = d.copy.headings.filter((h) => HOW_RE.some((r) => r.test(h.trim())));
  add('copy-how-it-works', '13: "How it works" / "Näin..." / "X in short" headings', () => [ok(how.length > 0), how.length ? how.slice(0, 3).map((h) => `"${h}"`).join(', ') : 'none']);

  const reassure = [...new Set(d.copy.shortLines.filter((t) => REASSURE_RE.some((r) => r.test(t.trim()))))];
  add('copy-reassurance', '13: one-line reassurances ("No account needed", "Free")', () => [ok(reassure.length > 0), reassure.length ? reassure.slice(0, 4).map((t) => `"${t}"`).join(', ') : 'none']);

  const em = (allText.match(/\u2014/g) || []).length;
  const en = (allText.match(/\s\u2013\s/g) || []).length;
  add('copy-dashes', 'copy: em or en dashes as punctuation', () => [ok(em + en > 0), `${em} em dash(es), ${en} spaced en dash(es)`]);

  const short = sents.filter((s) => s.split(/\s+/).length <= 8).length;
  add('copy-short-sentences', '13: share of sentences of 8 words or fewer', () => {
    if (sents.length < 8) return ['SKIP', `only ${sents.length} sentences`];
    return [ok(short / sents.length > 0.4), `${pct(short / sents.length)} of ${sents.length} sentences`];
  });

  add('h1-full-stop', '13: h1 ends with a full stop', () => (d.h1 ? [ok(d.h1.endsWithStop), `"${d.h1.text}"`] : ['SKIP', 'no visible h1']));

  return results;
}

// Run ----------------------------------------------------------------------
const browser = await chromium.launch();
const reports = [];
let loadError = false;
try {
  await mkdir(outDir, { recursive: true });
  for (const url of urls) {
    const report = { url, screenshots: [] };
    try {
      const desk = await openPage(browser, url, DESKTOP);
      report.status = desk.status;
      const s1 = path.join(outDir, `${slug(url)}-1440.png`);
      await desk.page.screenshot({ path: s1, fullPage: false });
      report.screenshots.push(s1);
      const d = await desk.page.evaluate(desktopData, FOLD);
      // Fluid h1 probe: a size that changes between two close widths, twice,
      // is fluid (vw/clamp) rather than a breakpoint step.
      const widths = [1100, 1150, 820, 860];
      const sizes = [];
      for (const w of widths) {
        await desk.page.setViewportSize({ width: w, height: 900 });
        await desk.page.waitForTimeout(120);
        sizes.push(await desk.page.evaluate(h1Size));
      }
      const fluid = sizes[0] != null && sizes[0] !== sizes[1] && sizes[2] !== sizes[3];
      await desk.context.close();

      const mob = await openPage(browser, url, MOBILE);
      const s2 = path.join(outDir, `${slug(url)}-390.png`);
      await mob.page.screenshot({ path: s2, fullPage: false });
      report.screenshots.push(s2);
      const m = await mob.page.evaluate(mobileData);
      await mob.context.close();

      report.checks = runChecks(d, m, { fluid, widths, sizes: sizes.map((x) => (x == null ? '-' : Math.round(x * 10) / 10)) });
    } catch (err) {
      loadError = true;
      report.error = String(err && err.message ? err.message : err);
    }
    reports.push(report);
  }
} finally {
  await browser.close();
}

if (json) {
  console.log(JSON.stringify(reports, null, 2));
} else {
  for (const r of reports) {
    console.log(`\ncheck ${r.url}`);
    if (r.error) {
      console.log(`  error: ${r.error}`);
      continue;
    }
    if (r.status && r.status >= 400) console.log(`  warn: HTTP ${r.status}`);
    console.log(`  screenshots: ${r.screenshots.join(', ')}`);
    const w = Math.max(...r.checks.map((c) => c.id.length));
    for (const c of r.checks) console.log(`  ${c.status.padEnd(4)}  ${c.id.padEnd(w)}  ${c.value}`);
    const n = (s) => r.checks.filter((c) => c.status === s).length;
    console.log(`  ${n('PASS')} pass, ${n('FAIL')} fail, ${n('SKIP')} skip`);
  }
}

const failed = reports.some((r) => r.checks && r.checks.some((c) => c.status === 'FAIL'));
process.exit(loadError ? 2 : failed ? 1 : 0);

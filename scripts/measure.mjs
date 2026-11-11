#!/usr/bin/env node
// Measure the computed design conventions of real sites.
//
// Usage:
//   node scripts/measure.mjs <url> [<url> ...] [--out <dir>] [--json]
//
// Prints a readable table (one column per URL) and per-site details, or with
// --json a JSON array (one object per URL). Saves a 1440x900 screenshot of the
// first screen per URL into the output dir (default ./measure-out). Local file
// paths work too. Needs Playwright: `npm install`, then
// `npx playwright install chromium` if no browser is cached yet.
//
// The detectors (nav, buttons, cards, footer, fold order) are heuristics.
// Always check the numbers against the screenshot.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { measure } from './lib/browser.js';
import { openPage, toUrl, slug, label, table } from './lib/load.mjs';

const USAGE = 'Usage: node scripts/measure.mjs <url> [<url> ...] [--out <dir>] [--json]';
const args = process.argv.slice(2);
let outDir = 'measure-out';
let json = false;
const urls = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') outDir = args[++i];
  else if (args[i] === '--json') json = true;
  else if (args[i] === '-h' || args[i] === '--help') {
    console.log(USAGE);
    process.exit(0);
  } else urls.push(toUrl(args[i]));
}
if (urls.length === 0) {
  console.error(USAGE);
  process.exit(1);
}

const VIEWPORT = { width: 1440, height: 900 };
const FOLD = 900;

const browser = await chromium.launch();
const results = [];
try {
  await mkdir(outDir, { recursive: true });
  for (const url of urls) {
    const started = Date.now();
    let context;
    try {
      const opened = await openPage(browser, url, VIEWPORT);
      context = opened.context;
      const screenshot = path.join(outDir, `${slug(url)}.png`);
      await opened.page.screenshot({ path: screenshot, fullPage: false });
      const data = await opened.page.evaluate(measure, FOLD);
      results.push({
        url,
        status: opened.status,
        measuredAt: new Date().toISOString(),
        viewport: `${VIEWPORT.width}x${VIEWPORT.height}`,
        screenshot,
        consentDismissed: opened.consentDismissed,
        ms: Date.now() - started,
        ...data,
      });
      if (opened.status && opened.status >= 400) {
        console.error(`warn: ${url} returned HTTP ${opened.status}; swap the site, do not guess values`);
      }
    } catch (err) {
      results.push({ url, error: String(err && err.message ? err.message : err) });
      console.error(`error: ${url}: ${err && err.message ? err.message : err}`);
    } finally {
      if (context) await context.close();
    }
  }
} finally {
  await browser.close();
}

if (json) {
  console.log(JSON.stringify(results, null, 2));
} else {
  console.log(report(results));
}
if (results.some((r) => r.error)) process.exitCode = 2;

function report(rs) {
  const ok = rs.filter((r) => !r.error);
  const dist = (arr) => (arr && arr.length ? arr.map((m) => `${m.value} x${m.count}`).join(', ') : '-');
  const typ = (t) => (t ? `${t.fontSize}/${t.lineHeight} ${t.fontWeight} ls ${t.letterSpacing}` : '-');
  const rows = [
    ['HTTP status', (r) => r.status],
    ['fonts loaded', (r) => Array.from(new Set(r.fontsLoaded.map((f) => f.replace(/ \d.*$/, '')))).join(', ') || 'none'],
    ['paragraph', (r) => (r.paragraph ? `${r.paragraph.fontFamily} ${r.paragraph.fontSize}/${r.paragraph.lineHeight} ${r.paragraph.color}` : '-')],
    ['h1', (r) => typ(r.h1)],
    ['h2', (r) => typ(r.h2)],
    ['page background', (r) => r.colours.pageBackground],
    ['colours distinct/chromatic', (r) => `${r.colours.distinctCount} / ${r.colours.chromatic.length}`],
    ['max content width', (r) => (r.maxContentWidth ? `${r.maxContentWidth}px` : '-')],
    ['buttons (boxed/all)', (r) => `${r.buttons.boxed} / ${r.buttons.count}`],
    ['button radius', (r) => dist(r.buttons.radius)],
    ['button height', (r) => (r.buttons.height ? `${r.buttons.height.min}-${r.buttons.height.max}, median ${r.buttons.height.median}px` : '-')],
    ['card groups / cards', (r) => `${r.cards.groups} / ${r.cards.count}`],
    ['card radius', (r) => dist(r.cards.radius)],
    ['card border', (r) => dist(r.cards.border)],
    ['card shadow', (r) => dist(r.cards.shadow)],
    ['images (all/fold/bg)', (r) => `${r.images.count} / ${r.images.aboveFold} / ${r.images.largeBackgroundImages}`],
    ['header nav links', (r) => `${r.headerNav.count} (${r.headerNav.source || 'none'})`],
    ['footer columns / links', (r) => (r.footer ? `${r.footer.columns} / ${r.footer.links}` : 'no footer')],
    ['uppercase tracked labels', (r) => r.uppercaseTrackedLabels],
  ];
  let out = '';
  if (ok.length) {
    out += table(['', ...ok.map((r) => label(r.url))], rows.map(([name, fn]) => [name, ...ok.map((r) => fn(r))]));
    out += '\n';
  }
  for (const r of rs) {
    out += `\n== ${r.url}\n`;
    if (r.error) {
      out += `  error: ${r.error}\n`;
      continue;
    }
    out += `  screenshot: ${r.screenshot}\n`;
    out += `  title: ${r.title}\n`;
    out += `  header nav: ${r.headerNav.items.join(' | ') || '-'}\n`;
    out += `  fold order (first ${FOLD}px):\n`;
    for (const b of r.foldOrder) out += `    ${String(b.top).padStart(4)}px  ${b.type.padEnd(9)} ${b.label}${b.count ? ` (+${b.count - 1} more)` : ''}\n`;
    out += '  buttons:\n';
    for (const b of r.buttons.samples) out += `    "${b.text}" ${b.kind} ${b.height}px, radius ${b.radius}, fill ${b.background || 'none'}, border ${b.border}\n`;
    out += '  card groups:\n';
    for (const c of r.cards.samples) out += `    ${c.size}x ${c.width}x${c.height} at ${c.top}px, radius ${c.radius}, border ${c.border}, shadow ${c.shadow}  [${c.signature}]\n`;
    if (r.footer) out += `  footer: ${r.footer.columns} columns, ${r.footer.links} links, ${r.footer.headings} headings, ${r.footer.height}px tall\n`;
  }
  return out;
}

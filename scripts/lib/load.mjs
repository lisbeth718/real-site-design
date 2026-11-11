// Node-side helpers shared by measure.mjs and check.mjs.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { install } from './browser.js';

export const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

// Accept URLs and local file paths (fixtures, built HTML).
export function toUrl(arg) {
  if (/^[a-z]+:\/\//i.test(arg)) return arg;
  if (existsSync(arg)) return pathToFileURL(path.resolve(arg)).href;
  return `https://${arg}`;
}

export function slug(url) {
  const u = new URL(url);
  const base = u.protocol === 'file:' ? path.basename(u.pathname) : u.hostname + u.pathname;
  return base.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'page';
}

export function label(url) {
  const u = new URL(url);
  return u.protocol === 'file:' ? path.basename(u.pathname) : u.hostname.replace(/^www\./, '') + (u.pathname.length > 1 ? u.pathname : '');
}

// Best effort: close a cookie or consent dialog so it does not cover the
// screenshot. Tries a reject button first, then accept. Silent if none found.
const CONSENT_BUTTONS = [
  /^(reject all|reject|decline|reject analytics cookies|use necessary cookies only|only necessary|hylkää|hylkää kaikki|vain välttämättömät)$/i,
  /^(accept all|accept|accept all cookies|accept cookies|allow all|agree|i agree|got it|ok|hyväksy|hyväksy kaikki|salli kaikki)$/i,
];
export async function dismissConsent(page) {
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

// Open a URL at a viewport, settle it, and install the browser helpers.
export async function openPage(browser, url, viewport) {
  const context = await browser.newContext({ viewport, userAgent: UA, locale: 'en-GB' });
  const page = await context.newPage();
  const res = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  const consentDismissed = await dismissConsent(page);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(install);
  const status = res ? res.status() : null;
  return { context, page, status, consentDismissed };
}

// Reset cached detections after a resize or scroll.
export async function reinstall(page) {
  await page.evaluate(() => {
    delete window.__rsd;
  });
  await page.evaluate(install);
}

// Plain text table: rows x columns, cells truncated.
export function table(header, rows, maxCell = 38) {
  const cut = (s) => {
    s = s == null ? '' : String(s);
    return s.length > maxCell ? s.slice(0, maxCell - 1) + '~' : s;
  };
  const all = [header, ...rows].map((r) => r.map(cut));
  const widths = header.map((_, i) => Math.max(...all.map((r) => (r[i] || '').length)));
  const line = (r) => r.map((c, i) => (c || '').padEnd(widths[i])).join('  ').trimEnd();
  return [line(all[0]), widths.map((w) => '-'.repeat(w)).join('  '), ...all.slice(1).map(line)].join('\n');
}

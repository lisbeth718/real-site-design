// Runs check.mjs and measure.mjs against the local fixtures (no network).
//   npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = (name) => path.join(root, 'tests', 'fixtures', name);
const out = mkdtempSync(path.join(tmpdir(), 'real-site-design-'));

function run(script, ...args) {
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args, '--json', '--out', out], {
    encoding: 'utf8',
    timeout: 120000,
  });
  if (r.error) throw r.error;
  let data;
  try {
    data = JSON.parse(r.stdout);
  } catch {
    throw new Error(`${script} printed no JSON (exit ${r.status}):\n${r.stdout}\n${r.stderr}`);
  }
  return { code: r.status, data };
}

const statusOf = (report) => Object.fromEntries(report.checks.map((c) => [c.id, c.status]));

test('check.mjs fails the AI-looking fixture on the core fingerprints', () => {
  const { code, data } = run('check.mjs', fixture('ai-look.html'));
  assert.equal(code, 1, 'exit code should be 1 when checks fail');
  const s = statusOf(data[0]);
  const mustFail = [
    'h1-display',
    'palette',
    'accent-hue',
    'shell',
    'ruled-lists',
    'thick-thin-rules',
    'photos',
    'uppercase-labels',
    'middots',
    'font-families',
    'mono',
    'footer',
    'square-corners',
    'h2-lead',
    'overflow-390',
    'tap-targets',
    'contrast',
    'copy-triplets',
    'copy-how-it-works',
    'copy-reassurance',
    'copy-dashes',
    'copy-short-sentences',
  ];
  for (const id of mustFail) assert.equal(s[id], 'FAIL', `${id} should FAIL on ai-look.html`);
});

test('check.mjs passes the clean fixture', () => {
  const { code, data } = run('check.mjs', fixture('clean.html'));
  const failed = data[0].checks.filter((c) => c.status === 'FAIL');
  assert.deepEqual(failed.map((c) => `${c.id}: ${c.value}`), [], 'no check should fail on clean.html');
  assert.equal(code, 0);
});

test('measure.mjs detects nav, buttons, cards, footer and fold order on the clean fixture', () => {
  const { code, data } = run('measure.mjs', fixture('clean.html'));
  assert.equal(code, 0);
  const m = data[0];
  assert.equal(m.headerNav.count, 5, 'logo + 4 nav links');
  assert.deepEqual(m.buttons.radius.map((r) => r.value), ['8px']);
  assert.ok(m.buttons.height.min >= 44, 'buttons at least 44px tall');
  assert.equal(m.cards.groups, 1);
  assert.equal(m.cards.count, 3);
  assert.equal(m.cards.radius[0].value, '8px');
  assert.match(m.cards.border[0].value, /^1px solid/);
  assert.equal(m.footer.columns, 3);
  assert.deepEqual(
    m.foldOrder.map((b) => b.type),
    ['nav', 'image', 'heading', 'text', 'search', 'heading', 'card-grid']
  );
});

test('measure.mjs reports the one-line footer and no cards on the AI-looking fixture', () => {
  const { data } = run('measure.mjs', fixture('ai-look.html'));
  const m = data[0];
  assert.equal(m.headerNav.count, 3);
  assert.equal(m.cards.count, 0);
  assert.equal(m.footer.columns, 1);
  assert.equal(m.images.count, 0);
});

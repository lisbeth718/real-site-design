# real-site-design

A Claude Code skill for designing websites that do not look AI-generated.

## Why

Sites built by AI coding agents share a measurable skeleton. Across 29 rejected AI designs for 4 different sites, the same things kept showing up: a centred 1280px shell, a huge h1 with negative letter-spacing, a cream or white page with one brick-red or cobalt accent, lists separated by hairline rules, small uppercase labels, a "grotesk + mono" Google Fonts pair, no photos, and a one-line footer.

Asking for a different style does not fix it. New fonts, new palettes and "concept" directions (newspaper, poster, manual, ledger, teletext) change the surface and keep the skeleton, so every direction still reads as AI-made.

What does fix it is measuring 3 real sites in the same category (their actual fonts, sizes, widths, radii, colours, imagery, nav and footer) and designing inside the numbers they agree on.

## What is in it

- `SKILL.md`: the 13-step method the agent follows.
- `references/claude-fingerprints.md`: 19 fingerprints of AI-made site design, each with counts from the corpus and a test you can run, an 8-point fast lint, and the thresholds `check.mjs` uses.
- `references/measured-sites-2026-11.md`: measured conventions for 4 categories (pet sitter marketplaces, price comparison, health reading, finance calculators), taken from public sites in November 2026, each with a "Last measured" date.
- `scripts/measure.mjs`: a Playwright script that measures any list of URLs and prints a comparison table or JSON.
- `scripts/check.mjs`: a Playwright script that runs the measurable fingerprint tests against one page and exits non-zero on failures.
- `tests/`: two local fixtures (an AI-looking page that must fail, a plain page that must pass) and the tests behind `npm test`.

## Install (Claude Code)

```
git clone https://github.com/lisbeth718/real-site-design ~/.claude/skills/real-site-design
cd ~/.claude/skills/real-site-design
npm install
npx playwright install chromium   # only if you have no Playwright browser yet
```

Claude Code picks the skill up from `~/.claude/skills/`. It triggers on requests like "design a landing page", "redesign the homepage", "this looks AI-generated" or "make it not look like Claude".

## Use

Ask for the design as usual. The skill makes the agent:

1. name the site's category;
2. measure 3 real sites in it;
3. design inside what they agree on, with one readable font, real photos where the category uses them and plain copy;
4. add one signature element taken from a real fact about the product (its data, place, animals or numbers), so the result is not just correct but recognisable;
5. build it in the real codebase, screenshot it at desktop and mobile, and run `check.mjs` on it;
6. hand it to a separate reviewer agent before shipping, and show you one direction instead of a menu.

### Measure sites

```
node scripts/measure.mjs https://www.nhs.uk https://www.omnicalculator.com https://www.pawshake.fi
node scripts/measure.mjs https://www.nhs.uk https://www.omnicalculator.com --json > measurements.json
```

Without `--json` it prints a table with one column per site, then per site the header nav items, the block order in the first 900px, button samples, card groups and footer columns. Local files work too. Screenshots (1440x900, one per URL) go to `measure-out/`, or `--out <dir>`.

What it records for each URL:
- loaded fonts; body and paragraph font, size, line-height and colour; h1/h2 size, weight and letter-spacing;
- page background, distinct and chromatic colour counts, max content width;
- header nav: links in the top-most header or banner (or the first nav, or a full-width top bar) that starts in the top 200px;
- buttons: native buttons and links styled as buttons (own fill or border, padding, 32-64px tall), with the radius and height distribution;
- cards: 3+ siblings with the same classes or structure, a visible background, border or shadow and a heading or image inside, with radius, border and shadow; a square element with a rounded first child takes the child's radius;
- images (total, above the fold, large backgrounds), footer link columns, uppercase tracked labels;
- the major blocks in the first 900px, in order: nav, heading, search, form, cta, image, card-grid, text.

### Check a build

```
node scripts/check.mjs http://localhost:3000
node scripts/check.mjs ./dist/index.html --json
node scripts/check.mjs http://localhost:3000 --allow-no-photos   # categories that use no photos
```

It loads the page at 1440x900 and 390x844, saves both screenshots to `check-out/` and prints PASS, FAIL or SKIP per fingerprint with the measured value: h1 size, tracking and line-height; background and accent hues; the fixed shell; ruled-row lists; thick and thin rules; photos; uppercase labels and " · " separators; font families and mono; the footer; square corners; h2 leads; split hero; code tokens; tabular-nums; date stamps; sideways scroll and tap targets at 390; text contrast; and copy checks for "A, B and C" triplets, "How it works" headings, reassurance one-liners, dashes, short sentences and an h1 ending in a full stop. It exits 1 if any check fails. The thresholds are listed at the end of `references/claude-fingerprints.md`.

### Run the tests

```
npm test
```

Runs both scripts against `tests/fixtures/ai-look.html` (must fail the core fingerprints) and `tests/fixtures/clean.html` (must pass every check). No network needed.

## Before and after, in words

Before: a finance calculator site after six AI "directions" (broadsheet, poster, desk, sentences and others, plus a live "dark spreadsheet" build). Across them: giant tight h1s up to 140px, cream or near-black pages, a brick-red accent in three, a mono font for figures, hairline-ruled guide lists, square corners, no imagery and a one-line footer. Most directions reused the same sections ("Guides", "Free templates", "How the site works").

After: rebuilt from the measured conventions of Omni Calculator and Calculator.net. One plain sans, a coloured header band, a category bar and breadcrumbs, then the h1, the live calculator with inputs on the left and the result on the right, and the explainer below. 6px input radius and a 4-column footer. It was the first round that read as a calculator site rather than a design exercise.

## Limits

- The method was validated on one portfolio of 4 sites (29 rejected designs and one accepted rebuild). It has not been tested across many teams or categories.
- On its own it produces conventional results: correct for the category, but easy to forget. The signature element step (one element from a real fact about the product) is what makes it recognisable; skip it and expect a competent average site.
- The detectors in `measure.mjs` and `check.mjs` are heuristics. Unusual markup can hide a nav, merge two footer columns or miss a card grid, and a PASS only means the fingerprint was not found. Always check the numbers against the screenshots.
- Real sites fail some checks too (small tap targets, low-contrast text, square corners). Compare with your references before treating a FAIL as an AI tell.

## License

MIT

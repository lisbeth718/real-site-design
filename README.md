# real-site-design

A Claude Code skill for designing websites that do not look AI-generated.

## Why

Sites built by AI coding agents share a measurable skeleton. Across 29 rejected AI designs for 4 different sites, the same things kept showing up: a centred 1280px shell, a huge h1 with negative letter-spacing, a cream or white page with one brick-red or cobalt accent, lists separated by hairline rules, small uppercase labels, a "grotesk + mono" Google Fonts pair, no photos, and a one-line footer.

Asking for a different style does not fix it. New fonts, new palettes and "concept" directions (newspaper, poster, manual, ledger, teletext) change the surface and keep the skeleton, so every direction still reads as AI-made.

What does fix it is measuring 3 real sites in the same category (their actual fonts, sizes, widths, radii, colours, imagery, nav and footer) and designing inside the numbers they agree on.

## What is in it

- `SKILL.md`: the 12-step method the agent follows.
- `references/claude-fingerprints.md`: 19 fingerprints of AI-made site design, each with counts from the corpus and a test you can run, plus an 8-point fast lint.
- `references/measured-sites-2026-11.md`: measured conventions for 4 categories (pet sitter marketplaces, price comparison, health reading, finance calculators), taken from public sites in November 2026.
- `scripts/measure.mjs`: a Playwright script that measures any list of URLs and prints JSON.

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
4. build it in the real codebase, screenshot it at desktop and mobile, and check it against the fingerprints;
5. hand it to a separate reviewer agent before shipping, and show you one direction instead of a menu.

Measure sites yourself:

```
node scripts/measure.mjs https://www.nhs.uk https://www.omnicalculator.com --out measure-out > measurements.json
```

For each URL it records loaded fonts, body and paragraph font, size, line-height and colour, h1/h2 size, weight and letter-spacing, page background and text colours, distinct and chromatic colour counts, max content width, button and card radius, card borders and shadows, page-wide shadow and border counts, image counts (total and above the fold), header nav items, footer link lists and uppercase tracked labels. It tries to close cookie dialogs and saves a 1440x900 screenshot per URL. Card, nav and footer detection is heuristic: check the screenshot.

## Before and after, in words

Before: a finance calculator site after six AI "directions" (broadsheet, poster, desk, sentences and others, plus a live "dark spreadsheet" build). Across them: giant tight h1s up to 140px, cream or near-black pages, a brick-red accent in three, a mono font for figures, hairline-ruled guide lists, square corners, no imagery and a one-line footer. Most directions reused the same sections ("Guides", "Free templates", "How the site works").

After: rebuilt from the measured conventions of Omni Calculator and Calculator.net. One plain sans, a coloured header band, a category bar and breadcrumbs, then the h1, the live calculator with inputs on the left and the result on the right, and the explainer below. 6px input radius and a 4-column footer. It was the first round that read as a calculator site rather than a design exercise.

## License

MIT

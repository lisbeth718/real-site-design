---
name: real-site-design
description: Design or redesign a website, homepage or landing page so it does not look AI-generated. Use before any site or landing page design, redesign, "make it look better", "it looks AI-generated", "it looks like AI slop", "make it not look like Claude", or when asked for design directions or mockups. Measure real sites in the same category, design inside their numbers, then check the result against a list of measurable AI-design fingerprints.
---

# Real-site design

AI-built sites share one measurable skeleton: a centred 1280px shell, a giant tightly tracked h1, a cream or white page with one red or blue accent, hairline-ruled lists, uppercase tracked labels, no photos and a one-line footer. Asking for a different "style" changes the font, the palette and one hero gimmick, and leaves the skeleton alone. Concept directions (newspaper, poster, manual, ledger, teletext) are the same skeleton with a costume on.

What fixes it is copying how real products in the category are built, with measured numbers, not taste.

Files in this skill:
- `references/claude-fingerprints.md`: 19 measured fingerprints with counts, a test for each, the list of things that turned out not to matter, and an 8-point fast lint. Read it in full before any design work.
- `references/measured-sites-2026-11.md`: measured conventions for 4 categories (pet sitter marketplaces, price comparison, health reading, finance calculators). Reuse it if your category is there, but re-measure: sites change.
- `scripts/measure.mjs`: Playwright script that records the properties below for any list of URLs and saves a 1440x900 screenshot of each.

## Method

### 1. Name the category
Say what the site actually is: "pet sitter marketplace", "price comparison", "loan calculator", "health information". Not a vibe ("warm", "editorial", "bold").

### 2. Measure 3 real sites in that category
Pick 3 well-known, working sites in the same category. Measure computed styles in a headless browser at 1440x900; CSS files alone do not give final values on Tailwind, CSS-in-JS or site-builder sites.

```
node scripts/measure.mjs https://site-a.example https://site-b.example https://site-c.example --out measure-out > measurements.json
```

Record this fixed list for each site:
- fonts actually loaded (`document.fonts`, status "loaded");
- body text size, line-height and colour;
- h1 and h2 size, weight and letter-spacing;
- page background and text colours, and the count of distinct and brand colours;
- max content width;
- button radius, height and fill;
- card radius, border and shadow;
- image count, above the fold and in total, and the imagery type (photos, packshots, illustration, none);
- above-the-fold order (header, h1, search, photo, CTA...);
- header nav item count;
- footer column count;
- anything distinctive.

If a site blocks the fetch (403, bot wall, empty DOM), swap it for another. Never guess a value. Keep the screenshots; look at them, the script's heuristics (cards, nav, footer) need a human check.

Then write down what all 3 agree on. Those agreements are the brief.

### 3. Design inside the agreed conventions
Follow what the references share: font approach, body and heading sizes, max width, radius, card treatment, buttons, nav, footer, fold order, imagery. Where they disagree, pick one of their values; do not invent a new one. Break every fingerprint in `references/claude-fingerprints.md`.

### 4. No concept or metaphor directions
The site should look like a normal, well-made product in its category. If the direction can be named "<site> as a <printed object>" (newspaper, poster, ledger, manual, receipt, index), drop it. Name directions after the user task or the brand ("search first", "local trust").

### 5. One readable font
One family in a few weights carries the whole UI, like the references. No "characterful grotesk + mono for labels" or "editorial serif + sans" pairing. Mono only where code or tabular data really appears. Self-host the font files with their licence if the build environment cannot reach a font CDN.

### 6. Real photos where the references use them
If the category leads with photos (pets, vans, people, places, products), so does your design. Use real photos you are allowed to use, or generated ones that pass inspection. Reject any generated image with fake text, signs, logos, labels or number plates: garbled lettering is the fastest giveaway. If the references use no photos (calculators, some tools), do not add stock ones.

### 7. Plain copy
- Plain words, no slogans, taglines or jargon.
- No reassurance one-liners ("No account needed.", "No commitment.").
- No "A, B and C" triplets as a habit; real lists have 2 or 4+ items too.
- No "How it works" section by reflex, no "X in short" headings, no "Checked <date>" stamps everywhere.
- No invented numbers, prices, reviews or claims. If a fact is missing, leave a gap and say so.
- No dashes as punctuation.

Access and layout basics: 4.5:1 text contrast, 44px touch targets, no sideways scroll at 390px.

### 8. Build in real code, not mockups
Build in the actual codebase, on a branch or worktree. HTML or canvas mockups hide the problem: they are where the shared skeleton is born, and they skip real content, real images and real breakpoints.

### 9. Screenshots at desktop and mobile
Take screenshots at 1440 and 390 wide (light and dark if the site has both). Look at them yourself. If it reads as an AI template, it is not done.

### 10. Self-check against the fingerprints
Run `scripts/measure.mjs` on your own build and compare its numbers to the references. Then go through the fast lint and the 19 fingerprints in `references/claude-fingerprints.md` and report each with the measured value, not a yes/no from memory.

### 11. A separate reviewer before shipping
A different agent or person, not the one who built it, checks the build against the fingerprints, function, accessibility, SEO and regressions before it ships. The builder always passes its own work.

### 12. Show one direction, not many
Present one direction with desktop and mobile screenshots and 3 short bullets on what it follows from the references. Offering 3 to 6 options does not help: in practice they are the same skeleton reskinned.

## Fingerprints at a glance (details and tests in references)

1. The content model and copy are reused between "directions".
2. A centred 1240-1400px shell that nothing ever breaks.
3. The h1 uses clamp(), negative tracking and line-height of 1.05 or less.
4. A white or cream page with one accent.
5. That accent is brick red or cobalt blue.
6. Ruled-row lists everywhere.
7. Thick plus thin masthead rules.
8. No photos.
9. The direction is a print-object metaphor.
10. A grotesk + mono or serif + sans Google Fonts pair.
11. Uppercase tracked labels and " · " separators.
12. The same code skeleton every time: `--bg/--ink/--ink-2/--line` tokens, the same focus ring, aria-labelledby on every section.
13. Copy tics: "A, B and C" triplets, a "How it works" section, "X in short" headings, one-line reassurances.
14. Square corners as a reflex.
15. Every h2 is followed by a narrow lead paragraph.
16. A split hero (text left, form or list right).
17. "Checked <date>" stamps everywhere.
18. tabular-nums and mono for numbers.
19. A one-line footer.

## What a pass looks like

A finance calculator site that had been rejected through several rounds of reskins was rebuilt from the measured conventions of Omni Calculator and Calculator.net: one plain sans (Lato), a coloured header band, a category bar and breadcrumbs, then H1, the live calculator (inputs left, result right), then the explainer below; 6px input radius and a 4-column footer. It was the first round that did not read as AI-made.

# AI design fingerprints: 4 sites, 24 boards, 1 pilot (29 designs)

## Corpus

29 AI-made designs, all produced by Claude, all rejected by the site owner as "AI patterns on every design":
- 24 design boards (6 "directions" each for 4 sites);
- the 4 live sites (global CSS, page, layout and components);
- 1 pilot rebuild of a homepage in a "teletext page" concept.

The 4 sites were:
- **Site A:** pet sitter marketplace.
- **Site B:** equipment and van rental price guide.
- **Site C:** relationship and sexual health Q&A.
- **Site D:** startup finance calculators and guides.

Counts come from regex scripts run over the boards and the live source, with samples checked by reading the files. Copy examples below are paraphrased in English.

Main finding: the stated "direction" changes the font, the colour and one hero gimmick. It does not change the page skeleton, the content, the rule system or the code idioms. Those parts are what read as AI-made.

---

## Ranked fingerprints

### 1. The directions are reskins of one content model (same sections, same copy)
- **What:** each board keeps the same information architecture, headings and sentences, and only the styling changes.
  - Site A: the "dog and cat care calendar" heading is in 6/6 boards, the "how care is arranged" section in 5/6, and the same h1 in 4/6.
  - Site B: the same "what a trailer, van or move really costs" h1 in 4/6, and the same worked moving-cost example in 4/6.
  - Site D: "Guides" 4/6, "Free templates" 3/6, "How the site works" 3/6.
  - The pilot has the same section list as the live site, and it even keeps the old design tokens in its CSS.
- **Count:** mean vocabulary Jaccard between boards of the same site was 0.51, 0.38, 0.34 and 0.23. 24/24 boards reuse the site's existing copy.
- **Test:** take the set of h1/h2 strings in direction X and direction Y. If more than 40% overlap, or vocabulary Jaccard is above 0.3, it is a reskin, not a direction.
- **Real sites instead:** a new direction usually starts from a different content priority, for example a photo-led page, a single search box or a list of real listings. The layout follows from that.

### 2. Fixed centred shell: max-width 1240-1400px, margin 0 auto
- **Count:** 29/29. Exactly 1280px in 13 boards. `margin:0 auto` in 27/29.
- **Examples:** `max-width:1280px;margin:0 auto;padding:18px clamp(16px,4vw,48px)`; `--wide: 86rem`; `.shell{max-width:1360px}`; `--wide: 80rem`.
- **Test:** the outer content wrapper has `max-width` between 1200 and 1440px and `margin-inline:auto` on every section.
- **Real sites instead:** this one is common on real sites too. The tell is that nothing ever breaks the shell: no full-bleed photo, map, carousel or edge-to-edge band with off-grid content.

### 3. Display h1: fluid clamp() size, negative tracking, sub-1.05 leading
- **Count:**
  - h1 `font-size:clamp(...vw...)`: 27/29.
  - Heading `letter-spacing` between -0.01em and -0.05em: 25/29.
  - Heading `line-height` of 1.05 or less: 23/29.
  - The h1 max is 2.5 to 9 times the body size.
- **Examples:**
  - `font-size:clamp(46px,6.4vw,92px);line-height:0.95;letter-spacing:-0.04em`
  - `clamp(3rem,7vw,6.75rem);line-height:0.94;letter-spacing:-0.035em`
  - `clamp(44px,5.6vw,80px);line-height:0.98;letter-spacing:-0.035em`
  - `clamp(3rem,8.6vw,8.75rem);line-height:0.86`
  - Live sites: `clamp(2.1rem,6vw,3.5rem)` with `-0.035em`; `-0.04em` tracking.
- **Test:** `h1 { letter-spacing < 0 AND line-height <= 1.05 AND font-size uses clamp(...vw...) }`.
- **Real sites instead:** marketplace and service sites mostly set h1 at 28-48px, at fixed breakpoint sizes, with 0 tracking. Giant tight display type is a portfolio and agency habit.

### 4. Near-white ground + one ink + one saturated accent (a "two-and-a-half colour" palette)
- **Count:**
  - Page background is pure white or warm off-white (relative luminance 0.83 or more): 25/29. The other 4 are near-black tinted grounds (`#0e1111`, `#120c1a`).
  - Warm off-white specifically (#f1ece1, #f3eee3, #f4efe4, #fbf4e4, #f6f4ee, #faf7f2, #f8f7f3, #efeadf, #edebe5, #f6f6f1): 14/29.
  - At most one saturated hue used 3+ times: 24/29.
  - Distinct hex values per board: 6-17 (22/24 boards).
- **Examples:** `--bg:#fbf4e4`, `--paper:#f2f2ee`, `#f4efe4`, `#f3eee3`, `#efeadf`.
- **Test:** background luminance above 0.83 with hue 30-60° and saturation below 0.5 (the paper/cream case), or pure #fff. In either case, fewer than 2 chromatic hues reused 3+ times.
- **Real sites instead:** real brands carry 2-4 brand colours plus photography that brings in more colour. A pure "paper + ink + one red" scheme is an editorial-template look.

### 5. The accent is brick/oxblood red (or cobalt blue)
- **Count:** brick red in 12/29:
  - #8a1c1c, #8c2b1f, #9b2335, #a3360f, #a4301a, #b0201a, #b0301a, #b8361d, #c11d18, #8a1c2b
  - spread over boards of all 4 sites and one live site.

  Cobalt (#1d3fb8, #1f45d6, #1f48a8, #2346d0, #0b4f9c, #2233dd): 6/29. Together: 18/29. Signal yellow (#ffd400, #f4cf57, #ffd84d, #ffc857) is the "second" accent in 8.
- **Test:** the dominant chromatic colour has hue 0-15° and lightness 0.3-0.45, or hue 220-230° and saturation above 0.6.
- **Real sites instead:** the accent comes from the logo or the category (pet care: green, orange or teal; rental: the chain's colours). It is not a print-red default.

### 6. "Ruled rows": every list is an unstyled list with 1px separators, a grid row and baseline alignment
- **Count:**
  - li or row links with a 1-2px border-top/bottom: 24/29.
  - `list-style:none;margin:0;padding:0`: 22/29.
  - `align-items:baseline`: 21/29.
  - `minmax(0,1fr)`: 21/29.
  - `1px solid` anywhere: 26/29.
  - Typical row: `grid-template-columns: <num/label col> 1fr auto`. Title link on top, one-line grey description below.
- **Examples:**
  - `<ol style="list-style:none..."><li style="display:grid;grid-template-columns:64px 1fr;...border-top:1px solid #d6cdbb"><span ...color:#8c2b1f">1</span>`
  - `grid-template-columns:3.5rem minmax(0,1fr) auto;...align-items:baseline`
  - a guide index of title + description rows with `border-bottom:1px solid #cfcfcf`.
- **Test:** more than 50% of `ul/ol` have list-style none and each `li` has a border-top or border-bottom of 2px or less.
- **Real sites instead:** cards with images, tiles, or plain bulleted lists. A hairline-ruled index is a book/newspaper trope.

### 7. Two-weight rule system: heavy 2-4px rule + 1px hairline
- **Count:** 2-4px solid rules on header, section or table tops: 25/29. Combined with hairlines: 22/29.
- **Examples:** `border-top:3px solid #1a1714;border-bottom:1px solid`; `border-top:3px solid #121212`; `border-bottom:4px solid`; `2px solid #111111` used 4 times on one board; a live CSS comment reading "2px ink rules".
- **Test:** the page has both `border-*: [2-4]px solid <ink>` and `1px solid <grey>` as section dividers, and few boxes or fills.
- **Real sites instead:** real sites separate sections with background bands, whitespace or imagery. Thick-thin rules are a newspaper masthead device.

### 8. No photography, no brand imagery: type and rules only
- **Count:** 22/24 boards have zero `<img>`. 3/4 live sites have no images; the fourth has drawn SVGs only. The direction titled "countryside and photography" ships without a photo.
- **Test:** count of `<img>`/`<picture>` plus raster CSS backgrounds above the fold is 0.
- **Real sites instead:** local-service and marketplace sites lead with photos of the actual thing: pets and sitters, trailers and vans, people. This is the single biggest "real" signal they have, and the AI design omits it.

### 9. Every direction is framed as a print/object metaphor
- **Count:** 24/24 board titles are an object:
  - magazine, poster/zine, book contents, newspaper column, index
  - broadsheet, poster, desk, manual (numbered chapters), ledger, sentences
  - price tag, shelf price, bill, table, comparison
  - drawing, stable yard, search bar
  - the pilot is "a teletext page"

  5/5 global CSS files open with a prose "design system" comment naming the metaphor ("A dark spreadsheet", "a teletext page", "price tag").
- **Test:** can the direction be named "X as a <printed object>"? If yes, it is the AI concept move.
- **Real sites instead:** the direction is named after the user task or the brand ("search first", "local trust"). The look comes from brand assets, not a borrowed artefact.

### 10. Trendy Google Fonts pairing: "characterful grotesk + mono" or "editorial serif + sans"
- **Count:**
  - Two-family pairing: about 20/29.
  - A mono for labels or numbers: 11/29 (IBM Plex Mono x4, Spline Sans Mono x2, DM Mono, Space Mono, Geist Mono).
  - Bricolage Grotesque x4, Archivo/Archivo Narrow x4, Newsreader x3, Young Serif x2, Anton x2, Work Sans x2.
  - 0/29 use Inter, Roboto, Helvetica or system-ui as the primary face, so avoiding Inter is itself a tell.
  - Live sites: Bricolage + Atkinson, Familjen + IBM Plex Mono, Bricolage + IBM Plex Mono, Schibsted + Spline Sans Mono.
- **Test:** the font list matches the 2023-26 "designer Google Fonts" set and includes a `*Mono` used only for small labels or prices.
- **Real sites instead:** one family in a few weights (often licensed or system), and mono only where code or data really appears.

### 11. Small uppercase tracked labels, mono kicker lines and "·" metadata
- **Count:**
  - `text-transform:uppercase` with `letter-spacing` +0.04 to 0.08em: 15/29, and all 4 live sites (mostly `0.08em`).
  - " · " middot separators: 17/29.
  - A kicker line directly above the h1: 10/29.
- **Examples:** a mono 14px kicker "29 prices · checked 9.11.2026"; 13-15px labels with `text-transform:uppercase;letter-spacing:0.08em`; a live kicker "Adults only · no images".
- **Test:** an element under 15px with `uppercase` and positive tracking sits above an h1/h2, or a line matching `/\w+ · \w+/` sits in the hero.
- **Real sites instead:** labels are usually sentence case, at body or near-body size.

### 12. Identical code skeleton under every skin
- **Count:**
  - `<section aria-labelledby>`: 29/29.
  - `flex-wrap:wrap`: 28/29.
  - `repeat(auto-fit|auto-fill, minmax(...))`: 26/29.
  - `minmax(min(100%,Npx),1fr)`: 9 boards.
  - Token names `--bg --ink --ink-2 --line --focus`: 5/5 CSS files. `--surface` 4/5, `--paper`/`--rule` 3/5, `--measure|--prose` + `--wide|--shell` 5/5.
  - `:focus-visible{outline:2-3px solid var(--focus);outline-offset:2-3px}`: 5/5.
  - `.skip` link: 4/5. `text-wrap:balance` on headings: 4/5.
  - `*,*::before,*::after{box-sizing}` + `-webkit-text-size-adjust:100%`: 4/5.
  - `.on-dark`/`.on-light` re-scoped token blocks: 2/5.
  - WCAG boast comments ("Every text colour below is 4.5:1..."): 2/5.
  - HTML section comments in boards (`<!-- Quote form -->`): 11/24.
- **Test:** grep for `aria-labelledby` on every section, an `auto-fit,minmax` grid, and `--ink/--ink-2/--line/--focus` tokens.
- **Real sites instead:** this only shows in source. The visible effect is the identical auto-fit grid breakpoints and the same 2-column collapse on every site.

### 13. Copy tics: triplets, "How it works", "X in short", reassurance lines
- **Count:**
  - "A, B and/or C" triplets: 24/24 boards, mean 6.5 per board, up to 16. For example "for dogs, cats or horses", "trailer, van or move", "cap tables, valuation, dilution".
  - A "How it works" section (in Finnish boards: "Näin ... toimii", literally "This is how ... works"): 16/29.
  - "X in short" headings ("Prices in short", "The short answer first", "The rules in short"): 9/29.
  - Reassurance micro-lines ("The form does not commit you to anything.", "No account.", "Free calculators..."): present on most boards.
  - "Question: sub-question?" colon headings dominate one site ("A sexless relationship: can it work, and what if it can't?").
  - h1 ending in a full stop: 9/29.
  - About 45% of sentences are 8 words or fewer.
- **Test:** more than 3 comma-triplets per page, plus a "How it works" section, plus a one-line "no commitment / no account / free" reassurance.
- **Real sites instead:** copy is uneven, with brand names, real prices and specifics. Lists are often 2 or 4+ items, not 3.

### 14. Square corners as the "not-SaaS" reflex
- **Count:** 18/24 boards contain no `border-radius` at all. 26/29 designs have a radius of 6px or less. 3 of 4 live sites write "Square corners" or `border-radius:0` in their CSS; only one uses 14px.
- **Test:** the maximum `border-radius` on buttons, inputs and cards is 6px or less, or 0.
- **Real sites instead:** they use whatever their component library or brand sets, commonly 4-12px on buttons and inputs. Zero radius everywhere is a deliberate anti-template overcorrection, and it has become the new template.

### 15. Section rhythm: h2 + narrow lead + content, inside a narrow measure
- **Count:**
  - 55 of 123 h2s (45%) are followed directly by a lead `<p>`. Median lead length is 15 words, 90th percentile 22.
  - Leads are capped at `max-width:26-34rem`.
  - Body text is 16-19px with line-height 1.45-1.6 in 24/24 boards.
  - `--measure/--prose` is 42-44rem in 3/4 live sites.
  - A "section head" pattern (h2 left, "All ..." link right) on 2 live sites.
- **Examples:** `h2 ... <p style="max-width:28rem">`, `max-width:30rem`, `max-width:26rem`.
- **Test:** for each section, the first two children are h2 + p, where the p has max-width of 36rem or less and 10-25 words.
- **Real sites instead:** sections often have no lead at all, or go from heading straight into listings or images.

### 16. Split hero: text block left, functional block right (form, rows, card)
- **Count:** about 13/29, including 3 of the 4 live sites (one is a 960px 2-column hero).
- **Test:** the first section is a 2-item grid or flex-wrap with an h1+lead column and a list, form or card column.

### 17. Freshness and provenance stamps
- **Count:** 15/29. For example "Prices checked 9.11.2026 · 29 prices" in a hero, or "source on every price".
- **Test:** a "checked/updated <date>" line in the hero or a section head.

### 18. tabular-nums + mono for numbers
- **Count:** `tabular-nums`/`font-variant-numeric`: 15/29. Mono figures for prices: one board has 53 mono references, a table-concept board 250.
- **Examples:** a `.tabular` utility class; numeric styling on 4 separate rules in one live CSS file.

### 19. Thin one-line footer
- **Count:** 24/24 boards have a footer with at most 2 link lists. Most are a single row: "**site** · one-line description · links".
- This is the inverse of the common guess: the AI design does **not** make many-column footers. The minimal footer is the fingerprint.
- **Real sites instead:** multi-column footers with company info, contact, social links and legal text.

## Checked and NOT systemic (not worth fighting)
- Pill chips (`border-radius:999px`): 2/29.
- Hard offset shadows: 2/29 (one site only).
- "→" arrow links: 9/29.
- `<details>` FAQ: 5/29.
- Highlighter spans in the h1: 2/29.
- `prefers-color-scheme` dark tokens: only 6/29. Where present, it is the same `@media (prefers-color-scheme: dark){:root{...same tokens...}}` override.
- Em dashes: 0/29.

## Fast lint for a new design (any fail = looks AI-made)
1. It shares more than 40% of its h1/h2 text with the previous direction.
2. 0 photos (in a category whose real sites use them).
3. h1 has clamp(vw), negative tracking and line-height of 1.05 or less.
4. Background is #fff or cream, with 1 accent that is red, cobalt or yellow.
5. It has more than 2 ruled-row lists (list reset + 1px separators).
6. Its concept can be named "<site> as a <printed object>".
7. Fonts are a grotesk + mono pair from Google Fonts.
8. The footer is one line.

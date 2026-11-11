# Real-world design references (measured 2026-11-12)

> These are measurements of public sites taken on 2026-11-12. Sites change their design, fonts and colours often, so treat every value as a snapshot and re-measure before relying on it: `node scripts/measure.mjs <url> ...`. If a category you need is not here, measure 3 sites of your own.

## Method

- HTML fetched with curl (Chrome 130 macOS User-Agent). Every linked stylesheet and inline `<style>` was fetched too, and `@font-face` families were counted from that CSS.
- CSS alone can't give final sizes on Tailwind, CSS-in-JS or Webflow sites, so values were also measured in headless Chrome at 1440x900 with `getComputedStyle` (fonts from `document.fonts` with status "loaded"). Screenshots of the fold and the footer were checked by eye for structure and footer column counts.
- Colours are hex conversions of computed rgb values. "n/m" means not measured. "Brand colours" counts saturated, non-neutral colours seen in the computed styles of visible elements (greys, white and near-black text are left out).
- Card values come from a heuristic: an element 140 to 600px wide that contains an img or heading and has a radius, border, shadow or background. A few cards were checked by hand. Where it missed one (Omni tiles), the value comes from a direct probe.

## Blocked or dropped

| Site | Result |
|---|---|
| rover.com | HTTP 403 (bot block) on curl, 2026-11-12. Replaced by borrowmydoggy.com |
| kodinplaza.fi | HTTP 403 on curl. Not used |
| carta.com (incl. /learn/startups/) | HTTP 403 on curl. Replaced by calculator.net |
| nerdwallet.com/business/loans/calculators/business-loan | Cloudflare "Sorry, you have been blocked ... fundera.com" page. Used the NerdWallet compound interest calculator instead |
| pulley.com | Fetched, but the homepage banner says "Pulley is shutting down on 12/8/26" and that it has an "exclusive partnership with Carta". There's no public calculator (/tools, /calculators, /dilution-calculator all 404). Dropped |
| tori.fi | Fetched, but header, nav and footer did not show in the light DOM (probably web components), so measurement was partial. It's also classifieds, not price comparison. Replaced by vertaa.fi |
| tassuvahti.fi | Measured but not picked: a small Webnode site. Body falls back to Times, content uses Raleway Flex. Uppercase nav, 0px radius buttons, iStock photos |

---

## 1. Pet sitter marketplaces

Sources: https://www.pawshake.fi/ , https://www.borrowmydoggy.com/ , https://www.trustedhousesitters.com/ (all fetched 2026-11-12)

| | Pawshake.fi | BorrowMyDoggy.com | TrustedHousesitters.com |
|---|---|---|---|
| Fonts loaded | Roboto 400/500/700 (next/font, 54 @font-face blocks) | Lato 400/700 + Neucha 400 (handwritten) + Font Awesome | Poppins 400/600/700 |
| Body size / line-height | 16px / 24px (1.5), text #394147 | 18px / 25.2px (1.4), text #425168 | 16px / 24px (1.5), text #000; small print Arial 14/21 #657373 |
| H1 | 48px / 64px, 700, letter-spacing normal, #394147. Some words coloured #1F74AD | Visible hero headline is an SVG image ("Share the love of dogs"). Text h1 is Neucha 30px/30px 700 | The real h1 "Freedom to travel" is 36px/45px 600. The visual hero headline is an h2: 72px/92px 700 #006263. Letter-spacing normal |
| H2 | 32px / 44px, 700, normal | Neucha 32px / 44.8px 400; secondary h2 Lato 18.75px 600 | 32 to 40px, 600 to 700, normal, #006263 |
| Body / section bg | White body; hero is a pale blue gradient; blue band #5CACE2; footer #175782 | White body; pale blue band, beige testimonial band (hex n/m); footer slate with paw pattern | White html/body; sections #FBFAF9, mint #E8FAE9, dark teal #003939 |
| Primary button | "Löydä hoitaja": yellow gradient #FFD138 > #FFC507 > #EBB800, text #081D2B 16px 500, radius 12px, 48px tall | Green #10B981, white 17px 900, radius 5px, 55px tall. Header "Get started" #00C78C, "Sign in" #425168 | Hero CTAs dark teal #003939, radius 10px, 72px tall. "Join Now" purple #5A35D6, radius 10px, 48px. "Get started" lime #C9E94F with #003939 text |
| Brand colours | 4: #5CACE2, #1F74AD, #175782, #FFC507 | 2 main (green #10B981/#00C78C, slate #425168) + small yellow | 5: #003939, #006263, #C9E94F, #5A35D6, #E8FAE9 |
| Max content width | 1200px (max-width 1200px, 15 uses) | 1110px (Bootstrap-style container) | 1200px main; hero image 1344px wide |
| Button / card radius | Buttons 12px; cards 12px; hero photo 16px with 8px white frame | Buttons 5px; cards 6px and 7.5px | Buttons 10px; images 10px; cards 5/10/12px |
| Card border / shadow | Border: 1px #D5E2EB, white, no shadow. Hero search bar has a visible shadow (value n/m) | Mostly neither. One card has shadow 0 4px 10px rgba(0,0,0,.15) | Neither (no border, no shadow) |
| Imagery | Real photos (beagle + cat hero 509x380, cat in armchair, dog boarding) + small SVG illustrations (radar, service icons) | Mixed: full-bleed real dog photo hero (1440x400 bg), illustrated people + dogs in the owner/borrower blocks, user photos in testimonials | Real photos (1344x554 rounded hero dog, owner photos) + 3 SVG illustrations + app screenshot |
| Above the fold (in order) | Blue header bar; H1 left + photo right; h2 subline; search bar with 3 fields (Etsin: service dropdown, Lähellä aluetta, Päivämäärät) + yellow "Löydä hoitaja"; Trustpilot row ("Erinomainen", 6 629 arvostelua) | White header; full-width photo with a white card on the left: hand-drawn headline with heart, one-line pitch, 2 green buttons (Search for a dog / Find a borrower); then 2 columns "I'm an Owner" / "I'm a Borrower" with illustration + Get started | Header; rounded full-width photo with translucent text card: "Find your perfect match", subline, 2 dark buttons (Finding a pet sitter / Search for homes to sit); then "Freedom to travel" + 3 illustrated value cards |
| Nav items | 4 + language: Ala lemmikinhoitajaksi (pill), Rekisteröidy, Kirjaudu sisään, Apua, globe | 6 + 2 buttons: How it works, Safety and insurance, Doggypedia, FAQs, About us, Testimonials, Get started, "or", Sign in | 5 + CTA: Find a pet sitter, Find a house sit, How it works (dropdown), Help, Log in, Join Now |
| Footer columns | 3 (Tietoa meistä/Palvelut/Maksutavat; Lue lisää/Viralliset asiat/Maa; Käytettävissä/Löydä meidät), dark blue #175782 | 5 visual columns under 3 headings (About, Learn more, Need help?), slate with paw pattern | 5 (Help, Discover more, Start searching for..., Why not explore..., B Corp/social/app) |
| Distinctive | Script wordmark; blue words inside the H1; city pills band ("1000+ luotettavaa hoitajaa": Espoo ... Vantaa); payment logos in footer | Neucha hand-lettered headings; heart in the hero headline; grass silhouette above the footer; "or" between header buttons | Lime + dark teal palette; B Corp band; 72px hero type; owner vs sitter split |

### Conventions all 3 share
- Real pet photos lead the hero. Illustration only supports, never replaces, photos.
- One sans family carries all UI text (Roboto, Lato, Poppins). Body is 16 to 18px at about 1.4 to 1.5 line-height. Heading letter-spacing is normal on all three, with no negative tracking.
- Two audiences are split from the first screen: owner vs sitter/borrower, as 2 side-by-side CTAs (BMD, THS) or a separate "become a sitter" nav pill (Pawshake).
- Max width is 1110 to 1200px. Button radius is 5 to 12px: rounded, never pill.
- Cards are flat: a 1px light border or nothing. Shadows are rare.
- A trust signal sits in the first 1 to 2 screens: Trustpilot count, "Safety and insurance" in the nav, "16 years ... 280k+ members".
- The footer is a solid dark or brand-colour block with 3 to 5 link columns.

---

## 2. Price comparison and consumer info

Sources: https://hintaopas.fi/ , https://www.vertaa.fi/ , https://www.which.co.uk/ , plus the rental page https://www.motonet.fi/palvelut/motokarry (all fetched 2026-11-12)

| | Hintaopas.fi | Vertaa.fi | Which.co.uk | Bonus: Motonet Motokärry (trailer rental page) |
|---|---|---|---|---|
| Fonts loaded | Mulish 200-1000 (variable) + seasonMix 670 (display) | Neo Sans 400/700 + primeicons | National2 Regular/Medium/Bold | Barlow 400-800 + Barlow Condensed 800 + Roboto 400 |
| Body size / line-height | 16px / 24px, text #0C1F2A | 16px / 24px, text #0D0D0D (#212121 in most elements) | Body 16px / 18.4px; article/teaser p 18px / 27px, #000 | 16px / 24px, #323236 |
| H1 | seasonMix 48px / 56px, 670, normal | 42px / 60px, 400, normal, white on blue | 32px / 35.2px, 700, -0.5px, red #E81C30 ("The answer you can trust.") | 28px / 31.92px, 700, normal |
| H2 | Mulish 24px / 28px 700 (section titles); seasonMix 32px / 36px 670 (feature bands) | 42px / 60px 400 (second hero line); footer h2 16px 700 | Medium 18 to 21.92px, 500, normal | n/a on page (20 to 28px 700 on motonet.fi home) |
| Body / section bg | White; hero band light grey-blue (hex n/m); dark navy feature cards #00244F; footer light | Hero #164674 blue with a diagonal light-blue edge; content white | White and #F5F5F5 alternating | White; red header #E31B23; dark nav #323236; yellow promo bar #FAEA27 |
| Primary button | "Kirjaudu" #0070E0, white 14px 700, radius 100px (pill), 40px tall. Secondary #22313B pill | Search: round orange #F68C34. "Näytä kategoriat" #164674 full pill (radius 33554400px), 48px | "Join" #E81C30, radius 22px (pill), 44px, 16px 500. Search button blue (hex n/m) | "Vuokraa peräkärry" #323236, white 20px 700, radius 4px, 60px tall |
| Brand colours | 3: #0070E0, #0A3863, multicolour logo mark (red/yellow/blue) | 3: #164674, #F68C34, #1863DC | 2: red #E81C30, link blue #0050B3 | 3: #E31B23, #FAEA27, #323236 |
| Max content width | Fluid with 24px gutters (deal row 24 to 1104px) + 300px ad rail at right; one wrapper max-width 1304px | Fluid: categories span 16 to 1424px at 1440; footer 1280px | Sections max-width 1440px; visible content 1124px (x 158 to 1282) | 1280px (max-width 1280px; text column 768px) |
| Button / card radius | Buttons 100px; product cards 8px; panels 12px; dark promos 24px | Buttons full pill; category cards 16px | Buttons 22px; cards 4px | 4px everywhere |
| Card border / shadow | Border: 1px rgba(0,65,106,.12), white, no shadow (119 cards) | Both: 1px #E7E7E7 + 0 4px 8px rgba(0,0,0,.08) | Border: 1px #CCCCCC, no shadow | Neither (grey fill #F7F7F7) |
| Imagery | Product packshots on white (180x180); no lifestyle photos | Product cutouts floating around the hero + owl mascot "Benny" (illustration) | Editorial photography (lead 367x275, thumbnails 91x68) | Real photo of the trailer row in the store car park (709x360) + wordmark |
| Above the fold (in order) | Header (logo, Tuotekategoriat dropdown, assistant icon, Kirjaudu); H1 with logo mark; search with 2 tabs (Etsi / Avustaja "Uutuus!"); 3 icon benefits; "Luo tili"; "Parhaat Tarjoukset" card row (discount % chip, heart, product photo, name, price); right ad rail | Header (logo, 3 live counters: 244 Kaupat / 6491050 Arvostelut / 5996148 Tuotteet, "Liitä kauppasi" outline pill); centred 2-line H1; mascot; white search card (pill input + orange button, "vai", Näytä kategoriat); "Suositut kategoriat" row of 6 cards | Logo + 3 pill buttons (My saved items, Log in, Join); 11-item category nav; red H1 + pill search; lead story card + 6 thumbnail headlines in 2 columns; right subscription promo with red button | Red header with search; dark category nav; yellow promo bar; photo left + "Palvelu saatavilla tavarataloista" store dropdown + hours right; H1; price in bold ("Vuokra vain 20 € / päivä, kanta-asiakkaille vain 10€") |
| Nav items | 2 visible (Tuotekategoriat, Kirjaudu) + assistant icon | 4 (3 stat counters + Liitä kauppasi); categories behind a button | Top 3 buttons + 11 categories (Deals, Tech, Appliances, Home & garden, Money, Family, Health, Cars, Travel, Consumer rights & campaigns, Services) + Search | Top: search, Tavaratalot, Kirjaudu sisään, Kassalle. Nav: Katso tuotteet, Varaosat, Palvelut, Asiakaspalvelu, Motonet-sisällöt, Kanta-asiakas, Tarjoukset |
| Footer columns | 4 (Tiedot, Hintaoppaassa, Ehdot, feedback/app) | 3 (Vertaa.fi, Verkkokaupoille, Hyödyllisiä linkkejä) + country flags row | 6 (More from Which?, My account, For experts, For businesses, Our legal policies, Help) + app/contact band above | 4 (asiakaspalvelu text + button, Palvelumme, Tietoa ja ohjeita, Motonet) |
| Distinctive | Display serif-ish seasonMix only on H1/feature H2; AI "Avustaja" tab; % drop chips | Owl mascot; live counters in the header; diagonal hero edge | Red "?" wordmark; red H1; underlined blue links everywhere; heavy editorial density | Price stated in the second paragraph in bold; store picker before any copy |

### Conventions all 3 share (Hintaopas, Vertaa, Which?)
- Search is the hero. Each puts a large search field directly under or beside the H1, and the H1 is short (3 to 6 words).
- White content background with one dominant blue (#0070E0, #164674, #0050B3) for actions and links. Which adds red as its brand colour.
- Pill-shaped primary buttons (100px, full, 22px radius) at 40 to 48px tall.
- Cards have a 1px light border (all 3). Radius 4 to 16px. Shadows are absent or very soft (Vertaa 0 4px 8px at 8%).
- Body is 16px; Which runs longer teaser text at 18/27.
- Numbers are shown as proof: store counts, review counts, discount %, prices on cards.
- Product or editorial photos, not lifestyle stock. Imagery is small and functional.
- 3 to 6 footer columns of plain links.
- The rental-specific reference (Motonet) states the daily price in the first text block and puts a location picker next to the photo.

---

## 3. Health and relationship reading sites

Sources: https://www.terveyskyla.fi/ , https://www.vaestoliitto.fi/ , https://www.nhs.uk/ . Article pages measured too: https://www.terveyskyla.fi/naistalo/raskaus/raskauden-tuomat-muutokset-ja-yleiset-huolenaiheet/hiiva-raskauden-aikana , https://www.vaestoliitto.fi/seksuaalisuus/seksuaalioikeudet/oikeus-tietoon-seksuaalisuudesta/ , https://www.nhs.uk/conditions/chlamydia/ (all 2026-11-12)

| | Terveyskylä.fi | Väestöliitto.fi | NHS.uk |
|---|---|---|---|
| Fonts loaded | Lato 400/700 (body) + Capriola 400 (headings) | Poppins 400/500/600/700 (+ Roboto from the cookie tool) | Frutiger W01 400/600 |
| Body size / line-height (home) | 16px; p 16px / 25.6px (1.6), #333 | 16px / 24px, #000 | Body 16px; p 19px / 28px (1.47), #212B32 |
| Article body text | Lato 16px / 25.6px, #2A2A2A, column 690px (~77 chars/line) | Poppins 16px / 28px (1.75), #000, column 651px; lede 18px / 27px | Frutiger 19px / 28px, #212B32, column 629px; lede 26px / 32px |
| H1 | Home: Capriola 24px / 28.8px 400. Article: 32px / 44px 400 | Home h1 is visually hidden (clip rect 0). Article: 24px / 31.2px 700 | Home: 32px + 43.2px / 48.6px spans, 600, white on #005EB8 panel. Article: 48px / 54px 600. Letter-spacing normal |
| H2 | Home 40px / 48px 400; article 20px / 24px 400 teal #006664 | 24px / 31.2px 700 (28px on one); article 20px / 26px 700 | 26px / 32px and 36px / 42px, 600 |
| Body / section bg | White; light blue #E1F6FB and light green #E6F9E3 bands; purple nav bar #873899 | White; green nav bar and footer #6ABE28 | Body #F0F4F5; header #005EB8; white panels; footer #D8DDE0 |
| Primary button | Purple #873899, white 16px, radius 4px, 44px | Yellow #FFC61E "Tilaa uutiskirjeemme", black text, radius 0, 40px | Green #007F3B, radius 4px, 60px, 19px 600 (NHS button style). Service links: blue #005EB8 blocks, radius 0, 52px |
| Brand colours | 3: purple #873899, teal #006664/#008380, navy #2A477E (+ 2 pastel bands) | 3: green #6ABE28, yellow #FFC61E, link green #3F833F | 3: blue #005EB8, dark blue #003087, green #007F3B |
| Max content width | 1160px (content 1130px) | Header 1344px; content 1008 to 1040px (max-width 1170px) | 960px (gutter box 992px) |
| Button / card radius | Buttons 4 to 5px; cards 0px | Buttons 0px; no cards (lists) | Buttons 4px; cards 0px |
| Card border / shadow | Border: 1px #EFEFEF on white, no shadow | Neither (news and blog as plain text lists) | Border 1px #D8DDE0 + flat bottom bar 0 3px 0 #D8DDE0 (no blur) |
| Imagery | Stock photo hero (hand + phone, 1440x600), photo thumbnails 358x196, signpost illustrations | Branded green banner image 1008x448, article photos 488x325 | Photo hero background (1440x369), no other images on home (0 img elements > 80px) |
| Above the fold (in order) | Top tabs (Terveyskylän talot, Omapolku, TerveyskyläPRO); logo + search input + Hae + In English / På svenska + Kirjaudu; purple nav (8 items); photo hero with white text panel: H1, intro, "Katso esittelyvideo"; 3 signpost cards | Logo + yellow newsletter button + 4 social icons + FI/EN/SV + search + menu; green nav (6 items + yellow "Palvelumme"); banner image; "Ajankohtaista" news + "Väestöliitto mediassa" lists | Blue header (logo, search, My account); 5-link nav; photo hero with blue H1 panel; 2 large link cards (Health A to Z, NHS services) with chevrons |
| Nav items | 8: Talot, Omapolku, TerveyskyläPRO, Itsehoito-ohjelmat, Terveyskylä sotessa, Terveyskylän palvelut, Tietoa Terveyskylästä, Ajankohtaista | 7: Väestöliitto, Vaikuttaminen, Tutkimus, Kansainvälinen kehitys, Seksuaalisuus, Tue työtämme, Palvelumme | 5: Health A to Z, NHS services, Healthy living, Mental health, Care and support (+ Search, My account) |
| Footer columns | 2 (Mikä on Terveyskylä? / Ota yhteyttä + some) + legal row | 3 (2 bullet link lists + address block) | 4 link columns + Crown copyright |
| Distinctive | Rounded Capriola headings at weight 400; "talot" (houses) metaphor; left sidebar nav on articles (329px) | Bright green + yellow, square buttons; bold Poppins links | Large 19px body; underlined links; chevron action cards; grey page with white panels |

Extra, not one of the 3: Scarleteen (https://www.scarleteen.com/ , sex-ed Q&A) uses Lato 17.6px / 26.4px body in a 565px column, display faces Bobby Jones Sans and Pulp Display, bg #D3EEE0, text #382E31. Fully illustrated, no photos.

### Conventions all 3 share
- Reading comfort comes first: body text is 16 to 19px with line-height 1.47 to 1.75. Article column is 629 to 690px wide.
- One readable sans for body (Lato, Poppins, Frutiger). Headings use the same family or one friendly companion (Capriola). Heading letter-spacing is normal.
- Flat UI: cards at 0px radius with a 1px light border or no card at all. No soft drop shadows. Button radius 0 to 5px.
- A solid institutional colour bar carries the nav (purple, green, blue). The rest of the page stays white or very light grey.
- Search is in the header on all three.
- Imagery is secondary: one photo or banner hero, then text-led lists and links. No illustration-heavy pages.
- Max width is 960 to 1170px for content. Footers are short: 2 to 4 columns plus a legal row.

---

## 4. Finance calculators

Sources: https://www.omnicalculator.com/ + https://www.omnicalculator.com/finance/burn-rate ; https://www.calculator.net/ + https://www.calculator.net/business-loan-calculator.html ; https://www.nerdwallet.com/ + https://www.nerdwallet.com/banking/calculators/compound-interest-calculator (all 2026-11-12)

| | Omni Calculator | Calculator.net | NerdWallet |
|---|---|---|---|
| Fonts loaded | Poppins 400/500/600 (next/font) + DM Mono 400/500 (input numbers) | None: system Arial/Helvetica (0 @font-face) | Gotham 300-900 + Chronicle Display 400 (serif, calculator H1) |
| Body size / line-height | 15px / 21.15px, #0A0A0A; article p 13.4px / 24px | 16px / normal, #000 | 16px / 24px, #000 |
| H1 | Home: 30px 700 ("Your life in 3938 free calculators"). Calculator page: Verdana 28px / 36px 700 | 26px, 700, #003366, line-height normal | Home: Gotham 52px / 57.2px 700, -0.52px, white. Calculator: Chronicle Display 54px / 59.4px 400 |
| H2 | Home 34px / 44px 700; calculator 20 to 22px / 24 to 32px, 600 to 700 | 22px 400 white (Result bar) | Home 40px / 48px 500, -0.8px. Calculator: result number 36px / 42px 500 #006642; article h2 Chronicle 36px / 42px 400 |
| Body / section bg | #F7F9FF page with white panels | White; header #003366; home hero #E5ECF3-ish band (n/m exact) | White; mint #EFFCF8 and cream #FFF7EA bands; footer cream; hero green #006642 |
| Primary button | Blue #3B68FC, white 14px 500, radius 6px, 40px. No "Calculate" button: results update live | "Calculate" green #4C7B25, radius 0, 40px, 16px 700. "Clear" grey #ABABAB | Green #008254, radius 2px (header) / 8px (promo CTA), 44px, uppercase 13 to 14px 700, letter-spaced. Calculator updates live (no button found) |
| Brand colours | 2 to 3: blue #3B68FC, magenta #BE05C1 (+ logo red/yellow) | 3: navy #003366, link blue #006699, green #4C7B25 | 3: green #008254, dark green #006642, lime #A8EA4C (+ mint and cream tints) |
| Max content width | Home 1280px (tile grid 1344px); calculator article column 740px | 1100px | 1152px (also 1280px wrappers) |
| Calculator inputs | Labels above, 13.4px 500. Bare 36px input in a 40px field, DM Mono 18px, unit select on the right (EUR, mos). Field box 1px border, radius n/m exactly | Labels left of input. Inputs 110 x 30px, radius 2px, 1px #044284 border, Arial 16px | Labels above. Inputs 320 x 44px, radius 2px, 1px #8B8C8F border, Gotham 16px |
| Calculator layout | Left: title, authors/reviewers, ratings, share tools, table of contents. Right: calculator card 400px wide (r 10px, 1px #C3C8D4, white) with grouped sections ("Burn rate & cash runway") | Form box left (#EEEEEE, 1px #BBBBBB, 305px), result box right (green header bar, label/value table, pie chart), 336px ad/sidebar right | Input panel left (#F4EEE6, 368px, radius 0), result card right (1px border) with big total "$11,000.00" and line chart |
| Card radius / border / shadow | Tiles 8px, 1px #C3C8D4 + 0 1px 2px rgba(59,104,252,.1). Calculator card 10px, 1px border, no shadow | 0px; 1px grey borders; no shadow | Home cards 12 to 16px, no border; calculator chart card 1px border; one modal shadow |
| Imagery | None (line icons for categories; author headshot) | 4 grayscale round photos on home only; none on calculator | Hero lifestyle photo (man on sofa) + 3D object illustrations on category cards; none on calculator |
| Above the fold (in order) | Home: header (logo, Insights, Log in, Sign up); H1 left + full-width search; grid of 14 category tiles with icon + count. Calculator: header with search; 14-category nav; title block left + calculator card right | Home: navy header; scientific calculator widget + "Free Online Calculators" + search; 4 columns of category links. Calculator: breadcrumb, H1, 3-line intro, blue instruction bar, form + result side by side | Home: header; green photo hero with H1 + AI search box; overlapping card grid (Credit cards, Insurance, ...). Calculator: breadcrumb, serif H1, one-line intro, grey disclosure box, inputs + result/chart |
| Nav items | 14 categories (Biology ... Other) + Log in, Sign up | Calculator pages: 4 (Financial, Fitness & Health, Math, Other) + sign in; home has none | 9: Credit cards, Banking, Home, Loans, Insurance, Personal finance, Investing, Small business, Taxes + search, Sign in, Sign up |
| Footer columns | 4 (brand + Calculator categories / Press / Meet Omni / More Omni) | 0 columns: one text block + inline links row | 4 (brand + About, Help, Legal) followed by long disclosures |
| Distinctive | Monospace numbers in inputs; per-field "..." menus and unit selects; named author and reviewers above the tool | 2008-era utility look; result as a plain table + pie chart; dense internal link lists | Serif display H1 on tools; huge green result number; advertiser disclosure above the tool |

### Conventions all 3 share
- Calculator page order: H1, a 1 to 3 line plain description, the tool, then a long explanatory article below (all 3).
- Inputs on the left or top, results on the right, with the main output shown as a single large number or a labelled table (+ chart on 2 of 3). Two of three recalculate live, with no Calculate button.
- Labelled fields, 30 to 44px tall, 2 to 10px radius, 1px border. Units shown inside or right of the field ($, %, EUR, years).
- Body is 15 to 16px. Max width 1100 to 1280px; the article column runs narrower (740px on Omni).
- Flat panels: grey or tinted input panel and white result card, 1px borders, minimal or no shadow.
- Top nav is a category list (4 to 14 items) rather than marketing links. Breadcrumbs on calculator pages (calc.net, NerdWallet).
- 2 to 3 brand colours, one of them a green or blue "money" colour for the main action or result.
- No photography on the calculator page itself (all 3).

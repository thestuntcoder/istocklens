# iStockLens landing page

Four responsive landing-page variants built with **Jekyll 4.4** and **locally compiled Tailwind 4**. The original editorial direction is preserved; V2 is an assertive blue research-brief alternative, V3 combines editorial warmth with stronger blue typography, and V4 is a modern, product-led research workspace. No Tailwind CDN, external font requests, browser framework, analytics, or forms. Product and commercial claims follow the supplied public research.

## Compare the designs

At the preferred preview address (use the actual URL printed by the launcher):

- **Original:** http://127.0.0.1:4001/ — original landing page, with more readable mobile typography.
- **Version 1:** http://127.0.0.1:4001/version-1/ — the same original content and appearance.
- **Version 2:** http://127.0.0.1:4001/version-2/ — navy/cobalt, condensed bold typography, research-terminal artwork, ruled grids and a rectangular money-back stamp.

- **Version 3:** http://127.0.0.1:4001/version-3/ — “Before you buy, know why,” with pale-blue surfaces, bold navy type, blue serif accents and a crisp white research card.

- **Version 4:** http://127.0.0.1:4001/version-4/ — “Research the stock. Challenge the thesis.” A product-led research workspace with bold sans-serif type, cool-gray/teal panels, interactive scores and a downloadable checklist. Revised after feedback that the first V4 was too editorial.

V2 and V3 have discreet version switchers; V4's footer links to all four designs. Variants share the original verified product facts and locally compiled Tailwind CSS. V4 has its own content, layout, components and progressive-enhancement JavaScript. Alternative styling is scoped by body class or prefixed component classes.

**Mobile reading comfort applies to every version and the homepage:** 18px main copy, 16px supporting text/controls, 14px minimum visible labels, and reflowed research content below 960px. Desktop appearance is preserved. See `docs/mobile-readability.md` for implementation and verification.

## Prerequisites and install

Ruby 3.1+ (tested 3.1.2), Bundler 2.6.8, Node 22 / npm.

```sh
bundle install
npm ci
npm run build
```

`npm run build` compiles `_styles/main.css` into `assets/css/main.css`, then runs production Jekyll into `_site/`. Both generated paths are Git-ignored. **Run the CSS build before standalone Jekyll commands.** The lockfiles pin both dependency trees. Font binaries and social preview assets are committed source assets; there are no runtime asset downloads.

## Development

```sh
npm run dev
```

The launcher prefers **http://127.0.0.1:4001/** and LiveReload websocket **35730**. It reserves available sockets before building; if either preferred port is occupied, it independently selects the next free port. **Read the printed URL**, rather than assuming a port. Ports **4000 and 35729 are always reserved for the other project**; even explicit overrides cannot use them. Nothing kills a port’s current owner.

```sh
PORT=4010 LIVERELOAD_PORT=35740 npm run dev
# Optional bind address (default local-only): HOST=127.0.0.1
```

`PORT`, `LIVERELOAD_PORT` and `HOST` are optional environment overrides. Explicit ports must be distinct integers from 1–65535; conflicts, invalid values and protected ports fail with clear errors, rather than silently moving. Unspecified ports still auto-select. Binding a non-loopback `HOST` exposes the preview to that interface; this is a development server, not a production host. A rare bind race after reservation fails safely without stopping the new owner.

`npm run dev` builds CSS first, then coordinates Tailwind `--watch=always` and Jekyll `serve --livereload`. `npm run serve` is an alias for the same managed workflow. **Ctrl+C** stops the launcher and both owned child process groups; if either watcher fails, the other is stopped too. For low-level CSS-only work, `npm run css:watch` remains available.

Each invocation prints its launcher PID and log directory: `tmp/dev/<timestamp>-<pid>/`. It contains `css-build.log`, `css.log`, `jekyll.log`, and a live `state.json` recording URL, ports and child PIDs. State is removed on clean shutdown; logs are retained and Git-ignored. To detach for an agent handoff:

```sh
mkdir -p tmp/dev
nohup node scripts/dev.mjs > tmp/dev/launcher.log 2>&1 < /dev/null &
# Read tmp/dev/launcher.log for the actual URL and launcher PID.
# Stop that exact launcher (not a process discovered merely by port):
kill -TERM <launcher-pid>
```

Use `ps -p <launcher-pid> -o pid,command` to confirm identity before stopping a stale handoff. Allow two seconds for cleanup, then restart with `npm run dev`. Do not use `kill -9` for normal shutdown. `lsof -nP -iTCP:<http-port> -iTCP:<lr-port> -sTCP:LISTEN` verifies sockets without disrupting them.

Documentation, tests, npm dependencies, logs, `.pi`, temporary artifacts, Playwright configuration/reports and style sources are excluded from Jekyll output and watching. Tailwind scans explicit template paths only. Compiled CSS is intentionally included in Jekyll, so a CSS rebuild triggers browser reload without a loop. **Do not run production builds/checks concurrently with dev**: both write `_site/` and the CSS output. Stop, check, then restart. Configuration and launcher changes also require a restart.

## Content map

- `index.html` and `version-1/index.html`: original routes, both including `_includes/version-1-content.html`.
- `_includes/version-1-content.html`: shared original/V3 page argument and interactive sample panels. An optional `hero_report` include parameter selects V3 artwork; original routes retain their original artwork and rendered content.
- `version-3/index.html`, `_layouts/version-3.html`, `_includes/version-3/`: V3 route, metadata, navigation, artwork and footer.
- `_styles/version-3.css`: isolated blue editorial overrides and responsive artwork styles, using the existing self-hosted Manrope and Instrument Serif fonts.
- `assets/images/version-3-{favicon,social}.svg` and `version-3-social.png`: V3 branding and social assets.
- `version-4/index.html`, `_layouts/version-4.html`, `_includes/version-4/`: independent V4 composition, research notebook, wordmark, navigation and footer.
- `_styles/version-4.css`, `assets/js/version-4.js`, `_data/version4.yml`: isolated V4 styles, menu/research/checklist behavior, research questions and new FAQs.
- `assets/resources/independent-research-checklist.txt`: downloadable plain-text worksheet; no email collection or automated claim validation.
- `assets/images/version-4-{favicon,social}.svg` and `version-4-social.png`: V4 favicon and social artwork.
- `docs/version-4-design.md`: new audience/visual direction, factual boundaries and validation notes.
- `version-2/index.html`: alternative page composition, benefits, process, guarantee and FAQs.
- `_layouts/version-2.html`: V2 metadata and shell; loads the same local CSS/JS as V1.
- `_includes/version-2/`: dedicated header, footer, research-brief artwork and interactive sample.
- `_styles/version-2.css`: isolated blue tokens, typography, components and responsive rules, imported by `_styles/main.css`.
- `assets/images/version-2-{favicon,social}.svg` and `version-2-social.png`: original V2 branding and 1200 × 630 social artwork.
- `_data/site.yml`: verified external destinations and canonical guarantee sentence.
- `_data/sample.yml`: explicitly illustrative Apple/AAPL sample and scores.
- `_data/faqs.yml`: FAQ copy.
- `_includes/`: navigation, footer, custom logo/icons and HTML/SVG report artwork.
- `_layouts/default.html`: page shell, metadata, canonical and local assets.
- `_styles/main.css`: Tailwind import/source scanning, design tokens, crafted components and responsive behavior.
- `_styles/mobile-readability.css`: scoped phone/tablet readability overrides for the original/V1, V2 and V3; V4 retains its existing dedicated overrides. All apply below 960px.
- `assets/js/main.js`: progressive enhancement for menu and accessible tabs. Without JavaScript navigation is visible, all sample panels are readable, and native FAQs work.
- `_config.yml`: title, description, canonical host and build exclusions.
- `docs/ui-design-spec.md` and `.agents/product-marketing.md`: source-of-truth design and factual constraints.

Fonts: Manrope variable 400–800 and Instrument Serif italic, Latin WOFF2 subsets from Google Fonts, self-hosted under `assets/fonts/` with their SIL Open Font License files. V2 adds **Barlow Condensed 800**, also a local Latin WOFF2 with `BarlowCondensed-OFL.txt`, and uses Manrope for supporting copy (no serif on V2). V4 uses local **IBM Plex Sans 400–700** throughout; no serif fonts are loaded. The previous V4's Source Serif 4 font/license remain archived as source assets, without a font-face or preload. Font licenses are included under `assets/fonts/`. System fonts provide fallbacks. Each variant has original SVG social artwork with a PNG counterpart for crawler compatibility; the V2 SVG embeds its licensed heading font for standalone rendering.

## Verify

```sh
npx playwright install chromium  # one-time browser installation for automated checks
npm run check                   # production build + workflow tests + browser tests + Jekyll doctor
npm run build                   # production CSS and site only
npm run test:workflow            # port validation / selection / non-destructive conflict tests
npm run test:browser             # browser regression tests against an existing production build
npm run test:browser -- --workers=1  # serial mode for stable axe checks on busy machines
bundle exec jekyll doctor
SCREENSHOTS=1 npm run check      # captures in tmp/screenshots/ and tmp/version-{2,3,4}/
```

Browser tests serve `_site/` on OS-assigned loopback ports and close their own servers afterwards. **48 Chromium tests** retain the original 15 checks and 14 V1/V2 variant checks (including desktop above-the-fold CTA/guarantee visibility): root/V1 body/computed-style identity and screenshot equivalence at six widths; V2 local fonts/license, blue metadata/artwork, destinations, shared sample scores, vertical/horizontal keyboard tabs, menu/anchors, native FAQs, reduced motion and all-panel no-JS rendering. Responsive V2 checks cover 320, 390, 768, 1024, 1440 and 1920px, including fitted three-line headings and artwork bounds. Five focused V3 tests cover the exact motto, local metadata/assets, comparison links, unchanged guarantee and download CTAs, blue tokens and font weights, headline/art bounds at the same six widths, keyboard controls and no-JS fallback. V3 full-page and hero captures cover 320, 390 and 1440px. Eight V4 tests cover its product-led identity, sans-serif typography, local fonts/artwork, side-by-side desktop hero and score bars, all research states at six widths, keyboard/menu/native FAQ behavior, truthful checklist progress, real worksheet download, reduced motion and no-JS rendering. Six additional cross-variant tests extend mobile readability and no-JS coverage to the homepage and Versions 1–3, with desktop type/grid guards. Mobile readability checks cover 320–959px across all variants: 18px main copy, 16px controls/supporting text, no visible text below 14px, 44px+ touch targets, and semantic stacked research scores on phones. Desktop type and table layout remain unchanged at 960px and above. Axe WCAG A/AA checks cover all four designs, all sample states and expanded controls. No test navigates to the original app; external destinations are compared against the supplied verified allowlist. Automated accessibility checks are not a full accessibility certification.

If the bundled browser cannot be installed, use an installed Chrome with `CHROME_CHANNEL=chrome npm run check`. Failures are explicit, not silently skipped; ignored `test-results/` contains screenshots and traces (`npx playwright show-trace <trace.zip>`). If no browser tooling is available, run build, workflow tests and doctor separately, then use the following manual fallback at the printed dev URL and record that limitation:


- The header menu opens on mobile, closes with Escape (returning focus) and closes after following a link.
- The hero’s “Explore a sample” scrolls to the report below the sticky header.
- Each report tab shows different content. ArrowLeft/Right wrap; Home/End select first/last. V2’s vertical rail at 768px and above also uses ArrowUp/Down; its ARIA orientation updates on resize. Exactly one tab is selected and in the tab order.
- Each native FAQ expands using click, Enter or Space. With JavaScript disabled, navigation and all three report panels remain available.
- Primary CTAs lead to `https://istocklens.com/download`; other external links use only the verified paths in `_data/site.yml`.
- At 320px, mobile, tablet and desktop widths there is no horizontal page overflow; sample labels remain visible. Reduced motion disables smooth scrolling and decorative transitions.

- Inspect at 320, 390, 768, 1024 and 1440px, including a short mobile viewport with the menu open. Scroll the menu to its CTA; tab through all links and observe visible focus.
- With dev running, temporarily add a Tailwind utility to `index.html`, save, and confirm both CSS and the browser update without manual refresh. Restore the edit; leave idle for several seconds and confirm `jekyll.log` does not repeatedly regenerate. Saving files under `docs/` or `tmp/` must not rebuild.
- With two harmless local listeners occupying the preferred ports, confirm dev chooses different ports. Explicit occupied overrides must fail. Stop with Ctrl+C, verify both owned children exit, then restart. Never use the protected project’s processes as test targets.

Actual verification and handoff details are recorded in `docs/development-verification.md`; V4-specific checks are in `docs/version-4-design.md`, and the latest all-variant checks and preview handoff are in `docs/mobile-readability.md`. Screenshots, logs and traces belong only in ignored paths.

## Publishing requirements — owner confirmation required

- Guarantee exactly: **100% money back if customer does not use the app.** Subscription non-use is the sole stated condition. The guarantee is not investment protection, dissatisfaction coverage or a return promise.
- **Confirm eligibility and the refund process with the owner before production.** Do not invent time limits, procedures or additional restrictions; the implementation deliberately adds none.
- **Pricing is not verified.** The known `/pricing` endpoint returns 404. There are no prices, pricing links, trial lengths, discounts or invented plans here.
- Confirm legal copy, supported coverage, and download destination readiness before publishing. This page makes no specific coverage claim.
- Confirm deployment ownership and canonical URL in `_config.yml` (currently `https://istocklens.com`). Social metadata uses this host.
- The sample is not live data or investment advice. Scores and labels must remain illustrative. Hero chart is conceptual, not a price history. Quantitative ratings and automatic summaries do not replace independent verification.
- No fabricated testimonials, ratings, customer counts, avatars, endorsements or investment outcomes are included.

## Milestones

- `0498046` — Build the branded Jekyll landing page.
- `72ad19c` — Harden development workflow and polish the running experience.
- `08684a3` — Refine guarantee copy and finalize the original preview.
- `1ddc598` — Preserve the original landing page as version-1.
- `c25d7d8` — Implement and validate the distinct version-2 landing page.
- Final V2 polish — keep the research CTA and guarantee above the desktop fold, with regression coverage.
- `b73ad0a` — Add the blue editorial version-3 with the original motto.
- `cf8ad9c` — Create the initial version-4 for analytical investors.
- V4 workspace refinement — remove the editorial direction in favor of bold sans-serif typography, a split product hero and compact data-led panels.
- All-variant mobile readability — larger reading text, controls, labels and score rows on every route, preserving desktop styling.

See `git log --oneline` for the full commit history and `docs/development-verification.md` for verification details.

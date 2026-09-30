# Development workflow and variant-preview handoff

## Latest guarantee update — 2026-09-30

Owner-approved guarantee: **If you don’t use or don’t find the app useful, you get 100% of your money back.** This supersedes the earlier non-use-only wording recorded in the historical verification below. Both alternatives apply to the app subscription, not investment performance or losses; no refund window, procedure or extra conditions were added.

- Updated all five landing routes, four themed signup flows, shared FAQs, hero reminders, guarantee headings/seals and current product/design documentation. Canonical guarantee, short reminder and scope live in `_data/site.yml`.
- Production build, **74 Chromium browser + 3 workflow tests (77 total)** and Jekyll doctor passed. Includes an all-route guarantee/FAQ/embedded-signup regression, responsive guarantee text bounds at 320/390/768/960/1440px, and exact guarantee/scope checks in all four desktop dialogs and phone flows.
- Existing mobile readability, desktop typography, root/V1 equality, keyboard/no-JS, test-payment and axe checks remain passing. CSS, JavaScript and payment behavior are unchanged. No real Stripe-network smoke was rerun for this copy-only update; current payment checks use deterministic stubs.
- Evidence: `tmp/guarantee-copy/check.log`, `visual.json`, and guarantee captures at 320/390/1440px; signup captures in `tmp/signup-flow/`. Chromium automation is not a physical-device or full accessibility certification.
- Managed preview restored on **4001 / 35730**. See `signup-flow.md` for the latest handoff; protected **4000 / 35729** were not touched.

## Historical original/V2 verification

Verified 2026-09-29 in `/Users/dj/Sites/istocklanding`.

## Running preview

- **Original:** http://127.0.0.1:4001/
- **Version 1:** http://127.0.0.1:4001/version-1/
- **Version 2:** http://127.0.0.1:4001/version-2/
- **HTTP:** 4001; **LiveReload:** 35730, both bound to 127.0.0.1.
- **Launcher PID:** 16557; **Tailwind watcher:** 16563; **Jekyll:** 16566.
- Started detached with `nohup node scripts/dev.mjs > tmp/dev/launcher.log 2>&1 < /dev/null &` (the same launcher used by `npm run dev`).
- Combined startup/output log: `tmp/dev/launcher.log`.
- Per-process logs and runtime state: `tmp/dev/2026-09-29T19-49-04.402Z-16557/` (`css-build.log`, `css.log`, `jekyll.log`, `state.json`).
- Stop: confirm `ps -p 16557 -o pid,command`, then `kill -TERM 16557`. Wait two seconds for its owned children to exit. Restart with `npm run dev`; read the newly printed URL and ports.
- All three routes and the LiveReload script returned **200**. Chromium completed the websocket handshake on **35730**, observed source/CSS reloads without manual refresh, and captured the restored V2 preview.
- Other project's Ruby PID **77749**, listening on **4000 / 35729**, was unchanged before/after every lifecycle test. No signal was sent to it.

PIDs and paths above describe this handoff, not permanent configuration. The live state file is removed at shutdown. Check identity before acting on a stale PID. Production build/check commands and dev share generated outputs: stop dev before rebuilding or running the full suite, then restart.

## Original-page verification (before V2)

The original `SCREENSHOTS=1 npm run check` passed:

- Production Tailwind compilation and Jekyll build.
- **3 Node workflow tests:** strict port values/protected ports; automatic selection around occupied sockets; explicit conflicts fail without disturbing the owner.
- **15 Chromium browser tests:** local links/anchors/assets, destination allowlist, production exclusions, metadata, one h1, exact guarantee sentence, mobile Escape/outside-click/link-close behavior, short-screen menu scrolling, Arrow/Home/End tab behavior and roving focus, all six native FAQs using Enter/Space, nine responsive widths, reduced motion and no-JavaScript fallback.
- Layout widths: **320, 375, 390, 768, 900, 1024, 1100, 1440, 1920px**, with no document overflow and report/hero bounds checked. The menu also passed at **390 × 320px**.
- axe WCAG A/AA rules: **zero violations** on desktop/mobile across all three sample tabs and expanded FAQ/menu states. This is automated coverage, not a full accessibility certification.
- Jekyll doctor: **“Everything looks fine.”**
- `npm audit --omit=optional`: **0 vulnerabilities**.
- `git diff --check`: clean.

Full check output: ignored `tmp/final-check.log`. Default Playwright configuration uses its installed full Chromium channel; the initial headless-shell binary was absent, so the configuration explicitly selects `chromium` instead. Installation instructions and an installed-Chrome alternative are in README. No original private dashboard was accessed; external URLs were checked against supplied verified destinations, not navigated to.

## Original workflow / lifecycle verification

A bounded smoke test (local script/output in ignored `tmp/verify-dev.mjs` and `tmp/dev-verification.log`) exercised the actual launcher, not only the port helper:

1. SIGINT stopped the initial launcher, Tailwind and Jekyll and freed its HTTP/LiveReload ports.
2. Harmless test listeners occupied 4001 and 35730. Dev selected **4002 and 35731** automatically and left those listeners intact.
3. Occupied HTTP and LiveReload overrides, protected 4000/35729 overrides, and equal HTTP/LiveReload overrides all exited with clear errors before starting children.
4. Chromium completed the LiveReload websocket handshake. A temporary hidden utility in `index.html` produced new Tailwind CSS and appeared in the browser **without manual refresh**. Real websocket reload frames were observed.
5. After settling, Jekyll regeneration count stayed unchanged during a three-second idle period and while writing excluded documentation/log files. No recursive build loop was observed.
6. The temporary source edit was restored, and the browser reloaded to the restored page. Test documentation was removed.
7. Ctrl+C removed owned child processes and runtime state, while preserving the harmless occupied-port listeners. Explicit free overrides restarted successfully with HTTP 200.
8. A separate **`npm run dev` process-group SIGINT** test passed: launcher 90784 and both owned children exited. The final detached preview was then started fresh.

## Visual refinements made from inspection

- Fixed no-JavaScript mobile header overflow with an in-flow stacked fallback; tested at 320, 768 and 1024px.
- Kept the enhanced mobile menu within short viewports using a scrollable, viewport-bounded panel.
- Enlarged narrow-screen sample tabs from 8–9px to 11px with wrapping and larger hit areas; enlarged sample body, FAQ and illustrative-label text.
- Corrected footer disclosure contrast (the original 4.36:1 failed axe); darkened it and increased text size.
- Refined the 320px headline and grid sizing so hero CTAs/art respect both gutters, not merely the page overflow boundary.
- Inspected desktop/phone hero captures, full-page rhythm and a 2× full-size report capture. Artwork remains HTML/SVG with self-hosted fonts, not a scaled bitmap.

Ignored screenshots: `tmp/screenshots/page-{width}.png`, `hero-{320,390,1440}.png`, `report-desktop-2x.png`, `sample-mobile-2x.png`, `menu-mobile-2x.png`. No screenshots, browser traces, caches, generated CSS/site output or logs are intended for Git.

Not performed: manual screen-reader certification, physical-device checks, or Firefox/Safari browser matrices. README includes concrete manual checks when browser tooling is unavailable.

## Original-page final review and commercial caveats

- Milestones committed: **`0498046` — Build the branded Jekyll landing page** and **`72ad19c` — Harden development workflow and polish the running experience**. See Git history for the final copy/documentation review commit.
- Reviewed the running page in the connected Chrome profile, including the full desktop composition and the sample anchor/tab interaction. Reviewed the 390px mobile capture and full-page desktop rhythm.
- Polished the customer-facing guarantee to: **If you don’t use the app, you get 100% of your money back.** This preserves the supplied non-use condition without adding deadlines, eligibility restrictions, refund procedures or investment protection.
- Re-ran `npm run check` after the final copy edits: production build, 3 workflow tests, all 15 browser tests, automated accessibility checks and Jekyll doctor passed. Final log: ignored `tmp/parent-final-check.log`.
- Restarted the managed development server after verification; both the preview and LiveReload script returned HTTP 200. The runtime details above reflect this final restart.
- Owner confirmation of guarantee eligibility and the refund process is still required before production.
- Pricing remains unverified; `/pricing` is known to return 404. No pricing links, prices, plans, discounts or trial periods were added.

## Version 2 — final validation

The initial V2 `SCREENSHOTS=1 npm run check` passed after stopping the identity-verified original launcher **98323** with SIGTERM and confirming both owned children exited: production Tailwind/Jekyll build, **3 workflow tests**, **28 Chromium tests** (the existing 15 plus 13 variant/preservation tests), and Jekyll doctor **“Everything looks fine.”** Browser suite: **19.5 seconds**. No dependencies, browsers or launchers were replaced.

An earlier recheck, after font-license whitespace cleanup and an identity-verified SIGTERM shutdown of launcher **92669**, passed the build, all **3 workflow tests** and **26 browser tests**; both axe tests reached their 30-second runtime limit (no accessibility assertion failure). The two unchanged tests then passed with **zero axe violations** using `npx playwright test --grep 'automated accessibility checks|V2 axe WCAG' --workers=1`: **2 passed in 9.5 seconds**. Jekyll doctor separately passed. Thus every browser test passed across the final run and focused recheck; the last full command itself exited nonzero on those timeouts. Logs: ignored `tmp/version-2/final-check.log`, `accessibility-recheck.log` and `doctor-recheck.log`.

Final visual review tightened desktop hero spacing and set its headline maximum to **116px**, retaining the strong type while keeping both the CTA and guarantee visible at 800px-high desktop viewports. Added regression coverage at 1280/1440/1512/1920px. The complete final production build, **3 workflow tests**, **29 browser tests** (run serially), both axe suites and Jekyll doctor all passed in one run. Browser tests took 29.7 seconds; log: ignored `tmp/version-2/parent-final-check.log`. The managed preview was restarted afterward and all routes plus LiveReload returned HTTP 200.

### Original-route preservation

- `index.html`, `version-1/index.html`, `_includes/version-1-content.html`, the original layout/includes/artwork, shared `_data` and all original CSS rules remain unchanged from **`1ddc598`**. Only additive Tailwind import/source declarations were made in `_styles/main.css`; shared JavaScript adds V2 selectors and optional vertical-tab behavior without changing V1 behavior.
- Pre-edit baselines and final live captures at **320, 390, 768, 1024, 1440 and 1920px** matched in body text, geometry and every computed property on representative original components. Image comparison found **zero channel differences beyond 10% rasterization tolerance**. Log: `tmp/version-2/baseline-check.log`; before/after images and JSON are in that directory.
- The browser regression checks root/V1 body HTML and computed geometry/styles for exact equality, plus decoded screenshot equivalence at all six widths. It also rejects blue tokens or a version switcher on the original routes. A first full run exposed brittle PNG-byte equality at 1920px despite identical computed output; the final test uses Playwright’s antialias-aware pixel comparison (`threshold: 0.1`, `maxDiffPixels: 0`) with fresh root references in ignored `tmp/browser-comparisons/`.

### V2 visual, factual and accessibility review

- Inspected fresh screenshots at all six requested widths, plus full-page desktop/small-desktop rhythm, narrow-phone sample details and the local social image. Three-line Barlow Condensed 800 headline reaches **116px** at 1440/1920px after final first-fold refinement. No overflow, clipping, distorted research brief, serif or original green palette was found.
- Reviewed the distinct navy terminal artwork, blue/steel section alternation, oversized process counters and rectangular guarantee stamp. Headings, sample scores and supporting type remain live HTML/CSS, not a bitmap.
- All three tabs change content; correct shared scores **65 / 90 / 90 / 49 / 75**, **Strong** quality and **Pricey** valuation are present. Tested vertical Up/Down, phone Left/Right, Home/End, wraparound, roving tabindex, panel focus and responsive ARIA orientation. Checked skip link, visible focus, menu Escape/outside-click/link closure, short-screen scrolling, sticky anchors and comparison-link navigation.
- **Zero axe WCAG A/AA violations** across desktop/phone tab states and expanded FAQs/menu. All six native FAQs work using Enter/Space. No-JS leaves all panels/navigation usable at six widths; reduced motion disables smooth scrolling/transitions. Manual visual review was supplemented by contrast calculations: white/cobalt **5.17:1**, muted/cool-white **5.75:1**, muted/steel **5.20:1**, cobalt focus/cool-white **4.73:1**, secondary chart bar/cool-white **3.15:1**. Log: `tmp/version-2/contrast-check.log`.
- Verified local font loading, SIL OFL license, unchanged currentColor logo geometry with navy center, V2 title/canonical/theme color/favicon and **1200 × 630** PNG plus SVG social assets. No external font or runtime asset requests occurred.
- CTA destinations use the supplied verified allowlist; no external app navigation was performed. The exact non-use guarantee and investment-risk disclaimers are retained. Both samples are explicitly illustrative; no fabricated pricing, market data, performance or testimonials were introduced.

### Final live-preview handoff

The detached preview above was restarted using the documented `nohup node scripts/dev.mjs` command. **All three URLs return 200.** LiveReload on **35730** completed a real websocket handshake; a timestamp-only save of `version-2/index.html` triggered an automatic browser reload while source content remained identical. Final log: `tmp/version-2/final-live-check.log`; screenshot: `tmp/version-2/live-desktop.png`. An earlier hidden Tailwind utility probe also confirmed compiled CSS updates without manual refresh, then was removed (`tmp/version-2/live-check.log`). Original protected project PID **77749** still owns **4000/35729** and was never signalled.

Final source review: V2 CSS is isolated, original rules/data/routes are preserved, new font licensing and artwork are source assets, and generated CSS/site output/screenshots/logs remain ignored. `git diff --check` and `git diff --cached --check` pass. See Git history for the implementation commit. Publishing gates and the screen-reader/physical-device/cross-browser limitations above still apply.

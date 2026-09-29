# Development workflow and polished-preview handoff

Verified 2026-09-29 in `/Users/dj/Sites/istocklanding`.

## Running preview

- **URL:** http://127.0.0.1:4001/
- **HTTP:** 4001; **LiveReload:** 35730, both bound to 127.0.0.1.
- **Launcher PID:** 90951; **Tailwind watcher:** 90954; **Jekyll:** 90957.
- Started detached with `nohup node scripts/dev.mjs > tmp/dev/launcher.log 2>&1 < /dev/null &` (the same launcher used by `npm run dev`).
- Combined startup/output log: `tmp/dev/launcher.log`.
- Per-process logs and runtime state: `tmp/dev/2026-09-29T15-17-07.886Z-90951/` (`css-build.log`, `css.log`, `jekyll.log`, `state.json`).
- Stop: confirm `ps -p 90951 -o pid,command`, then `kill -TERM 90951`. Wait two seconds for its owned children to exit. Restart with `npm run dev`; read the newly printed URL and ports.
- Final HTTP request returned **200**. Chromium loaded the live preview and captured fresh report/sample/menu views.
- Other project's Ruby PID **77749**, listening on **4000 / 35729**, was unchanged before/after every lifecycle test. No signal was sent to it.

PIDs and paths above describe this handoff, not permanent configuration. The live state file is removed at shutdown. Check identity before acting on a stale PID. Production build/check commands and dev share generated outputs: stop dev before rebuilding or running the full suite, then restart.

## Automated results

`SCREENSHOTS=1 npm run check` passed:

- Production Tailwind compilation and Jekyll build.
- **3 Node workflow tests:** strict port values/protected ports; automatic selection around occupied sockets; explicit conflicts fail without disturbing the owner.
- **15 Chromium browser tests:** local links/anchors/assets, destination allowlist, production exclusions, metadata, one h1, exact guarantee sentence, mobile Escape/outside-click/link-close behavior, short-screen menu scrolling, Arrow/Home/End tab behavior and roving focus, all six native FAQs using Enter/Space, nine responsive widths, reduced motion and no-JavaScript fallback.
- Layout widths: **320, 375, 390, 768, 900, 1024, 1100, 1440, 1920px**, with no document overflow and report/hero bounds checked. The menu also passed at **390 × 320px**.
- axe WCAG A/AA rules: **zero violations** on desktop/mobile across all three sample tabs and expanded FAQ/menu states. This is automated coverage, not a full accessibility certification.
- Jekyll doctor: **“Everything looks fine.”**
- `npm audit --omit=optional`: **0 vulnerabilities**.
- `git diff --check`: clean.

Full check output: ignored `tmp/final-check.log`. Default Playwright configuration uses its installed full Chromium channel; the initial headless-shell binary was absent, so the configuration explicitly selects `chromium` instead. Installation instructions and an installed-Chrome alternative are in README. No original private dashboard was accessed; external URLs were checked against supplied verified destinations, not navigated to.

## Live workflow / lifecycle verification

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

## Commit and commercial caveats

- Existing commit: **`0498046` — Build the branded Jekyll landing page**. At this worker's handoff it is the only existing commit; scaffold and page work are combined there.
- The workflow/polish changes are ready for a parent-owned tested-polish commit. Worker instructions explicitly prohibit `git commit`; no new commit ID or three-milestone history is claimed. The parent must reconcile the requested three milestones.
- Guarantee remains exactly **100% money back if customer does not use the app.** Non-use of the subscription is the sole stated condition. The owner must confirm eligibility and refund process before production; no deadlines, extra conditions or procedure were invented.
- Pricing remains unverified; `/pricing` is known to return 404. No pricing links, prices, plans, discounts or trial periods were added.

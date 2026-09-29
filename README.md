# iStockLens landing page

A responsive editorial landing page built with **Jekyll 4.4** and **locally compiled Tailwind 4**. No Tailwind CDN, external font requests, browser framework, analytics, or forms. Product and commercial claims follow the supplied public research.

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

- `index.html`: page argument, section layout and interactive sample panels.
- `_data/site.yml`: verified external destinations and canonical guarantee sentence.
- `_data/sample.yml`: explicitly illustrative Apple/AAPL sample and scores.
- `_data/faqs.yml`: FAQ copy.
- `_includes/`: navigation, footer, custom logo/icons and HTML/SVG report artwork.
- `_layouts/default.html`: page shell, metadata, canonical and local assets.
- `_styles/main.css`: Tailwind import/source scanning, design tokens, crafted components and responsive behavior.
- `assets/js/main.js`: progressive enhancement for menu and accessible tabs. Without JavaScript navigation is visible, all sample panels are readable, and native FAQs work.
- `_config.yml`: title, description, canonical host and build exclusions.
- `docs/ui-design-spec.md` and `.agents/product-marketing.md`: source-of-truth design and factual constraints.

Fonts: Manrope variable 400–800 and Instrument Serif italic, Latin WOFF2 subsets from Google Fonts, self-hosted under `assets/fonts/` with their SIL Open Font License files. System fonts provide fallbacks. Social artwork is original SVG; its PNG counterpart is used in metadata for crawler compatibility.

## Verify

```sh
npx playwright install chromium  # one-time browser installation for automated checks
npm run check                   # production build + workflow tests + browser tests + Jekyll doctor
npm run build                   # production CSS and site only
npm run test:workflow            # port validation / selection / non-destructive conflict tests
npm run test:browser             # browser regression tests against an existing production build
bundle exec jekyll doctor
SCREENSHOTS=1 npm run check      # also saves nine full-page views + three hero captures in tmp/screenshots/
```

Browser tests serve `_site/` on OS-assigned loopback ports and close their own servers afterwards. Chromium checks local assets/anchors, canonical metadata, CTA destinations, excluded artifacts, keyboard navigation/tabs/FAQs, reduced motion, no-JS fallback, responsive report bounds at 320–1920px, and axe WCAG A/AA rules across sample states and expanded controls. No test navigates to the original app; external destinations are compared against the supplied verified allowlist. Automated accessibility checks are not a full accessibility certification.

If the bundled browser cannot be installed, use an installed Chrome with `CHROME_CHANNEL=chrome npm run check`. Failures are explicit, not silently skipped; ignored `test-results/` contains screenshots and traces (`npx playwright show-trace <trace.zip>`). If no browser tooling is available, run build, workflow tests and doctor separately, then use the following manual fallback at the printed dev URL and record that limitation:


- The header menu opens on mobile, closes with Escape (returning focus) and closes after following a link.
- The hero’s “Explore a sample” scrolls to the report below the sticky header.
- Each report tab shows different content. ArrowLeft/Right wrap; Home/End select first/last. Exactly one tab is selected and in the tab order.
- Each native FAQ expands using click, Enter or Space. With JavaScript disabled, navigation and all three report panels remain available.
- Primary CTAs lead to `https://istocklens.com/download`; other external links use only the verified paths in `_data/site.yml`.
- At 320px, mobile, tablet and desktop widths there is no horizontal page overflow; sample labels remain visible. Reduced motion disables smooth scrolling and decorative transitions.

- Inspect at 320, 390, 768, 1024 and 1440px, including a short mobile viewport with the menu open. Scroll the menu to its CTA; tab through all links and observe visible focus.
- With dev running, temporarily add a Tailwind utility to `index.html`, save, and confirm both CSS and the browser update without manual refresh. Restore the edit; leave idle for several seconds and confirm `jekyll.log` does not repeatedly regenerate. Saving files under `docs/` or `tmp/` must not rebuild.
- With two harmless local listeners occupying the preferred ports, confirm dev chooses different ports. Explicit occupied overrides must fail. Stop with Ctrl+C, verify both owned children exit, then restart. Never use the protected project’s processes as test targets.

Actual verification and handoff details are recorded in `docs/development-verification.md`. Screenshots, logs and traces belong only in ignored paths.

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
- Final review — refine customer-facing guarantee wording, recheck the page in Chrome and complete documentation.

See `git log --oneline` for the full commit history and `docs/development-verification.md` for verification details.

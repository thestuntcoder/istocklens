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

Default address: **http://127.0.0.1:4001/**; LiveReload websocket: **35730**. Check availability first with `lsof -nP -iTCP:4001 -iTCP:35730 -sTCP:LISTEN`. Never stop unrelated processes. Ports 4000 and 35729 belong to another project and are intentionally not used.

`npm run dev` first builds CSS, then runs the Tailwind watcher and Jekyll LiveReload together. `npm run css:watch` and `npm run serve` can also be run in separate terminals. For different free ports, build CSS, start its watcher, then run `bundle exec jekyll serve --host 127.0.0.1 --port PORT --livereload --livereload-port LRPORT`.

Documentation, tests, npm dependencies, logs, `.pi`, temporary artifacts and style sources are excluded from Jekyll output. Tailwind watches explicit source paths only. Compiled CSS is intentionally included in Jekyll, so a CSS rebuild triggers browser reload without a build loop.

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
npm run build
bundle exec jekyll doctor
```

For manual verification, serve `_site/` locally on a free port and check:

- The header menu opens on mobile, closes with Escape (returning focus) and closes after following a link.
- The hero’s “Explore a sample” scrolls to the report below the sticky header.
- Each report tab shows different content. ArrowLeft/Right wrap; Home/End select first/last. Exactly one tab is selected and in the tab order.
- Each native FAQ expands using click, Enter or Space. With JavaScript disabled, navigation and all three report panels remain available.
- Primary CTAs lead to `https://istocklens.com/download`; other external links use only the verified paths in `_data/site.yml`.
- At 320px, mobile, tablet and desktop widths there is no horizontal page overflow; sample labels remain visible. Reduced motion disables smooth scrolling and decorative transitions.

Focused Chromium verification was run for the completed page using a temporary local server (no external app navigation). It covered the checks above, local assets, metadata, one `h1`, and all six FAQs. A reusable `npm run check`/regression suite and robust port-aware development launcher are assigned to the next workflow task; no test command is claimed here yet. Screenshots belong in ignored `tmp/` or `.pi/`, not the repository.

## Publishing requirements — owner confirmation required

- Guarantee exactly: **100% money back if customer does not use the app.** Subscription non-use is the sole stated condition. The guarantee is not investment protection, dissatisfaction coverage or a return promise.
- **Confirm eligibility and the refund process with the owner before production.** Do not invent time limits, procedures or additional restrictions; the implementation deliberately adds none.
- **Pricing is not verified.** The known `/pricing` endpoint returns 404. There are no prices, pricing links, trial lengths, discounts or invented plans here.
- Confirm legal copy, supported coverage, and download destination readiness before publishing. This page makes no specific coverage claim.
- Confirm deployment ownership and canonical URL in `_config.yml` (currently `https://istocklens.com`). Social metadata uses this host.
- The sample is not live data or investment advice. Scores and labels must remain illustrative. Hero chart is conceptual, not a price history. Quantitative ratings and automatic summaries do not replace independent verification.
- No fabricated testimonials, ratings, customer counts, avatars, endorsements or investment outcomes are included.

## Milestones / handoff

Scaffold: Gemfile/npm lockfiles, Jekyll config/layout/includes/data, local Tailwind build, factual/design documentation.
Completed page: composed landing page, assets, interactions and verification. Worker instructions prohibit direct commits; the parent Pi Long Task session owns milestone commits.

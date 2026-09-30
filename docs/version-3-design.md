# Version 3 — clarity, with conviction

## Direction
Requested midpoint between the editorial original and the bold blue second version. Preserve the exact headline **“Before you buy, know why.”** Version 1 and Version 2 remain available and unchanged in appearance.

- **Palette:** cool paper `#f4f7fc`, navy `#142b50`, royal blue `#285be2`, powder blue `#e8effc`, slate `#53647e`.
- **Type:** existing self-hosted Manrope, with 750-weight hero text and stronger section headings; retain Instrument Serif italic for “know why” and the guarantee emphasis. No condensed uppercase wall of type.
- **Composition:** airy editorial split hero, upright white research brief on a rich blue stage, restrained curves, clear data panels. Cool-blue sample section, bolder process numerals and a rectangular navy money-back seal on a blue section.
- **Content:** share the original evidence-first argument, verified data, CTAs, FAQ and owner-approved guarantee covering non-use or not finding the app useful. No investment-performance claims. Samples remain explicitly illustrative, with a conceptual chart rather than live market data.
- **Interaction:** existing accessible tabs, native FAQ and responsive menu; V3-only comparison links to all three routes. Semantic layout, skip link, reduced motion and no-JS fallback remain.

## Implementation
`/version-3/` uses `_layouts/version-3.html` and `_includes/version-3/`. `_styles/version-3.css` scopes shared-component overrides to `.version-3`, while artwork uses `v3-` names. Shared content accepts an optional hero include; no duplicated marketing copy or changes to existing design rules. Local fonts and assets only. Original root and `/version-1/` continue using the original default artwork; `/version-2/` has no template or style changes.

## Acceptance
Review desktop and phone composition; no horizontal overflow at 320–1920px; clear primary CTA; exact motto; working mobile menu, tabs, FAQs and comparison links; accessibility checks across active states; original regression suite passes. Keep HTTP 4001 / LiveReload 35730 running after verification. Existing commercial/legal publishing gates remain in README.

Guidance: UI workflow partial visual rerun, reusing the existing positioning and researched product facts; no new external skills or dependencies.

Validation (2026-09-30): production build, 3/3 workflow tests, 34/34 serial Chromium tests (including five focused V3 regressions), and Jekyll doctor passed. V3 passed bounds/overflow checks at 320, 390, 768, 1024, 1440 and 1920px, keyboard controls, no-JS fallback, and desktop/phone axe checks across every tab and expanded controls. Full-page captures at 320, 390 and 1440px were saved and visually reviewed in ignored `tmp/version-3/`; no page fixes were needed. Originals, shared copy/guarantee and `/download` CTAs remain untouched. Detached preview restored at http://127.0.0.1:4001/ (LiveReload 35730): all four routes and injected reload script returned 200; a cache-disabled browser verified fresh V3 CSS against disk and computed blue/750-weight styling.

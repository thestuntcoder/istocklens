# Mobile reading comfort — all versions

## Clarified brief

The user meant **every version and the homepage**, not only Version 4. Phone text must be comfortably readable for a 40+ reader without zooming. Retain the approved desktop presentation and each version's existing character, content and functionality.

This follow-up extends the V4 reading scale to `/`, `/version-1/`, `/version-2/` and `/version-3/`. V4's sources are unchanged.

## Implementation

- New `_styles/mobile-readability.css`, imported by `_styles/main.css`, contains only rules below **960px**. Shared original/V3 selectors exclude V2 and V4; V2 has explicit body/component scoping.
- **18px** main paragraphs, process copy and FAQ text; **16px** supporting text, disclosures and controls; visible labels at least **14px**.
- Full-width stacked phone hero actions and **44px+** tested touch targets, including research tabs, menu links, FAQ summaries and footer links.
- **22px** primary score values. Labels and values sit above their bars so long labels are not squeezed into tiny columns.
- Reflowed report artwork, larger chart labels, single-column phone verdicts in V1/V3, and stacked process/benefit cards where needed. V1's report is upright and in normal flow on mobile rather than reduced to fit a tilted postcard.
- V2's mobile valuation readout explicitly uses 72px numerals, preventing its generic paragraph rule from reducing the score to 13px.
- No content, score data, verified destinations, guarantee terms, HTML semantics, scripts, dependencies or assets changed. Keyboard controls, no-JS research panels, native FAQs and reduced motion remain available.

The UI workflow's focused refinement protocol was used with the existing design specs and user-confirmed type scale. No external skills or packages were installed.

## Verification — 2026-09-30

- Production CSS/Jekyll build: passed.
- **3 workflow + 48 Chromium browser tests = 51 passed**, serial browser worker.
- Jekyll doctor: passed.
- Six new tests cover the homepage/V1/V2/V3 mobile type, all research states, expanded FAQs/menus, control sizes, score-row geometry, no-JS content and desktop type/grid preservation. Existing 42 browser tests remain intact, including V4 and axe WCAG A/AA checks for all designs.
- New responsive coverage: **320, 375, 390, 430, 640, 767, 768, 900 and 959px**, with no horizontal page overflow or visible text below 14px. No-JS coverage additionally checks all earlier variants at 320/390/768/959px. Existing V4 mobile checks remain green.
- Desktop comparison against the previous commit's compiled CSS: all five routes at **960/1024/1440/1920px** retain identical visible-element geometry, computed type and colors. Full-page screenshots match with **zero differing pixels at Playwright's 0.1 antialiasing tolerance**. V4 at 390px also matches. Not every PNG is byte-identical because of Chromium antialiasing; no visual/layout changes were found.
- Visually inspected phone heroes, report illustrations, research panels and guarantee seals at 320/390px. V1/V3 keep their respective warm/blue identities; V2 retains the condensed navy/cobalt direction.
- Automated checks use Chromium, not Safari or a physical phone, and do not constitute a full accessibility certification.

Ignored evidence: `tmp/mobile-all/check.log`, `desktop-review.json`, before/after desktop captures and phone hero/art/sample/guarantee screenshots. Initial exploratory captures were replaced by reduced-motion captures with the pointer outside controls to avoid hover/scroll artifacts.

## Preview handoff

These are historical readability-handoff PIDs. The current signup-demo validation and restored runtime are recorded in `signup-flow.md`.

Managed preview restored after production checks:

- Homepage: http://127.0.0.1:4001/
- V1: http://127.0.0.1:4001/version-1/
- V2: http://127.0.0.1:4001/version-2/
- V3: http://127.0.0.1:4001/version-3/
- V4: http://127.0.0.1:4001/version-4/
- LiveReload: **35730**. All five routes and the LiveReload script returned HTTP 200.
- Launcher PID: **53956**; Jekyll PID: **53963**. Verify identity before stopping; these are handoff-time values.
- Logs/state: `tmp/dev/2026-09-30T10-59-37.396Z-53956/`; launcher log: `tmp/dev/launcher.log`.
- Protected project ports **4000/35729** were not stopped or changed.

Publishing gates remain unchanged: owner confirmation of refund eligibility/process and commercial/legal details is still required; no pricing or additional refund conditions have been invented.

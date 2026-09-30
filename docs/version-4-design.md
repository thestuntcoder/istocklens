# Version 4 — the independent research journal

## User direction
A completely new design for analytical people who check claims, validate important information against sources they genuinely trust, and make their own investment decisions. This is not a recolor, reskin or hybrid of Versions 1–3. Those versions remain unchanged.

## Positioning and copy
**An idea is not evidence. Put it to the test.**

Lead with the reader's standard of proof, not market urgency or someone else's certainty. Invite inspection before conversion. iStockLens organizes quantitative business-quality, valuation and context assessments; the investor still validates material claims and decides. Explicitly distinguish a model output from evidence and a company assessment from an investment decision.

Keep the original verified product facts and user-provided non-use guarantee. Do not claim automatic fact-checking, linked citations, independently verified data, provider integrations, comprehensive coverage, current quotes, prices or investment outcomes. References to filings and trusted sources describe independent work the reader should do—not a product feature we have verified.

## New visual direction
- Paper `#f6f5f0`, graphite `#242824`, copper `#9e4d2e`, pale limestone and restrained rules. No blue/green trading aesthetic, floating stock cards, tilted papers or guarantee seals.
- Self-hosted IBM Plex Sans 400–700 and Source Serif 4 400–600 (roman, with optical sizing); system monospace for research labels. SIL OFL licenses included.
- New bracket/check wordmark, centered typographic opening, full-width research notebook and data ledger. Evidence is discussed, not turned into a decorative price chart.
- A dark boundary section clearly separates the tool's help from the user's responsibility. A quiet, plain-language guarantee closes the page.

## Page structure
1. Centered audience-first headline, sample CTA and actual app link.
2. Interactive illustrative research note: question / model readout / independent cross-check. Opens on the substantive readout. Shared illustrative AAPL scores remain unchanged. Clearly not an app screenshot, current assessment or recommendation.
3. Research standards: separate business from price, look for counterarguments, record revisitable reasoning.
4. Capabilities and limitations, shown with equal prominence.
5. Personal research checklist, with optional in-page reflection and a genuine downloadable plain-text worksheet. Neither is represented as a verification service or an app capability.
6. Four bespoke FAQs about ratings, other research, currentness and advice.
7. Exact non-use promise, actual download CTA, disclosure and links to all four variants.

## Implementation and accessibility
`version-4/index.html`, `_layouts/version-4.html`, `_includes/version-4/`, `_data/version4.yml`, `_styles/version-4.css`, and `assets/js/version-4.js` are independent. Only the existing Tailwind import/source list changes; no previous variant content, styles, JS or data changes.

Semantic headings, table headers/caption, native checkboxes/FAQs, accessible named menu and tabs with Arrow/Home/End behavior, roving focus, skip link, visible focus and reduced motion. Without JS, all research panels and navigation remain available. Checklist state stays in the current page only, and progress says questions considered—not claims verified. No trackers, storage, forms or remote runtime assets.

Actual CSS remains locally compiled Tailwind, with utility-based responsive layouts and dedicated V4 components. New SVG/PNG social artwork and favicon match V4. The worksheet at `assets/resources/independent-research-checklist.txt` is a static resource, not investment advice.

## Review gates
Inspect 320/390/768/1024/1440/1920px, all research views, menu behavior, checkbox/progress state, real download contents, no-JS/reduced-motion and axe accessibility. Run existing regressions to protect previous variants. Restore the managed live-reload preview after production verification. Commercial and legal publishing gates in README remain unchanged.

Guidance used: UI workflow fresh-direction implementation; copywriting skill for audience fit, specificity and honest persuasion. No new third-party skills, frameworks or runtime dependencies.

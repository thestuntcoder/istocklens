# Version 4 — the independent research workspace

## User feedback and scope
The first V4 was a paper/graphite/copper research journal. User feedback: **“looks too editorial.”** Revise V4 in place into a modern, product-led research workspace. Preserve the analytical audience, factual boundaries, working controls and original guarantee. Homepage and Versions 1–3 remain unchanged; the first V4 is preserved in Git (`cf8ad9c`, `c8f21a7`).

This is a focused visual/layout/content refinement, not a change to the product or a request for new application capabilities. Use existing local assets and UI/copywriting guidance; no new dependencies, skill installations or market claims.

## Current direction
- **Headline:** “Research the stock. Challenge the thesis.” More direct and product-specific than the previous philosophical opening.
- **Layout:** Split desktop hero. Product-led copy and the real download CTA on the left; an interactive illustrative research interface on the right. Show scores near the top instead of after a large centered typographic introduction.
- **Typography:** IBM Plex Sans throughout, with 600-weight headings. System monospace only for numeric data. No serif headings, italics, oversized question marks or journal typography. Remove Source Serif 4's font-face and preload; the old licensed font assets remain in the repository but are no longer requested by V4.
- **Palette:** Cool gray `#f5f7fa`, white surfaces, graphite `#182a37`, functional teal `#07666c`. Mint and amber distinguish the illustrative quality and valuation assessments; not trading signals.
- **Components:** Rounded 7–12px UI panels, segmented tabs, compact metric bars, feature cards, boxed FAQ disclosures and structured checklist rows. No paper edges, stacked-sheet shadows, copper accents or chapter numbering.
- **Density:** Tighter section spacing and stronger visual hierarchy, with appropriately spaced controls. Left-aligned mobile copy; interfaces stack without horizontal overflow.
- **Brand assets:** New bar-chart icon and matching favicon/social artwork. No fake certification marks, testimonial badges, source integrations or provider logos.

## Page structure
1. Split hero with app/download and local sample destinations.
2. Integrated research interface with question / readout / cross-check tabs. Default readout shows Strong quality, Pricey valuation and the unchanged five illustrative Apple scores.
3. Three compact capability cards: business versus price, market context and revisitable reasoning.
4. Paired responsibility panels, giving the tool's help and the user's independent validation equal prominence.
5. Independent cross-check checklist and genuine plain-text download. This is a landing-page reflection tool, not a claimed app verification feature.
6. Four native FAQs with the existing accurate answers.
7. Exact non-use guarantee in a compact CTA panel, then disclosures and links to all four designs.

## Factual boundaries
Only the existing verified product capabilities are claimed: quantitative business quality/valuation, price action, analyst consensus/targets, news drivers/themes, watchlists and thesis journals. Research is not advice, brokerage, trade execution or investment protection.

Do not claim automatic fact-checking, linked citations, independently verified scores, provider integrations, coverage, current quotes, prices, trials or investment outcomes. References to sources and filings describe work the investor performs independently. The illustrative interface is expressly not an actual app screenshot, current assessment or recommendation. Its score bars visualize only the existing illustrative values: 65/90/90/49/75.

The original guarantee remains exact: **“If you don’t use the app, you get 100% of your money back.”** Non-use of the app subscription, not investment losses. The owner-confirmation publishing gates in README still apply.

## Implementation and accessibility
V4 is isolated in `version-4/index.html`, `_layouts/version-4.html`, `_includes/version-4/`, `_data/version4.yml`, `_styles/version-4.css` and `assets/js/version-4.js`. The existing `research-note.html` filename and notebook data hooks are retained internally for compatibility, not as a visual direction. Shared CSS, earlier variant sources and product data are not modified by this refinement.

Semantic headings and table headers/caption; the score tracks are decorative and hidden from assistive technology while numeric scores remain accessible. Keep keyboard Arrow/Home/End tabs, roving focus, skip link, native checkboxes and FAQs, Escape/outside-click menu closing, short-screen menu scrolling and reduced motion. No-JS exposes all research panels and navigation. Checklist counts are questions considered, not claims verified; state is not stored or transmitted.

All runtime fonts/CSS/JS are local. The worksheet remains `assets/resources/independent-research-checklist.txt`. Local SVG/PNG social artwork uses the new sans-serif workspace direction.

## Review gates
Inspect 320/390/768/1024/1440/1920px, all tabs, menu, anchors, checklist/download, no-JS and reduced motion. Test the new headline, neutral palette, sans-serif headings, primary CTA and desktop side-by-side data placement. Run all existing regressions and axe states. Restore the managed LiveReload preview after production validation; never touch another project's 4000/35729 listeners.

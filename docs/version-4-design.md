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
- **Density:** Compact desktop panels stay unchanged. On mobile, readability wins over density: 18px main copy, 16px supporting text/controls, 14px minimum labels, 22px score values and generous line spacing. Below 768px, each research dimension and score share a row with its question underneath, rather than cramming three small columns together. Compact/tablet layouts below 960px use the larger type; desktop at 960px+ retains its original sizing.
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

Semantic headings and table headers/caption; explicit table/row/header/cell roles retain the score relationships when mobile rows use CSS grid. Phone column headings remain available to assistive technology; visual score units are marked decorative to avoid duplicate announcements. The score tracks are decorative and hidden from assistive technology while numeric scores remain accessible. Keep keyboard Arrow/Home/End tabs, roving focus, skip link, native checkboxes and FAQs, Escape/outside-click menu closing, short-screen menu scrolling and reduced motion. No-JS exposes all research panels and navigation. Checklist counts are questions considered, not claims verified; state is not stored or transmitted.

All runtime fonts/CSS/JS are local. The worksheet remains `assets/resources/independent-research-checklist.txt`. Local SVG/PNG social artwork uses the new sans-serif workspace direction.

## Review gates
Inspect 320/390/768/1024/1440/1920px, all tabs, menu, anchors, checklist/download, no-JS and reduced motion. Test the new headline, neutral palette, sans-serif headings, primary CTA and desktop side-by-side data placement. Run all existing regressions and axe states. Restore the managed LiveReload preview after production validation; never touch another project's 4000/35729 listeners.

## Refinement verification — 2026-09-30
- Production build, **3 workflow tests + 40 Chromium tests**, and Jekyll doctor passed after this revision. All 34 earlier-variant browser tests remain unchanged and pass.
- Axe WCAG A/AA checks report no violations in the tested default/expanded states. All three V4 tabs fit at 320/390/768/1024/1440/1920px; desktop research panels are beside the heading and near the top of the page.
- Reviewed desktop hero/full page, phone hero and matching social artwork. Full-page desktop height is about 3,633px versus 4,495px for the former journal design. Review captures are in ignored `tmp/version-4/workspace-*.png`.
- The real worksheet download, reflected checkbox count, keyboard controls, no-JS content and reduced-motion behavior still pass. V4 loads IBM Plex Sans only; no Source Serif 4 or Instrument Serif.
- Preview restored at **http://127.0.0.1:4001/version-4/**, LiveReload **35730**. Root, all four version routes and the LiveReload script returned HTTP 200. Chrome confirmed the fresh workspace heading and interface.
- Managed launcher **16652**, Jekyll **16662** at that handoff; verify identity before stopping stale PIDs. Logs: `tmp/dev/launcher.log` and `tmp/version-4/workspace-check.log`. Other projects' listeners were not touched.

## Mobile reading-comfort revision — 2026-09-30
User reports that desktop is fine but the phone typography is difficult to read for a 40+ reader. This revision changes only compact-screen presentation, not copy, product claims, data or earlier variants.

- Main mobile copy is 18px; buttons and supporting text are 16px; visible labels have a 14px floor. Phone scores are 22px. Larger line spacing, full-width hero actions and 44px+ tested touch targets favor reading comfort over packing the page into fewer screens.
- Scores reflow below 768px into clearly separated rows: dimension and value first, then the full research question. Table semantics and column associations remain available to assistive technology. No duplicate data rendering or hidden research questions.
- Full-page desktop before/after screenshots are byte-identical at **960/1024/1440/1920px**. Mobile screenshots were reviewed at 320/390px, including the research and checklist panels.
- New regression checks cover all three tabs at **320/375/390/430/640/767/768/959px**: no undersized visible text, no horizontal overflow, large controls, score reflow/semantics, and unchanged desktop type/table behavior. Existing keyboard, no-JS, download and axe checks pass.
- Production build, **3 workflow + 42 Chromium tests (45 total)** and Jekyll doctor passed. Automated browser coverage is Chromium; a matching WebKit installation was unavailable. This is not a full accessibility certification.
- Evidence: `tmp/version-4/mobile-readable/` (screenshots, comparison results and `check.log`).
- Preview restored at **http://127.0.0.1:4001/version-4/** with LiveReload **35730**. Root/all four variants and the LiveReload script returned HTTP 200. Latest launcher **32100**, Jekyll **32107**; confirm identity before stopping. Logs remain `tmp/dev/launcher.log`.

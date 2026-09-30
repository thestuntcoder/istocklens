# iStockLens — UI design specification

## Brief and evidence
Polished responsive Jekyll landing page; locally compiled Tailwind 4, no framework runtime or hosted CSS. Primary job: help thoughtful personal investors understand how iStockLens supports their own research, then visit the verified download page. Implementation is authorized; this concise spec consolidates the supplied research rather than repeating discovery.

Source: task-supplied public-site research of istocklens.com. Confirmed: separate business quality/valuation reports; Growth, Profitability, Cash/Financial Strength, Valuation and Stability scores; price action, valuation zones, analyst consensus/targets, news price drivers, market themes, watchlists, thesis journals. Ratings are quantitative and summaries automatically generated. No financial advice, brokerage or execution. Coverage and pricing unverified.

## Design direction
An independent investor's field journal, not a trading terminal. Warm ivory #f7f8f2 / #f5f5ef, forest #203c2d, lime #d9ef8c, ink #1b271f. Hairline rules, generous whitespace, editorial numbering and simple quartered-lens mark. Approximately 1240px maximum container; asymmetric split hero and staggered report artwork. Manrope variable sans + Instrument Serif italic, self-hosted Latin WOFF2 with system fallbacks. No stock photography, avatars, badges of invented authority, gradients, or decorative animation loops.

Desktop hero headline ~88px; responsive clamp to ~56px on small phones. Large forest serif emphasis, compact uppercase labels, body ~16–18px. Light report panels provide contrast against a forest/pale-green illustration stage. SVG illustration graphics are conceptual, not time-series market data.

## Mobile readability — applies to all variants
Following the user's clarification, the reading-comfort requirement covers `/`, `/version-1/`, `/version-2/`, `/version-3/` and `/version-4/`, not just V4. Below 960px use 18px main copy, 16px supporting text and controls, and visible labels no smaller than 14px. Primary score values are 22px, with labels/values above their bars rather than squeezed into narrow three-column rows. Core controls have 44px+ touch targets. Phone hero actions stack; dense report artwork and step cards reflow. Preserve each variant's palette, fonts, content, scores, guarantee and keyboard/no-JS behavior. Desktop at 960px+ remains unchanged.

Original/V1–V3 overrides live in `_styles/mobile-readability.css`; V4 retains its own previously implemented responsive rules. See `mobile-readability.md` for tested widths, screenshot comparisons and limitations. This supersedes earlier mobile compact-type sizing, not the approved visual directions.

## Structure and argument
1. Sticky nav and hero: Before you buy, know why. Understand business, price and risks.
2. Thin mechanism strip; problem/contrast: another stock tip is not a reason to believe.
3. Interactive AAPL sample: quality vs valuation vs context, with transparent static illustrative labels.
4. Three steps: pick a company, pressure-test the story, make your own call; fit for serious personal investors, not tips/auto-trading.
5. Forest guarantee and final CTA.
6. Six native FAQs and meaningful legal/product footer.

## Interactions and accessibility
One h1, semantic landmarks, skip link, prominent focus rings, contrast-conscious text. Header condenses at tablet width. Mobile menu has a real button, accurate expanded state, Escape dismissal and link closure. Tabs progressively enhance visible sections into a roving-tabindex tablist; ArrowLeft/Right and Home/End operate focus/selection. Native details remain keyboard accessible. No JavaScript dependency for core copy/CTAs. Anchors have sticky-header offsets. All motion nonessential and respects reduced motion. No forms or loading/error states needed for this static page.

## Content and conversion
Primary CTAs: Get iStockLens / Start your research → https://istocklens.com/download. Header specifically says Start researching. Open app → https://istocklens.com/stocks. Hero secondary scrolls to #sample. Supplied AAPL values: business quality Strong, valuation Pricey; Growth 65, Profitability 90, Cash 90, Valuation 49, Stability 75. Do not extrapolate prices, returns, analyst targets or actual news.

Guarantee exactly: **100% money back if customer does not use the app.** Non-use of subscription is the sole stated condition. No refund period, procedure, added eligibility rules or investment protection.

## Assumptions and production gates
Fresh identity is a design proposal, not a claim of historical branding. Audience concerns are positioning hypotheses, not interview quotes. Owner must confirm guarantee eligibility and refund process before production, with non-use remaining the sole stated condition; confirm commercial terms, destination readiness, deployment URL/canonical, legal copy and product coverage. No pricing page/link, plan, discount or trial period is invented. Use a local PNG social preview derived from custom SVG for crawler compatibility.

## Guidance used
ui-workflow manual protocol (condensed implementation-ready spec); product-marketing and copywriting skills for factual context and clear benefit-led argument. No new external skills installed. Direct response uses clear reasons and accurately bounded risk reversal, not imitation, hype, fabricated proof or investment promises.

## Version 2 — blue research brief (additive alternative)

The original field-journal direction above remains authoritative for `/` and `/version-1/`. Their shared content and artwork are preserved; the mobile reading-comfort refinement above now supplies larger type and reflowed phone layouts. `/version-2/` deliberately changes the visual argument, not the product facts.

- **Tone:** premium, assertive, athletic/technical and independent; strength without gender restrictions, trading hype or promises of returns.
- **Tokens:** midnight navy `#08162d`, dark blue `#112847`, electric cobalt `#285cff`, ice-blue `#86b6ff`, cool white `#f2f5fa`; steel supporting surfaces and ruled grids. Corners 0–2px, no glows, serif, green or animation loops.
- **Type:** self-hosted SIL-OFL Barlow Condensed 800 for muscular headings/counters; Manrope for reading; system monospace for small technical labels. Desktop hero reaches 116px, top-aligned to keep the CTA and guarantee above the fold, explicitly composed as “YOUR MONEY. / YOUR CALL. / KNOW WHY.” with the third line ice-blue. Narrow screens retain three unclipped lines.
- **Composition:** fullbleed navy hero, right-only technical grid, aligned AAPL research brief with dark/light panes, static 90-vs-49 score comparison and blue insight footer. A full-width mechanism rail leads into cool-white benefits, a dark research workbench, steel three-step process, cobalt/navy rectangular 100% stamp, native FAQs and dark legal footer. No reused tilted-paper artwork or arched seal.
- **Content:** shared `_data` supplies company identity, quality/valuation labels, all five scores, FAQs, verified external links and the exact guarantee: “If you don’t use the app, you get 100% of your money back.” The scope remains app subscription non-use only. Both samples visibly say “Illustrative sample · not live data”; no prices, targets, news or testimonials are invented.
- **Interaction:** V2-only comparison links mark Version 2 current. Desktop sample tabs form a vertical rail (Up/Down as well as Left/Right); phones use a horizontal row. Home/End, roving focus, visible focus and content-changing panels work in both layouts. No JS leaves all three panels and navigation available. Sticky anchors, scrollable mobile menu, skip link, six native FAQs and reduced-motion support are retained.
- **Isolation:** `_layouts/version-2.html`, `_includes/version-2/` and `_styles/version-2.css`; CSS is body-scoped or fully `v2-` prefixed, with only additive Tailwind source/import declarations in the original stylesheet. V2 has its own canonical, navy theme color, favicon and local SVG/PNG social artwork. Original routes receive no switcher or metadata redesign.

Validation includes screenshots at 320/390/768/1024/1440/1920px, root/V1 preservation checks against commit `1ddc598`, keyboard/no-JS/reduced-motion checks and axe WCAG A/AA. See `development-verification.md` for actual results and limitations. No new dependencies or external skills were installed for this variant.

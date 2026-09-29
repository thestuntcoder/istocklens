# iStockLens — UI design specification

## Brief and evidence
Polished responsive Jekyll landing page; locally compiled Tailwind 4, no framework runtime or hosted CSS. Primary job: help thoughtful personal investors understand how iStockLens supports their own research, then visit the verified download page. Implementation is authorized; this concise spec consolidates the supplied research rather than repeating discovery.

Source: task-supplied public-site research of istocklens.com. Confirmed: separate business quality/valuation reports; Growth, Profitability, Cash/Financial Strength, Valuation and Stability scores; price action, valuation zones, analyst consensus/targets, news price drivers, market themes, watchlists, thesis journals. Ratings are quantitative and summaries automatically generated. No financial advice, brokerage or execution. Coverage and pricing unverified.

## Design direction
An independent investor's field journal, not a trading terminal. Warm ivory #f7f8f2 / #f5f5ef, forest #203c2d, lime #d9ef8c, ink #1b271f. Hairline rules, generous whitespace, editorial numbering and simple quartered-lens mark. Approximately 1240px maximum container; asymmetric split hero and staggered report artwork. Manrope variable sans + Instrument Serif italic, self-hosted Latin WOFF2 with system fallbacks. No stock photography, avatars, badges of invented authority, gradients, or decorative animation loops.

Desktop hero headline ~88px; responsive clamp to ~56px on small phones. Large forest serif emphasis, compact uppercase labels, body ~16–18px. Light report panels provide contrast against a forest/pale-green illustration stage. SVG illustration graphics are conceptual, not time-series market data.

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

# Product Marketing Context

**Document version:** v1.4
**Last updated:** 2026-09-30

## Product overview — verified
Investor research application. Reports separate business quality from valuation, using quantitative ratings and automatically generated summaries. Tools include Growth, Profitability, Cash/Financial Strength, Valuation and Stability scores, price action, valuation zones, analyst consensus/targets, news price drivers, market themes, watchlists and bullish/neutral/bearish thesis journals. Research only: not advice, brokerage or trade execution.

Subscription is referenced in the supplied guarantee. Pricing, plan limits, trial periods and discounts are unverified and must not be invented. No coverage claims.

## Audience and jobs
Thoughtful, thorough personal investors who validate before investing. Understand a business, distinguish quality from price, examine risks/context and record a personal thesis. This is a consumer product; B2B personas do not apply. Not for hot tips, auto-trading or promised returns.

## Positioning hypotheses, not customer evidence
Scattered opinions can make conviction harder to justify. A structured report can help organize research, but the investor still owns the judgment. Alternative workflows include separate news, reports and notes; no competitor superiority claim or time-saving metric is verified. Switching concerns may include trust in automated ratings and retaining independent judgment. Address these through transparent methodology language and an illustrative sample, not performance claims.

## Message and voice
Before you buy, know why. Business quality is not the same as good value. Calm, precise and independent. Visual direction varies by version: V4 is explicitly product-led, technical and sans-serif—not editorial—following user feedback. Plain-language benefits and concrete capabilities. Kennedy-inspired clarity of argument and Hormozi-inspired bounded risk reversal, without imitating either author. Avoid hype, stock picks, guaranteed outcomes, urgency, fabricated customer quotes/avatars/ratings/logos and unsupported financial claims.

Mobile presentation requirement applies to **all four versions and the homepage**, not just V4: the user reports difficulty reading the smaller type on a phone as a 40+ reader. Prioritize comfortable 18px main copy, 16px controls/supporting text, and labels no smaller than 14px. Reflow dense content instead of shrinking it. Keep the approved desktop presentation unchanged.

## Proof and commercial constraints
Only supplied product facts are proof. No testimonials, user counts, rankings or outcomes supplied. AAPL sample is illustrative, not live data or a recommendation: Strong quality, Pricey valuation; Growth 65, Profitability 90, Cash 90, Valuation 49, Stability 75.

Guarantee exactly: **If you don’t use the app, you get 100% of your money back.** Subscription non-use is the sole stated condition. Do not invent periods, procedures, extra eligibility requirements, dissatisfaction coverage or investment protection. Eligibility and refund process require owner confirmation before production.

## Goal and destinations
Primary acquisition CTAs now enhance into a five-step themed demo: email → Professional / Intermediate / Beginner → US / EU / China / All stocks → guarantee/payment demo → congratulations/account-ready preview. Desktop ≥768px uses a native dialog; phones ≤767px use real `/version-{1,2,3,4}/start/` pages. Homepage uses V1. Verified fallback and real-download exit: https://istocklens.com/download. Allowed labels Get iStockLens / Start your research, with requested header Start researching (V4: Get iStockLens). Open app and stock research: /stocks. Public sample: /stocks/aapl. Market overview: /today. Legal: /privacy and /terms. All external destinations on https://istocklens.com. Hero sample CTA is local #sample. No pricing link: /pricing returns 404. Metrics not supplied.

## Demo boundaries
No signup backend, account, email, token or payment is created. Success qualifies “Your account is getting ready” as preview only. Email and preferences remain memory-only, are rendered with textContent and are not sent, logged, stored or placed in URLs. Refresh may restart the demo. Region selections are interests, not coverage promises. Stripe.js loads only at payment and may emit external telemetry; only test details or an explicitly selected fixed fictitious preset are appropriate. The public test key comes from Stripe’s official MIT Elements examples, not a secret or our own payment account. Real Stripe iframe entry/font/keyboard smoke and deterministic stubs are documented separately in `docs/signup-flow.md`. No production checkout claim is justified.

## Open publishing requirements
Owner confirmation of guarantee process/eligibility, commercial terms, legal copy, deployment canonical and supported coverage. No new commercial promises until verified.

## Changelog
- v1.4 (2026-09-30) — Add the explicitly non-transactional themed signup demo, memory-only privacy boundaries, regional-interest qualification and official Stripe test-key attribution; preserve all commercial constraints.
- v1.3 (2026-09-30) — Clarify that mobile reading comfort applies to every variant and the homepage, not only V4.
- v1.2 (2026-09-30) — Record mobile reading-comfort requirements; desktop and product/commercial facts are unchanged.
- v1.1 (2026-09-30) — Record the user's non-editorial V4 direction. Verified product facts and commercial constraints are unchanged.
- v1 (2026-09-29) — Initial context from task-supplied verified public research and explicit messaging constraints.

# Themed signup flow

## Behavior and boundaries

All acquisition CTAs on `/` and Versions 1–4 are enhanced on ordinary unmodified left clicks. At **≤767px** they navigate to `/version-{1,2,3,4}/start/` (homepage uses V1). At **≥768px** they open a native dialog, never automatically. Direct start routes work at every width. Resizing keeps the mounted flow and answers rather than navigating away.

Five explicit steps: email → Professional / Intermediate / Beginner → US / EU / China / All stocks → guarantee/payment demo → congratulations. Choices start unselected. Email uses native email validity, inline errors, `aria-invalid` and error focus. Titles receive focus and progress announces the current step of five. Back preserves email and preferences; card Elements are destroyed when leaving payment and must be re-entered. Reset clears the answers and summary.

**This is not signup or checkout.** No backend, email sending, account creation, token, PaymentIntent or payment API exists. There are no prices, plans, trials, coverage promises or invented refund windows. The exact `_data/site.yml` guarantee is:

> If you don’t use the app, you get 100% of your money back.

The accompanying scope is subscription non-use, **not investment performance or losses**. Regions describe research interests only. Confirmation uses the intended customer-facing line **“Your account is getting ready.”** A compact adjacent notice states **“Test mode · Account activation isn’t connected yet.”** This is not a verified account-creation result.

## Implementation

- `_includes/signup-flow.html`: one shared form, reusing each landing’s actual logo/wordmark; `_includes/signup-dialog.html`: desktop shell with a persistent close toolbar.
- `_layouts/signup.html` and four `version-*/start/index.html` routes: real standalone pages, one visible step at a time.
- `_styles/signup-flow.css`: isolated tokens, 18px reading copy / 16px controls and support / 14px minimum labels / 44px+ targets. V1 ivory/forest/lime with Manrope/serif; V2 navy/cobalt, Barlow Condensed 800, square technical panels; V3 heavier blue Manrope/serif; V4 graphite/teal IBM Plex Sans, no editorial serif.
- `assets/js/signup-flow.js`: memory-only state, guarded history, cancellable lazy loading, native dialog lifecycle and original demo-only Stripe integration. No dependencies were added to npm.

Native `showModal()` supplies top-layer focus isolation including iframe navigation. Background siblings are additionally inert, body scroll is locked/restored, and short dialogs scroll internally. A sticky close toolbar remains visible when long steps scroll; Close, Escape and backdrop dismiss; focus returns to the launcher or the Menu button if the launch CTA is now hidden. Normal actual-app, sample, worksheet, stock and legal links remain untouched. V4’s header acquisition action is now “Get iStockLens”; actual-app footer links remain real links.

## Privacy and failure safety

Email/preferences are never placed in URLs, storage, logs or requests; summary values use `textContent`. Standalone history stores only a step number and `?step=1` through `?step=5`. Browser Back/Forward preserves mounted answers, but direct links and refresh start at email without in-memory prerequisites. **Refreshing may restart the demo.** Closing a dialog keeps its answers only in the mounted document. Reset clears the answers and a fresh page load initializes the demo again; normal browser history may restore an in-memory cached page.

The flow stays hidden until event handlers are installed. Without JS, acquisition hrefs retain the verified `https://istocklens.com/download` destination; start pages show an explicit fallback. Email has no form `name`, controls are non-submit buttons, and enhanced submission is prevented. The form uses `method="dialog"` with no network action: native submission only closes an ancestor dialog (or is aborted on a standalone page). Even an enhancement failure cannot GET- or POST-submit these answers.

Stripe.js loads only on entry to payment, not on landings or steps 1–3. Leaving/closing invalidates callbacks and destroys Elements; script loading and mounting each have a 12-second timeout, and font loading has a 4-second timeout. Retry is explicit. Errors never imply payment or auto-select a card. The **Use a test card** button explicitly selects fixed fictitious details (`4242 4242 4242 4242`, `12/39`, `123`), not locally collected arbitrary card inputs. Double completion is guarded; closing during pending simulated completion cancels it.

## Stripe attribution and real behavior

Official SDK: `https://js.stripe.com/v3/`. The public test key `pk_test_6pRNASCoBOKtIshFeQd4XMUh` comes from [Stripe’s official MIT-licensed Elements examples](https://github.com/stripe/elements-examples/blob/master/js/index.js), also [demonstrated here](https://stripe.github.io/elements-examples/). It is public, not a secret or this project’s payment account. Available reference copies are `tmp/stripe-elements-{example.js,README.md,LICENSE}`. The example’s tokenization code was **not** copied; our integration only creates/mounts split `cardNumber`, `cardExpiry`, `cardCvc` Elements and reads readiness/completeness/errors.

Use only `4242 4242 4242 4242`, future expiry and test CVC. The site neither reads nor stores card numbers and cannot verify that a particular number was entered; simulation requires all three Elements complete with no reported errors, not payment authorization. Never enter a real card. Stripe may emit external telemetry after payment is entered, including after Elements are destroyed. The UI identifies Stripe as the card-field provider; privacy/consent disclosures must be reviewed before launch. Email/preferences are not passed to Stripe. The explicit preset works when Stripe is blocked/offline.

Iframe input text is 16px. Locally licensed Manrope / IBM Plex Sans WOFF2 files are converted to data URLs for Elements (parent font-face rules do not cross iframe boundaries), with Arial fallback if unavailable. Actual font loading was verified, not inferred from parent CSS.

## Customer-facing copy refinement

The user plans to launch this flow and requested removal of demo-heavy wording. Steps 1–3 now use normal account-setup copy, with no preview, memory/storage or sample-email explanations. The frame says “Account setup”; the page title is “Create your account · iStockLens”; actions use “Continue”, “Complete setup”, “Back to iStockLens” and “Get iStockLens”. Investment-level and market-interest questions are direct and do not promise unverified capabilities or coverage.

The payment screen retains only a short test-card/no-charge notice; confirmation retains a short activation-not-connected notice. Technical implementation details remain in documentation rather than interrupting every step. The guarantee and its scope are unchanged. Skills consulted: copywriting and signup.

**Credentials alone will not make this live.** Before removing those notices, implement secure server-side payment/subscription creation, verified pricing, confirmed payment state/webhook handling and actual account provisioning. Secret keys must stay server-side. The current local completion timer is not payment confirmation or account activation.

## Verification — 2026-09-30

With the verified project preview stopped:

- `npm run build && npm run test:workflow && npm run test:browser -- --workers=1 && bundle exec jekyll doctor`: **passed; 3 workflow + 73 Chromium browser tests = 76 tests**. All previous 48 browser tests retained; 25 signup tests. Latest copy-refinement log: `tmp/signup-copy/check.log`; the earlier integration/real Stripe check is in `tmp/signup-flow/parent-check.log`.
- Deterministic network-independent Stripe stubs/aborts cover all acquisition launchers and every theme in dialog/page modes, validation, restoration/reset, privacy/history/refresh, no-JS fallback, modifiers/exclusions, keyboard/focus/scroll/inertness, lazy loading, blocked SDK, retry, SDK/mount timeout, stale callbacks, pending close, double completion, partial Elements and failed fonts. Additional parent-review regressions verify the Close button stays clickable after scrolling payment and that bypassing JS submit handlers still cannot send form answers. A copy regression traverses all five stages in all four themes, rejects demo/preview jargon in visible UI, and requires the compact test notices and exact guarantee. No backend submissions occur in stubbed traversals.
- All five steps checked at **320/375/390/430/767/768/959/1440px**, with a 320px-high desktop, resizing and reduced motion: no horizontal overflow, minimum type/control dimensions upheld. Existing root/V1 rendered body, computed-style and screenshot identity checks pass.
- Axe WCAG A/AA: zero violations in all five steps × four themes × dialog/standalone modes with stubbed iframes. Cross-origin real Stripe internals are outside that deterministic audit; this is not full accessibility certification or a physical-device/screen-reader audit.
- **Separate real Stripe smoke passed for all four desktop themes**, using interactive 4242/future-expiry/CVC entry, iframe keyboard navigation and local simulated success. Actual iframe fonts loaded (Manrope V1–V3, IBM Plex Sans V4), all input sizes 16px, zero page errors, forbidden payment calls or payment endpoint requests. Run `node tests/stripe-real-smoke.mjs` against a production build; evidence: `tmp/signup-flow/real-stripe.json`, `real-smoke.log`, `real-v*-payment.png`. This is networked evidence, distinct from the stubs; it does not test a charge.
- Desktop/mobile payment and success captures for every theme: `tmp/signup-flow/v{1,2,3,4}-{dialog,page}-{payment,success}.png`, visually reviewed. Landing comparisons against a separately built `6756e42` baseline at 390/1440px: **zero differing pixels at 0.1 antialiasing threshold** for all five routes, with V4’s desktop header excluded because its acquisition label intentionally changed. Evidence: `tmp/signup-flow/landing-comparisons.json`, `baseline-*.png`, `current-*.png`.

No Safari/physical-device validation was performed. Future live signup/payments require a separately authorized backend, production Stripe configuration, commercial/legal confirmation and security review; this demo must not be represented as production checkout.

## Managed preview handoff

Restored with `nohup node scripts/dev.mjs >tmp/dev/launcher.log 2>&1 </dev/null &` after production checks:

- Preview: **http://127.0.0.1:4001/**; LiveReload **35730**.
- Detached launcher PID **1184** (parent 1); Jekyll PID **1190**; CSS watcher PID **1187**. Both launcher/Jekyll working directories verified as `/Users/dj/Sites/istocklanding`. These are handoff-time values; inspect identity before stopping.
- Runtime directory: `tmp/dev/2026-09-30T13-58-10.045Z-1184/`, including `state.json`; launcher log: `tmp/dev/launcher.log`.
- Homepage, all four landings, all four start routes and LiveReload script: **HTTP 200**. LiveReload WebSocket protocol-7 hello handshake passed. Live mobile V4 CTA navigated to its standalone email step without a Stripe request. Latest evidence: `tmp/signup-copy/preview-verification.json`. Earlier integration handoff evidence remains under `tmp/signup-flow/`.
- Previous project-owned launcher **86663** / Jekyll **86672** were verified and cleanly stopped before the copy-refinement checks. The other project’s PID **77749** on protected ports **4000/35729** was never stopped or changed.

Generated `_site/` and `assets/css/main.css`, logs and screenshots remain ignored. The feature is based on `6756e42`; see Git history for the implementation commit.

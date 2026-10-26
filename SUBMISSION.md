# Bounty submission notes

## Whop features implemented (paste as your one paragraph)

Built and deployed on Whop Websites with the Whop CLI (`whop apps init` / `whop apps deploy`, TanStack Start with the `@whop/cli/vite` plugin, server routes using Whop hosting's injected API key), live at https://ridgeline-roofing-mk26.whop.site. Three real one-time plans were created with the CLI: a $149 roof inspection fee, a $500 project deposit and a $349 flat-rate gutter clean & roof tune-up. Checkout uses Whop Payment Elements only — ExpressCheckoutElement for Apple Pay / Google Pay plus PaymentElement with the required BrandingElement, confirmed server-side through the Payments API with `handleNextAction` for 3D Secure; no Stripe, PayPal or custom card fields. The "Request an Estimate" form verifies the homeowner's email with Sign in with Whop (OAuth 2.1 + PKCE in a pop-up, one-time code) and creates a lead for that Whop user through the Leads API, with the job details in metadata. The deposit checkout mounts the payment elements in setup mode, saves the card on file with a setup intent, then charges the deposit plan to that saved card. A PIN-protected contractor console shows a live jobs pipeline (lead → inspection paid → deposit + card on file → final invoice → paid) joined from the Leads, Payments, Setup Intents and Invoices APIs, and bills the final balance with the Invoices API, either auto-charging the stored payment method (`charge_automatically`) or emailing a pay-online invoice (`send_invoice`) with the deposit credited as a line item. A signed webhook endpoint (Standard Webhooks HMAC verification) handles payment, setup-intent and invoice events. The Whop pixel tracks page views and checkouts automatically, and the site fires custom `whop.track` events `estimate_requested`, `service_viewed`, `deposit_started`, `quote_calculated` and `project_viewed` with `event_id` de-duplication. Every company detail, service, price, plan ID, calculator rate, project, FAQ and brand color lives in one config file, so re-branding needs no structural changes. (Whop Websites now serve at *.whop.site — see docs.whop.com/developer/websites/overview.)

## Screen recording plan (3–5 minutes)

Open `https://ridgeline-roofing-mk26.whop.site/?debug=pixel` so pixel events show on screen. Have the Whop dashboard open in a second tab.

1. **Live site (45 s).** Show the URL. Scroll the hero (storm, lightning), services (`service_viewed` appears), cost calculator (move the slider, change pitch and material), how payment works, prices, financing, before/after slider, service area (check a ZIP), reviews, FAQ. Switch to phone size once to show it's responsive.
2. **Estimate → lead (45 s).** In the calculator press "Get my exact quote" (`quote_calculated` fires, form pre-fills). Fill name/email/ZIP, press "Verify email and send request", enter the Whop code in the pop-up. Show the success message and `estimate_requested` in the pixel panel. Open `/contractor` (PIN) — the lead is in the pipeline.
3. **Test checkout (50 s).** "Book an inspection": point out Express Checkout (Apple Pay / Google Pay), the PaymentElement and the Whop BrandingElement. Pay → "You're booked". Show the payment in the Whop dashboard.
4. **Deposit + card on file (45 s).** `/deposit` → fill in, tick the authorization, "Save card and pay deposit" (`deposit_started` fires) → confirmation. In `/contractor` the customer moves to "Deposit + card on file".
5. **Final invoice (35 s).** "Bill the final balance": job total 12,400, deposit 500 → balance 11,900. Use "Email an invoice" (or "Charge the card on file"). The invoice appears under "Final invoices" and in the Whop dashboard.
6. **Pixel + webhooks (20 s).** Show the pixel panel list and the events in the Whop dashboard; optionally run `whop apps logs app_u3dvlcIoblu4vC` to show webhook lines.
7. **Template (20 s).** Change `company.name` and `theme.accent` in `src/config/site.ts`, run `whop apps dev`, show the re-branded site.

Refund the test payments afterwards in the Whop dashboard.

## What to submit

- Live URL: https://ridgeline-roofing-mk26.whop.site
- Source code: https://github.com/mdahadkhan8886-create/ridgeline-roofing
- Screen recording (3–5 minutes)
- The paragraph above

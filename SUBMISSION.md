# Bounty submission notes

## Whop features implemented (paste as your one paragraph)

Built and deployed on Whop Websites with the Whop CLI (`whop apps init` / `whop apps deploy`, TanStack Start with the `@whop/cli/vite` plugin, server routes using Whop hosting's injected API key). Three real one-time plans were created with the CLI: a $149 roof inspection fee, a $500 project deposit and a $349 flat-rate gutter clean & roof tune-up. Checkout uses Whop Payment Elements only: ExpressCheckoutElement for Apple Pay / Google Pay, plus PaymentElement with the required BrandingElement, confirmed server-side through the Payments API with `handleNextAction` for 3D Secure. No Stripe, PayPal or custom card fields. The "Request an Estimate" form creates a lead through the Whop Leads API. The deposit checkout mounts the payment elements in setup mode, saves the homeowner's card on file with a setup intent, then charges the deposit plan to that saved card. A PIN-protected contractor console lists leads and cards on file and bills the final balance with the Whop Invoices API, either auto-charging the stored payment method (`charge_automatically`) or emailing a pay-online invoice (`send_invoice`), with the deposit credited as a line item. The Whop pixel tracks page views and checkouts automatically, and the site fires the custom `whop.track` events `estimate_requested`, `service_viewed` and `deposit_started` (with `event_id` de-duplication). All company details, services, prices, plan IDs, service area and colors live in a single config file, so re-branding needs no structural changes.

## Screen recording plan (about 4 minutes)

Open the site with `?debug=pixel` so pixel events show on screen.

1. **Live site (40 s).** Show the whop.site URL in the address bar. Scroll through hero, services, how a new roof gets paid for, prices, financing, service area (check a ZIP), reviews, contact. Point out `service_viewed` appearing as the service columns scroll into view. Shrink the window or use phone view to show it's responsive.
2. **Estimate form → lead (40 s).** Fill in and submit "Get a free estimate". Show `estimate_requested` in the pixel panel. Open `/contractor`, enter the PIN, and show the new lead in "Estimate requests". Optionally show it in the Whop dashboard too.
3. **Test checkout with Payment Elements (60 s).** Click "Book an inspection". Point out the Express Checkout area (Apple Pay / Google Pay), the PaymentElement and the Whop BrandingElement under it. Pay, land on the "You're booked" page, show the payment in the Whop dashboard.
4. **Deposit + card on file (50 s).** Open `/deposit`, fill details, tick the authorization, "Save card and pay deposit". Show `deposit_started` fire, the confirmation page, then `/contractor` → "Cards on file" with the setup intent.
5. **Final invoice (40 s).** In "Bill the final balance", pick that customer, job total $12,400, deposit $500 → balance $11,900. Create it once with "Charge the card on file" and/or "Email an invoice", and show the invoice in the Whop dashboard (Invoices).
6. **Pixel events (20 s).** Show the pixel panel list, and the events in the Whop dashboard's pixel/Websites view.

## What to submit

- Live URL: your `https://…whop.site` address (also check the Whop dashboard for a whop.app address)
- Source code: GitHub repo link (or a zip of this folder without `node_modules`)
- Screen recording: 3–5 minutes, following the plan above
- The paragraph above

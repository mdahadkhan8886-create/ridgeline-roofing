# Ridgeline Roofing — Whop Websites template

A production-ready website template for a US roofing company, built on **Whop Websites** (TanStack Start + Tailwind, deployed with the Whop CLI). It runs the whole high-ticket roofing flow on Whop:

**estimate request → inspection or deposit → job → final invoice**

| Requirement | Where it lives |
| --- | --- |
| Live site on Whop hosting | `whop apps deploy` (Vite plugin `@whop/cli/vite`) |
| Services (repair, replacement, inspection), service area, financing, reviews/trust, contact | `src/components/sections/*` |
| Real plans: $149 inspection, $500 deposit, $349 flat-rate service | `src/config/site.ts` → `plans`, created by `scripts/setup-whop.mjs` |
| Payment Elements checkout: ExpressCheckoutElement + PaymentElement + BrandingElement | `src/components/checkout/PlanCheckout.tsx`, `useWhopPayments.ts` |
| "Request an estimate" → Whop Leads API | `src/components/sections/Estimate.tsx` → Sign in with Whop (email code) → `src/routes/estimate/verified.tsx` → `POST /api/lead` → `POST /leads` |
| Card on file via a setup intent at deposit checkout | `src/components/checkout/DepositCheckout.tsx` → `POST /api/deposit` → `POST /setup_intents`, then `POST /payments` |
| Final balance with the Invoices API (auto-charge or send) | `/contractor` → `POST /api/admin/invoice` → `POST /invoices` |
| Custom pixel events `estimate_requested`, `service_viewed`, `deposit_started` | `src/lib/track.ts` (`whop.track`) |
| No Stripe, PayPal or custom card forms | Card data is only ever entered inside Whop's elements |

## Re-brand it

Everything a roofer would change is in **`src/config/site.ts`**: company name, phones, hours, services, prices, plan IDs, service-area towns and ZIPs, reviews, trust points, financing copy and brand colors. No component or route needs editing.

## Set up and deploy

You need Node 22+ and the Whop CLI signed in to your business (`whop quickstart`).

```sh
npm install

# 1. Create the product and the three plans in Whop, save their IDs to the config,
#    and turn on "Sign in with Whop" (used to verify estimate requests)
node scripts/setup-whop.mjs

# 2. Choose a PIN for the contractor console (/contractor)
whop apps secrets set --secret ADMIN_PIN=pick-a-pin

# 3. Ship it
whop apps deploy
```

Local preview with real Whop data: `whop apps dev` (opens on port 3000).

### Apple Pay and Google Pay

Wallet buttons only render on a domain registered for Apple Pay. The verification file is already served at `/.well-known/apple-developer-merchantid-domain-association`. After the first deploy, open **Dashboard → Websites → your domain → Fix Apple Pay → Check now**. Until then the card form works on its own.

## How each flow works

**Estimate request.** Whop's Leads API records every lead against a Whop user, so the homeowner confirms their email first: "Verify email and send request" saves the form and opens Sign in with Whop (OAuth 2.1 + PKCE; Whop emails a one-time code, no password). On return, `/estimate/verified` posts the answers and the one-time code to `/api/lead`, which exchanges the code, reads the verified user from `/oauth/userinfo`, and creates the lead (`POST /api/v1/leads` with `user_id`) with the property, service, roof type, timeline and message in `metadata`. The page then fires `estimate_requested` (and the standard `lead` event) with the lead ID as `event_id`. Spam bots can't create leads, and every lead has a verified email.

**Inspection / flat-rate booking (`/book/inspection`, `/book/flatRate`).** `ExpressCheckoutElement` shows Apple Pay / Google Pay for the plan. Below it, `PaymentElement` + `BrandingElement` collect the card; the browser creates a confirmation token and `/api/pay` charges the plan with `POST /payments`. Any 3D Secure or bank step is finished with `handleNextAction`, and `/checkout/return` reads the outcome. Opening a booking page fires `service_viewed`.

**Deposit (`/deposit`).** `PaymentElement` + `BrandingElement` mount in **setup mode**. When the homeowner confirms, the browser fires `deposit_started`, then `/api/deposit`:

1. creates a **setup intent** with the confirmation token, which saves the card on file;
2. charges the **$500 deposit plan** to that saved card (`POST /payments` with `member_id` + `payment_method_id`, idempotent per setup intent).

If saving the card needs 3D Secure, the browser finishes it and `/api/deposit-charge` charges the deposit afterwards.

**Final invoice (`/contractor`, PIN-protected).** Lists recent leads and every customer with a card on file. "Bill the final balance" creates an invoice with `POST /invoices`: job total minus the deposit as line items, and either
- `collection_method: charge_automatically` with the saved `payment_method_id` (bills the card on file), or
- `collection_method: send_invoice` (Whop emails a pay-online link; financing can surface there for approved merchants).

**Pixel.** On whop.site the Whop pixel is injected automatically (page views and checkout events are tracked for you). `src/lib/track.ts` adds the custom events. Add `?debug=pixel` to any URL to see each event on screen as it fires.

## Security notes

- The Whop API key never reaches this code: on Whop hosting, server-side requests to `WHOP_API_ORIGIN` are signed by the platform. Locally, `whop apps dev` provides a short-lived key.
- Card data is entered only inside Whop's PCI-isolated frames; the site handles single-use confirmation tokens.
- The contractor console and its API routes require the `ADMIN_PIN` app secret and are turned off without it.
- Reviews in the config are marked as samples (`reviews.areSamples`) until replaced with real ones.

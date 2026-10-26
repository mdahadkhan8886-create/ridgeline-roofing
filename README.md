# Ridgeline Roofing — Whop Websites template

A production-ready website template for a US roofing company, built on **Whop Websites** (TanStack Start + Tailwind, deployed with the Whop CLI). It runs the whole high-ticket roofing flow on Whop:

**estimate request → inspection or deposit (card on file) → job → final invoice → paid**

Live demo: https://ridgeline-roofing-mk26.whop.site · add `?debug=pixel` to watch pixel events fire.

## Bounty requirements → where they live

| Requirement | Where it lives |
| --- | --- |
| Built on Whop Websites, live on Whop hosting | `whop apps init` / `whop apps deploy` (Vite plugin `@whop/cli/vite`) |
| Sections: services (repair, replacement, inspection), service area, financing, reviews/trust, contact | `src/components/sections/*` |
| Real plans: $149 inspection, $500 deposit, $349 flat-rate service | `src/config/site.ts` → `plans`, created by `scripts/setup-whop.mjs` |
| Payment Elements: ExpressCheckoutElement + PaymentElement + required BrandingElement | `src/components/checkout/PlanCheckout.tsx`, `useWhopPayments.ts` |
| "Request an estimate" → Whop Leads API | `Estimate.tsx` → Sign in with Whop pop-up → `POST /api/lead` → `POST /leads` |
| Card on file via a setup intent at deposit checkout | `DepositCheckout.tsx` → `POST /api/deposit` → `POST /setup_intents`, then `POST /payments` |
| Final balance with the Invoices API (auto-charge or send) | `/contractor` → `POST /api/admin/invoice` → `POST /invoices` |
| Custom `whop.track` events (3 required) | `estimate_requested`, `service_viewed`, `deposit_started` + `quote_calculated`, `project_viewed` — `src/lib/track.ts` |
| Whop Payments only — no Stripe, PayPal or custom card forms | Card data is only ever entered inside Whop's elements |
| Reusable template | One config file: `src/config/site.ts` |
| Responsive | Every section is built mobile-first; sticky Call / Estimate bar on phones |

## What's on the site

- **Storm-night hero** — the roof outline draws itself, windows light up, rain falls and lightning flashes (all motion respects *reduced motion*).
- **Services** with per-service pixel tracking, **roof cost calculator** (size, pitch, material, tear-off → live price range that pre-fills the estimate form), **how payment works** (deposit → job → invoice), **prices** (the three Whop plans), **financing**, **before/after projects slider**, **service area** ticker + ZIP checker, **reviews/trust**, **FAQ**, **estimate form** + contact.
- **Booking pages** (`/book/inspection`, `/book/flatRate`), **deposit page** (`/deposit`), payment **return page**, and a PIN-protected **contractor console** (`/contractor`).
- **Search & sharing**: RoofingContractor + FAQPage structured data, Open Graph/Twitter share image (`public/og.png`), `robots.txt`, `/sitemap.xml`.

## Re-brand it

Everything a roofer would change is in **`src/config/site.ts`**: company name, site URL, phones, hours, address, services, prices, plan IDs, calculator rates, projects (optional before/after photo URLs), service-area towns and ZIPs, reviews, trust points, FAQ, financing copy and brand colors. No component or route needs editing. Re-run `node scripts/setup-whop.mjs` after changing prices so new plans are created.

## Set up and deploy

You need Node 22+ and the Whop CLI signed in to your business (`whop quickstart`).

```sh
npm install

# 1. One-time Whop setup:
#    • creates the product and the three plans, saves their IDs to the config
#    • turns on "Sign in with Whop" (used to verify estimate requests)
#    • registers the webhook and stores its secret as WHOP_WEBHOOK_SECRET
node scripts/setup-whop.mjs

# 2. Choose a PIN for the contractor console (/contractor)
whop apps secrets set --secret ADMIN_PIN=pick-a-pin

# 3. Ship it
whop apps deploy
```

Local preview with real Whop data: `whop apps dev` (port 3000). Server logs, including webhooks: `whop apps logs <app_id>`.

### Apple Pay and Google Pay

Wallet buttons only render on a domain registered for Apple Pay. The verification file is served at `/.well-known/apple-developer-merchantid-domain-association`. After the first deploy, open **Dashboard → Websites → your domain → Fix Apple Pay → Check now**. Until then the card form works on its own.

## How each flow works

**Estimate request.** Whop's Leads API records every lead against a Whop user, so the homeowner confirms their email first. "Verify email and send request" opens Sign in with Whop in a small pop-up (OAuth 2.1 + PKCE; Whop emails a one-time code, no password) while the form stays on the page. The pop-up hands the code back over a same-origin `BroadcastChannel`; `/api/lead` exchanges it, reads the verified user from `/oauth/userinfo`, and creates the lead (`POST /api/v1/leads` with `user_id`) with property, service, roof type, timeline and message in `metadata`. The page then fires `estimate_requested` (and the standard `lead` event) with the lead ID as `event_id`. If pop-ups are blocked, the tab goes to Whop and `/estimate/verified` finishes the request. Spam bots can't create leads, and every lead has a verified email.

**Cost calculator.** Footprint × pitch factor × waste allowance → roofing squares × material rate (+ tear-off and steep-roof charges), shown as a ±10% range. "Get my exact quote" fires `quote_calculated` (with the value) and pre-fills the estimate form.

**Inspection / flat-rate booking (`/book/inspection`, `/book/flatRate`).** `ExpressCheckoutElement` shows Apple Pay / Google Pay for the plan. Below it, `PaymentElement` + `BrandingElement` collect the card; the browser creates a confirmation token and `/api/pay` charges the plan with `POST /payments`. Any 3D Secure or bank step is finished with `handleNextAction`, and `/checkout/return` reads the outcome. Opening a booking page fires `service_viewed`.

**Deposit (`/deposit`).** `PaymentElement` + `BrandingElement` mount in **setup mode**. When the homeowner confirms, the browser fires `deposit_started`, then `/api/deposit`:

1. creates a **setup intent** with the confirmation token, which saves the card on file;
2. charges the **$500 deposit plan** to that saved card (`POST /payments` with `member_id` + `payment_method_id`, idempotent per setup intent).

If saving the card needs 3D Secure, the browser finishes it and `/api/deposit-charge` charges the deposit afterwards.

**Contractor console (`/contractor`, PIN-protected).**
- **Jobs pipeline** — one card per customer, moving *Estimate requested → Inspection paid → Deposit + card on file → Final invoice sent → Paid in full*, joined live from the Leads, Payments, Setup Intents and Invoices APIs.
- **Bill the final balance** — creates an invoice with `POST /invoices`: job total and the deposit credit as line items, and either `collection_method: charge_automatically` with the saved `payment_method_id` (bills the card on file) or `send_invoice` (Whop emails a pay-online link; financing can surface there for approved merchants).
- Lists of final invoices, cards on file and estimate requests.

**Webhooks (`/api/webhooks/whop`).** Verifies Whop's Standard Webhooks signature (HMAC-SHA256 over `id.timestamp.body`, 5-minute replay window, de-duplicated by `webhook-id`) and handles `payment.succeeded`, `payment.failed`, `setup_intent.succeeded`, `invoice.created`, `invoice.paid` and `invoice.past_due` — e.g. "Deposit paid — schedule the crew". Hook a CRM or crew notifications in where marked.

**Pixel.** On whop.site the Whop pixel is injected automatically (page views and checkout events are tracked for you). `src/lib/track.ts` adds the custom events with `event_id` de-duplication. Add `?debug=pixel` to any URL to see each event on screen as it fires.

## Security notes

- The Whop API key never reaches this code: on Whop hosting, server-side requests to `WHOP_API_ORIGIN` are signed by the platform. Locally, `whop apps dev` provides a short-lived key.
- Card data is entered only inside Whop's PCI-isolated frames; the site handles single-use confirmation tokens.
- Webhooks are rejected without a valid signature; OAuth uses PKCE and a state check.
- The contractor console and its API routes require the `ADMIN_PIN` app secret and are turned off without it.
- Reviews in the config are marked as samples (`reviews.areSamples`) until replaced with real ones.

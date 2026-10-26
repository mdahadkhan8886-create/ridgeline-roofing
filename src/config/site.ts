/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIG — the only file you edit to re-brand this template.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Swap the company name, phone, services, prices, service area, reviews and
 *  colors here. No component or route needs to change.
 *
 *  Whop IDs (product + plans) are created once with the Whop CLI — see
 *  README.md → "1. Create the product and plans". Paste the IDs below.
 */

export type ServiceId = 'repair' | 'replacement' | 'inspection'

export type PlanKey = 'inspection' | 'deposit' | 'flatRate'

export interface Service {
  id: ServiceId
  name: string
  summary: string
  /** Shown as "From $X". Use a plain number in dollars. */
  startingAt: number
  /** Which bookable plan the service links to, if any. */
  bookPlan?: PlanKey
  includes: string[]
}

export interface Plan {
  key: PlanKey
  /** Whop plan ID (plan_…). Leave '' until you have created it. */
  whopPlanId: string
  name: string
  price: number
  /** One line under the price. */
  priceNote: string
  description: string
  includes: string[]
  /** Button label on the pricing table. */
  cta: string
}

export interface Review {
  name: string
  town: string
  stars: 1 | 2 | 3 | 4 | 5
  text: string
  job: string
}

export const site = {
  company: {
    name: 'Ridgeline Roofing',
    shortName: 'Ridgeline',
    tagline: 'Roofs built for the next storm.',
    intro:
      'Repairs, full replacements and honest inspections for homes across North Texas. Upfront prices, a written warranty, and a crew that cleans up before it leaves.',
    phone: '(214) 555-0147',
    phoneHref: 'tel:+12145550147',
    emergencyLine: '(214) 555-0199',
    email: 'hello@ridgelineroofing.example',
    address: '2201 Commerce St, Plano, TX 75074',
    hours: [
      { days: 'Mon – Fri', time: '7:00 am – 6:00 pm' },
      { days: 'Saturday', time: '8:00 am – 2:00 pm' },
      { days: 'Sunday', time: 'Storm emergencies only' },
    ],
    license: 'License #RR-000000 (sample)',
    foundedYear: 2009,
    warrantyYears: 10,
  },

  /** Brand colors. Any CSS color works. */
  theme: {
    sky: '#E9F0F3',
    slate: '#1E2B32',
    shingle: '#4A5A63',
    flashing: '#A9BCC5',
    accent: '#F4C430',
    accentInk: '#1E2B32',
  },

  /** Short facts shown under the hero. */
  facts: [
    { value: '2009', label: 'Roofing in North Texas since' },
    { value: '10-year', label: 'Written workmanship warranty' },
    { value: '24 hrs', label: 'Typical estimate turnaround' },
    { value: '4.9 / 5', label: 'Average customer rating' },
  ],

  services: [
    {
      id: 'repair',
      name: 'Roof repair',
      summary:
        'Leaks, missing shingles, hail and wind damage, failed flashing. We find the cause, not just the wet spot.',
      startingAt: 350,
      bookPlan: 'inspection',
      includes: [
        'Leak tracing and photo report',
        'Shingle, flashing and vent boot repair',
        'Emergency tarping within 24 hours',
        'Insurance claim photos on request',
      ],
    },
    {
      id: 'replacement',
      name: 'Roof replacement',
      summary:
        'Full tear-off and new roof system in architectural shingle or standing-seam metal, usually done in one or two days.',
      startingAt: 9800,
      bookPlan: 'deposit',
      includes: [
        'Tear-off down to the deck, rotten decking replaced',
        'Synthetic underlayment and ice-and-water shield',
        'New drip edge, flashing and ridge vent',
        'Magnetic nail sweep of the whole yard',
      ],
    },
    {
      id: 'inspection',
      name: 'Roof inspection',
      summary:
        'A 30-point inspection with drone and on-roof photos, a written condition report, and a straight answer on repair vs replace.',
      startingAt: 149,
      bookPlan: 'inspection',
      includes: [
        'Drone and on-roof photo set',
        'Written condition report within 24 hours',
        'Remaining-life estimate',
        'Fee credited if you hire us for the work',
      ],
    },
  ] satisfies Service[],

  plans: {
    inspection: {
      key: 'inspection',
      whopPlanId: 'plan_TwXnkUNhpMe0x',
      name: 'Roof inspection',
      price: 149,
      priceNote: 'One-time fee, credited toward any repair',
      description: 'A 30-point inspection with photos and a written report.',
      includes: [
        '30-point inspection',
        'Drone and on-roof photos',
        'Written report in 24 hours',
      ],
      cta: 'Book an inspection',
    },
    deposit: {
      key: 'deposit',
      whopPlanId: 'plan_sS2uxPpHfSLfK',
      name: 'Project deposit',
      price: 500,
      priceNote: 'Holds your install date, deducted from the final bill',
      description:
        'Reserve your crew and materials. Your card is saved securely so the final balance can be billed when the job is done.',
      includes: [
        'Locks in your install date',
        'Materials ordered for your roof',
        'Deducted from your final invoice',
      ],
      cta: 'Pay deposit',
    },
    flatRate: {
      key: 'flatRate',
      whopPlanId: 'plan_e5tZ6hp5UCTzk',
      name: 'Gutter clean & roof tune-up',
      price: 349,
      priceNote: 'Flat rate for single-story homes up to 2,500 sq ft',
      description:
        'Gutters and downspouts cleared, loose shingles resealed, vent boots and flashing checked.',
      includes: [
        'Gutters and downspouts cleared',
        'Loose shingles resealed',
        'Vent boots and flashing checked',
      ],
      cta: 'Book a tune-up',
    },
  } satisfies Record<PlanKey, Plan>,

  /** The three steps of a replacement job, shown in "How a project works". */
  process: [
    {
      title: 'Inspect and quote',
      text: 'We inspect the roof, photograph every problem and send a fixed written quote. No pressure, no surprise add-ons.',
    },
    {
      title: 'Hold your date with a deposit',
      text: 'A $500 deposit books the crew and orders materials. Your card stays on file with Whop, our payment processor — never with us.',
    },
    {
      title: 'Pay the balance when it’s done',
      text: 'After the final walk-through you get an itemized invoice. Pay it online, or let it charge the card already on file.',
    },
  ],

  financing: {
    title: 'Pay for a new roof over time',
    text: 'Eligible customers can split the cost with buy-now-pay-later options such as Klarna or Afterpay, shown right in checkout when available. No separate application, no calls from a lender.',
    note: 'Financing options depend on eligibility and are offered at checkout.',
  },

  serviceArea: {
    title: 'Where we work',
    text: 'Based in Plano, our crews cover the northern Dallas–Fort Worth suburbs. Outside the list? Send an estimate request anyway — we often travel for full replacements.',
    towns: [
      'Plano',
      'Frisco',
      'McKinney',
      'Allen',
      'Richardson',
      'Garland',
      'Carrollton',
      'Wylie',
      'Murphy',
      'Prosper',
      'Little Elm',
      'The Colony',
    ],
    zips: [
      '75002', '75013', '75023', '75024', '75025', '75033', '75034', '75035',
      '75036', '75040', '75041', '75042', '75043', '75044', '75056', '75068',
      '75069', '75070', '75071', '75072', '75074', '75075', '75078', '75080',
      '75081', '75082', '75093', '75094', '75098', '75006', '75007', '75010',
    ],
  },

  reviews: {
    /** Shows a small "sample reviews" note. Set to false once you use real reviews. */
    areSamples: true,
    items: [
      {
        name: 'Dana M.',
        town: 'Frisco',
        stars: 5,
        job: 'Hail damage replacement',
        text: 'They walked me through the drone photos, handled the insurance paperwork and had the new roof on in a day and a half. The yard was cleaner than before they came.',
      },
      {
        name: 'Luis R.',
        town: 'Allen',
        stars: 5,
        job: 'Leak repair',
        text: 'Two other companies wanted to replace the whole roof. Ridgeline found a cracked vent boot, fixed it for under $400, and the leak is gone.',
      },
      {
        name: 'Priya S.',
        town: 'Plano',
        stars: 5,
        job: 'Inspection before buying a home',
        text: 'The report was clear enough to use in our negotiation with the seller. Worth far more than the inspection fee.',
      },
    ] satisfies Review[],
  },

  trust: [
    'Licensed and fully insured',
    'Manufacturer-certified installers',
    'Written 10-year workmanship warranty',
    'Payments processed securely by Whop',
  ],

  estimateForm: {
    title: 'Get a free estimate',
    text: 'Tell us about the roof. We reply within one business day with next steps and, for most repairs, a ballpark price.',
    roofTypes: ['Asphalt shingle', 'Metal', 'Tile', 'Flat / low slope', 'Not sure'],
    timelines: ['As soon as possible', 'Within a month', 'In 1–3 months', 'Just researching'],
  },

  /** Whop product that the plans and invoices belong to (prod_…). */
  whop: {
    productId: 'prod_1p3hyVjuCoMDS',
  },
}

export type Site = typeof site

export function getPlan(key: string): Plan | undefined {
  return (site.plans as Record<string, Plan>)[key]
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}

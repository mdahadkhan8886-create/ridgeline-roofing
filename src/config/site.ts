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
    /** The live site address, used for share previews and search engines. */
    url: 'https://ridgeline-roofing-mk26.whop.site',
    address: '2201 Commerce St, Plano, TX 75074',
    addressParts: { street: '2201 Commerce St', city: 'Plano', region: 'TX', postalCode: '75074', country: 'US' },
    tagline: 'Roofs built for the next storm.',
    intro:
      'Repairs, full replacements and honest inspections for homes across North Texas. Upfront prices, a written warranty, and a crew that cleans up before it leaves.',
    phone: '(214) 555-0147',
    phoneHref: 'tel:+12145550147',
    emergencyLine: '(214) 555-0199',
    email: 'hello@ridgelineroofing.example',
    hours: [
      { days: 'Mon – Fri', time: '7:00 am – 6:00 pm' },
      { days: 'Saturday', time: '8:00 am – 2:00 pm' },
      { days: 'Sunday', time: 'Storm emergencies only' },
    ],
    license: 'License #RR-000000 (sample)',
    foundedYear: 2009,
    warrantyYears: 10,
  },

  /**
   * Brand colors (dark "storm night" theme). Any CSS color works.
   * night → page background, surface/raised → panels, line → borders,
   * accent → buttons and highlights (amber work-light), accent2 → its warm
   * gradient partner (copper), bolt → the lightning flash in the hero.
   */
  theme: {
    night: '#0A0F13',
    surface: '#10181D',
    raised: '#172229',
    line: '#24333C',
    text: '#EEF3F6',
    muted: '#9AACB7',
    accent: '#FFC233',
    accent2: '#FF7A1A',
    accentInk: '#1A1203',
    bolt: '#8FD3FF',
  },

  /** Short facts under the hero. Numbers count up when they scroll into view. */
  facts: [
    { value: 2400, decimals: 0, suffix: '+', label: 'Roofs replaced since 2009' },
    { value: 10, decimals: 0, suffix: '-year', label: 'Written workmanship warranty' },
    { value: 24, decimals: 0, suffix: ' hrs', label: 'Typical estimate turnaround' },
    { value: 4.9, decimals: 1, suffix: ' / 5', label: 'Average customer rating' },
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

  /**
   * Roof cost calculator. Prices are per roofing "square" (100 sq ft of roof).
   * Tune these to the contractor's real numbers; the range shown is ±spread.
   */
  calculator: {
    title: 'What will a new roof cost?',
    text: 'A quick ballpark for a full replacement. Your written quote is fixed after we measure the roof in person.',
    note: 'Ballpark for planning only. Taxes, permits, decking repairs and upgrades are quoted after we see the roof.',
    materials: [
      { id: 'architectural', name: 'Architectural shingle', perSquare: 520, note: '30-year shingle, most popular' },
      { id: 'designer', name: 'Designer shingle', perSquare: 690, note: 'Thicker, slate or shake look' },
      { id: 'metal', name: 'Standing-seam metal', perSquare: 1150, note: '50+ year life, hail resistant' },
    ],
    pitches: [
      { label: '4/12', rise: 4, factor: 1.054, note: 'Low' },
      { label: '6/12', rise: 6, factor: 1.118, note: 'Standard' },
      { label: '8/12', rise: 8, factor: 1.202, note: 'Steep' },
      { label: '10/12', rise: 10, factor: 1.302, note: 'Very steep' },
      { label: '12/12', rise: 12, factor: 1.414, note: 'Extreme' },
    ],
    /** Extra per square for each existing layer torn off. */
    tearOffPerSquare: 95,
    /** Steep roofs need extra safety gear and time, per square above 8/12. */
    steepPerSquare: 60,
    /** Overhang and waste allowance applied to the footprint. */
    wasteFactor: 1.12,
    minimumJob: 6500,
    spread: 0.1,
    footprint: { min: 900, max: 5000, step: 50, default: 2200 },
  },

  /**
   * Before / after projects. Add photo URLs (beforeImage / afterImage) to show
   * real jobs; without them the slider shows an illustration of the work.
   */
  projects: [
    {
      id: 'frisco-hail',
      title: 'Hail-damaged roof, fully replaced',
      town: 'Frisco',
      scope: 'Tear-off to the deck, new architectural shingles, ridge vent',
      duration: '1.5 days',
      beforeImage: '',
      afterImage: '',
    },
    {
      id: 'allen-leak',
      title: 'Kitchen leak traced and fixed',
      town: 'Allen',
      scope: 'Cracked vent boot and 14 shingles replaced, deck dried',
      duration: '3 hours',
      beforeImage: '',
      afterImage: '',
    },
    {
      id: 'plano-metal',
      title: 'Asphalt to standing-seam metal',
      town: 'Plano',
      scope: 'Hail-rated standing-seam panels, new flashing, seamless gutters',
      duration: '3 days',
      beforeImage: '',
      afterImage: '',
    },
  ],

  faq: [
    {
      q: 'Will my insurance pay for a new roof after hail?',
      a: 'Often, yes. We inspect, photograph every hit and give you a report your adjuster can use. Many homeowners only pay their deductible. We never ask you to sign anything with your insurer on your behalf.',
    },
    {
      q: 'How long does a full replacement take?',
      a: 'Most homes take one or two days. We tarp and protect landscaping first, and run a magnetic nail sweep before we leave each day.',
    },
    {
      q: 'Why do you take a deposit?',
      a: 'The deposit reserves your install date and orders your materials. It is deducted from your final invoice, and your card stays saved securely with Whop, our payment processor, not with us.',
    },
    {
      q: 'When do I pay the rest?',
      a: 'After the final walk-through. You get an itemized invoice with the deposit already credited. Pay it online, or approve a charge to the card on file.',
    },
    {
      q: 'Can I pay over time?',
      a: 'Eligible customers can choose buy-now-pay-later options such as Klarna or Afterpay at checkout when they are offered. There is no separate loan application.',
    },
    {
      q: 'What does the warranty cover?',
      a: 'Our written 10-year workmanship warranty covers leaks and installation defects. Manufacturer warranties on materials are registered in your name.',
    },
  ],

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

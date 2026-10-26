import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { useEffect } from 'react'
import { formatUSD, getPlan, site } from '#/config/site'
import { track, visitId } from '#/lib/track'
import { PlanCheckout } from '#/components/checkout/PlanCheckout'

const BOOKABLE = ['inspection', 'flatRate']

export const Route = createFileRoute('/book/$planKey')({
  validateSearch: (search: Record<string, unknown>): { service?: string } =>
    typeof search.service === 'string' ? { service: search.service } : {},
  loader: ({ params }) => {
    const plan = getPlan(params.planKey)
    if (!plan || !BOOKABLE.includes(plan.key)) throw notFound()
    return { planKey: plan.key }
  },
  head: ({ params }) => ({
    meta: [{ title: `${getPlan(params.planKey)?.name ?? 'Book'} | ${site.company.name}` }],
  }),
  component: BookPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <h1 className="display text-4xl">That service can’t be booked online</h1>
      <p className="mt-4">
        <a href="/#estimate" className="font-bold text-ink">
          Request an estimate
        </a>{' '}
        and we’ll get back to you within one business day.
      </p>
    </div>
  ),
})

function BookPage() {
  const { planKey } = Route.useLoaderData()
  const { service } = Route.useSearch()
  const plan = getPlan(planKey)!

  // service_viewed: the visitor opened a service's booking page.
  useEffect(() => {
    const serviceId = service ?? (plan.key === 'inspection' ? 'inspection' : 'flat_rate_tuneup')
    track('service_viewed', {
      service: serviceId,
      plan: plan.key,
      source: 'booking_page',
      value: plan.price,
      currency: 'USD',
      event_id: `book-${plan.key}-${visitId()}`,
    })
  }, [plan.key, plan.price, service])

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <Link to="/" hash="pricing" className="text-sm font-semibold text-muted no-underline hover:text-ink">
          Back to prices
        </Link>
        <h1 className="display mt-4 text-[clamp(2.2rem,5vw,3.6rem)]">{plan.name}</h1>
        <p className="mt-4 flex items-baseline gap-3">
          <span className="display text-[2.6rem]">{formatUSD(plan.price)}</span>
          <span className="text-muted">{plan.priceNote}</span>
        </p>
        <p className="measure mt-4 text-[1.1rem] text-ink/85">{plan.description}</p>
        <ul className="mt-6 grid list-none gap-2 p-0">
          {plan.includes.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.65em] h-1.5 w-3 flex-none bg-hivis" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-10 border-t border-rule pt-6">
          <h2 className="heading m-0 text-[1.15rem]">What happens after you pay</h2>
          <ol className="mt-3 grid gap-2 pl-5">
            <li>You get a receipt from Whop by email right away.</li>
            <li>We call within one business day to pick a time.</li>
            <li>The crew arrives in a marked truck and sends photos when they’re done.</li>
          </ol>
          <p className="mt-6 text-sm text-muted">
            Questions first? Call{' '}
            <a href={site.company.phoneHref} className="font-bold text-ink">
              {site.company.phone}
            </a>
            .
          </p>
        </div>
      </div>
      <div>
        <PlanCheckout plan={plan} />
      </div>
    </div>
  )
}

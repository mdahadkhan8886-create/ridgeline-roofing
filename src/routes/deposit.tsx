import { Link, createFileRoute } from '@tanstack/react-router'
import { formatUSD, site } from '#/config/site'
import { DepositCheckout } from '#/components/checkout/DepositCheckout'

export const Route = createFileRoute('/deposit')({
  head: () => ({ meta: [{ title: `${site.plans.deposit.name} | ${site.company.name}` }] }),
  component: DepositPage,
})

function DepositPage() {
  const plan = site.plans.deposit
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <Link to="/" hash="pricing" className="text-sm font-semibold text-dim no-underline hover:text-amber">
          Back to prices
        </Link>
        <h1 className="display mt-4 text-[clamp(2.2rem,5vw,3.6rem)]">Reserve your install date</h1>
        <p className="mt-4 flex items-baseline gap-3">
          <span className="display text-glow text-[2.6rem]">{formatUSD(plan.price)}</span>
          <span className="text-dim">{plan.priceNote}</span>
        </p>
        <p className="measure mt-4 text-[1.1rem] text-dim">{plan.description}</p>

        <ol className="mt-8 grid list-none gap-6 p-0">
          {site.process.map((step, i) => (
            <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-4">
              <span
                aria-hidden="true"
                className={`heading flex h-10 w-10 items-center justify-center rounded-full text-lg ${i === 1 ? 'bg-amber text-on-amber shadow-[0_0_30px_-6px_var(--rr-accent2)]' : 'bg-raised text-fg ring-1 ring-line'}`}
              >
                {i + 1}
              </span>
              <div>
                <h2 className="heading m-0 text-[1.15rem]">
                  {step.title}
                  {i === 1 && <span className="ml-2 text-sm font-semibold text-dim">You are here</span>}
                </h2>
                <p className="mt-1 text-dim">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-dim">{site.financing.note}</p>
      </div>
      <div>
        <DepositCheckout />
      </div>
    </div>
  )
}

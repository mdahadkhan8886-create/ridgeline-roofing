import { Link } from '@tanstack/react-router'
import { formatUSD, site } from '#/config/site'
import type { Plan } from '#/config/site'

function PlanColumn({ plan, index }: { plan: Plan; index: number }) {
  const featured = plan.key === 'deposit'
  return (
    <div
      className={`flex flex-col p-7 sm:p-8 ${index > 0 ? 'border-t border-rule md:border-l md:border-t-0' : ''} ${featured ? 'bg-paper' : 'bg-white'}`}
    >
      <h3 className="heading m-0 text-[1.35rem]">{plan.name}</h3>
      <p className="m-0 mt-4 flex items-baseline gap-2">
        <span className="display text-[3rem] leading-none">{formatUSD(plan.price)}</span>
      </p>
      <p className="mt-2 text-[0.92rem] text-muted">{plan.priceNote}</p>
      <p className="mt-4 text-ink/90">{plan.description}</p>
      <ul className="mt-4 grid list-none gap-1.5 p-0 text-[0.96rem]">
        {plan.includes.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-3 flex-none bg-hivis" />
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-7">
        {plan.key === 'deposit' ? (
          <Link to="/deposit" className={`btn w-full ${featured ? 'btn-primary' : 'btn-ghost text-ink'}`}>
            {plan.cta}
          </Link>
        ) : (
          <Link
            to="/book/$planKey"
            params={{ planKey: plan.key }}
            className={`btn w-full ${featured ? 'btn-primary' : 'btn-ghost text-ink'}`}
          >
            {plan.cta}
          </Link>
        )}
      </div>
    </div>
  )
}

export function Pricing() {
  const plans = [site.plans.inspection, site.plans.flatRate, site.plans.deposit]
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-18 sm:px-6 md:py-24">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr] md:items-end">
          <h2 id="pricing-title" className="display m-0 text-[clamp(2rem,4.5vw,3.2rem)]">
            Prices you can book today
          </h2>
          <p className="m-0 text-[1.05rem] text-muted md:text-right">
            Pay online by card, Apple Pay or Google Pay. Bigger jobs start with a quote.
          </p>
        </div>
        <div className="mt-10 grid overflow-hidden rounded-md border-2 border-ink md:grid-cols-3">
          {plans.map((plan, i) => (
            <PlanColumn key={plan.key} plan={plan} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

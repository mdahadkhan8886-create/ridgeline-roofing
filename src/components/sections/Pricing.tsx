import { Link } from '@tanstack/react-router'
import { formatUSD, site } from '#/config/site'
import type { Plan } from '#/config/site'
import { Reveal } from '#/components/Reveal'

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const featured = plan.key === 'deposit'
  return (
    <Reveal delay={index * 120} className="h-full">
      <div className={`relative flex h-full flex-col rounded-[18px] p-7 sm:p-8 ${featured ? 'glow-edge' : 'card lift'}`}>
        {featured && (
          <span className="absolute -top-3 left-7 rounded-full bg-amber px-3 py-1 text-xs font-bold text-on-amber">
            Most booked
          </span>
        )}
        <h3 className="heading m-0 text-[1.3rem] text-fg">{plan.name}</h3>
        <p className="m-0 mt-5">
          <span className={`display text-[3.2rem] leading-none ${featured ? 'text-glow' : 'text-fg'}`}>{formatUSD(plan.price)}</span>
        </p>
        <p className="mt-2 text-[0.92rem] text-dim">{plan.priceNote}</p>
        <p className="mt-4 text-fg/90">{plan.description}</p>
        <ul className="mt-5 grid list-none gap-2 p-0 text-[0.96rem] text-fg/90">
          {plan.includes.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.62em] h-1.5 w-3 flex-none rounded-full bg-amber" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-8">
          {plan.key === 'deposit' ? (
            <Link to="/deposit" className="btn btn-primary w-full">
              {plan.cta}
            </Link>
          ) : (
            <Link to="/book/$planKey" params={{ planKey: plan.key }} className="btn btn-ghost w-full">
              {plan.cta}
            </Link>
          )}
        </div>
      </div>
    </Reveal>
  )
}

export function Pricing() {
  const plans = [site.plans.inspection, site.plans.flatRate, site.plans.deposit]
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="bg-night">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <Reveal className="grid gap-4 md:grid-cols-[1.2fr_1fr] md:items-end">
          <h2 id="pricing-title" className="display m-0 text-[clamp(2.1rem,4.6vw,3.4rem)] text-fg">
            Prices you can book today
          </h2>
          <p className="m-0 text-[1.05rem] text-dim md:text-right">
            Pay online by card, Apple Pay or Google Pay. Bigger jobs start with a quote.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <PlanCard key={plan.key} plan={plan} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

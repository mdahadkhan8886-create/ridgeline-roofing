import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { formatUSD, site } from '#/config/site'
import type { Service } from '#/config/site'
import { track, visitId } from '#/lib/track'

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="mt-1 h-4 w-4 flex-none" aria-hidden="true">
      <path d="M3.5 10.5l4 4 9-9" stroke="var(--rr-slate)" strokeWidth="2.6" fill="none" />
    </svg>
  )
}

function ServiceColumn({ service, index }: { service: Service; index: number }) {
  const ref = useRef<HTMLElement>(null)

  // service_viewed: fires once per visit when at least half the column is on screen.
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          track('service_viewed', {
            service: service.id,
            service_name: service.name,
            source: 'services_section',
            event_id: `${service.id}-${visitId()}`,
          })
          observer.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [service.id, service.name])

  const plan = service.bookPlan ? site.plans[service.bookPlan] : undefined

  return (
    <article
      ref={ref}
      id={`service-${service.id}`}
      className={`flex flex-col py-8 md:px-8 md:py-2 ${index > 0 ? 'border-t border-rule md:border-l md:border-t-0' : 'md:pl-0'}`}
    >
      <h3 className="heading m-0 text-[1.65rem] text-ink">{service.name}</h3>
      <p className="mt-2 text-[0.95rem] font-semibold text-muted">From {formatUSD(service.startingAt)}</p>
      <p className="mt-4 text-ink/90">{service.summary}</p>
      <ul className="mt-5 grid list-none gap-2 p-0 text-[0.98rem]">
        {service.includes.map((item) => (
          <li key={item} className="flex gap-2.5">
            <CheckIcon />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-7">
        {plan?.key === 'deposit' ? (
          <Link to="/deposit" className="btn btn-ghost text-ink">
            Reserve with a {formatUSD(plan.price)} deposit
          </Link>
        ) : plan ? (
          <Link to="/book/$planKey" params={{ planKey: plan.key }} search={{ service: service.id }} className="btn btn-ghost text-ink">
            {service.id === 'inspection' ? `Book for ${formatUSD(plan.price)}` : `Start with a ${formatUSD(plan.price)} inspection`}
          </Link>
        ) : (
          <a href="#estimate" className="btn btn-ghost text-ink">
            Request an estimate
          </a>
        )}
      </div>
    </article>
  )
}

export function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-18 sm:px-6 md:py-24">
        <div className="max-w-2xl">
          <h2 id="services-title" className="display m-0 text-[clamp(2rem,4.5vw,3.2rem)]">
            Three things we do, and do properly
          </h2>
          <p className="mt-4 text-[1.1rem] text-muted">
            Every job starts with photos of what we found and a fixed price in writing.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-3">
          {site.services.map((service, index) => (
            <ServiceColumn key={service.id} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

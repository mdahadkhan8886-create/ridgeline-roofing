import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { formatUSD, site } from '#/config/site'
import type { Service, ServiceId } from '#/config/site'
import { track, visitId } from '#/lib/track'
import { Reveal } from '#/components/Reveal'

function ServiceIcon({ id }: { id: ServiceId }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
      {id === 'repair' && (
        <g {...common}>
          <path d="M4 17 L16 7 L28 17" />
          <path d="M8 14 v12 h16 V14" />
          <path d="M14 26 v-6 h4 v6" />
          <path d="M21 4 l4 4 -3 3 -4 -4z" />
        </g>
      )}
      {id === 'replacement' && (
        <g {...common}>
          <path d="M3 15 L16 5 L29 15" />
          <path d="M6 20 L16 12 L26 20" />
          <path d="M9 25 L16 19.5 L23 25" />
        </g>
      )}
      {id === 'inspection' && (
        <g {...common}>
          <circle cx="14" cy="14" r="8" />
          <path d="M20 20 L28 28" />
          <path d="M9 16 L14 11 L19 16" />
        </g>
      )}
    </svg>
  )
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const ref = useRef<HTMLElement>(null)

  // service_viewed: fires once per visit when at least half the card is on screen.
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
    <Reveal delay={index * 120} className="h-full">
      <article ref={ref} id={`service-${service.id}`} className="card lift group flex h-full flex-col p-7">
        <div className="flex items-center justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber/10 text-amber ring-1 ring-amber/25">
            <ServiceIcon id={service.id} />
          </span>
          <span className="text-sm font-semibold text-dim">From {formatUSD(service.startingAt)}</span>
        </div>
        <h3 className="heading m-0 mt-6 text-[1.55rem] text-fg">{service.name}</h3>
        <p className="mt-3 text-dim">{service.summary}</p>
        <ul className="mt-5 grid list-none gap-2.5 p-0 text-[0.97rem] text-fg/90">
          {service.includes.map((item) => (
            <li key={item} className="flex gap-3">
              <svg viewBox="0 0 20 20" className="mt-1 h-4 w-4 flex-none text-amber" aria-hidden="true">
                <path d="M3.5 10.5l4 4 9-9" stroke="currentColor" strokeWidth="2.6" fill="none" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-8">
          {plan?.key === 'deposit' ? (
            <Link to="/deposit" className="btn btn-ghost w-full">
              Reserve with a {formatUSD(plan.price)} deposit
            </Link>
          ) : plan ? (
            <Link to="/book/$planKey" params={{ planKey: plan.key }} search={{ service: service.id }} className="btn btn-ghost w-full">
              {service.id === 'inspection' ? `Book for ${formatUSD(plan.price)}` : `Start with a ${formatUSD(plan.price)} inspection`}
            </Link>
          ) : (
            <a href="#estimate" className="btn btn-ghost w-full">
              Request an estimate
            </a>
          )}
        </div>
      </article>
    </Reveal>
  )
}

export function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="relative bg-night">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <Reveal className="grid gap-5 md:grid-cols-[1.2fr_1fr] md:items-end">
          <h2 id="services-title" className="display m-0 text-[clamp(2.1rem,4.6vw,3.4rem)] text-fg">
            Three things we do, and do properly
          </h2>
          <p className="m-0 text-[1.1rem] text-dim md:text-right">
            Every job starts with photos of what we found and a fixed price in writing.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {site.services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

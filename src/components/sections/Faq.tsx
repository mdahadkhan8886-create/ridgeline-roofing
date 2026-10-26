import { site } from '#/config/site'
import { Reveal } from '#/components/Reveal'

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-line bg-night">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1fr_1.6fr]">
        <Reveal>
          <h2 id="faq-title" className="display m-0 text-[clamp(2.1rem,4.6vw,3.4rem)] text-fg">
            Questions homeowners ask
          </h2>
          <p className="mt-4 text-[1.05rem] text-dim">
            Something else? Call{' '}
            <a href={site.company.phoneHref} className="font-bold text-fg hover:text-amber">
              {site.company.phone}
            </a>
            .
          </p>
        </Reveal>
        <Reveal delay={120} className="grid gap-3">
          {site.faq.map((item) => (
            <details key={item.q} className="group card open:border-amber/50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[1.08rem] font-semibold text-fg [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line text-amber transition-transform duration-300 group-open:rotate-45"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" />
                  </svg>
                </span>
              </summary>
              <p className="m-0 px-6 pb-6 text-dim">{item.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

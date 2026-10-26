import { site } from '#/config/site'
import { Reveal } from '#/components/Reveal'

/** Deposit → job → final invoice, explained for homeowners. A real sequence, so it's numbered. */
export function Process() {
  return (
    <section aria-labelledby="process-title" className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
        <Reveal>
          <h2 id="process-title" className="display m-0 max-w-2xl text-[clamp(2rem,4.2vw,3rem)] text-fg">
            How a new roof gets paid for
          </h2>
          <p className="measure mt-4 text-[1.08rem] text-dim">No surprise bills. You see every number before you pay it.</p>
        </Reveal>
        <ol className="mt-12 grid list-none gap-10 p-0 md:grid-cols-3 md:gap-0">
          {site.process.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 150} className="relative md:pr-10">
              <div className="flex items-center gap-4">
                <span
                  className="heading flex h-12 w-12 flex-none items-center justify-center rounded-full bg-amber text-xl text-on-amber shadow-[0_0_30px_-6px_var(--rr-accent2)]"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                {i < site.process.length - 1 && (
                  <span className="hidden h-px flex-1 bg-gradient-to-r from-amber/70 to-line md:block" aria-hidden="true" />
                )}
              </div>
              <h3 className="heading mt-6 text-[1.3rem] text-fg">{step.title}</h3>
              <p className="measure mt-2 text-dim">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

import { site } from '#/config/site'

/** Deposit → job → final invoice, explained for homeowners. A real sequence, so it's numbered. */
export function Process() {
  return (
    <section aria-labelledby="process-title" className="border-y border-rule bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-18 sm:px-6 md:py-22">
        <h2 id="process-title" className="display m-0 max-w-2xl text-[clamp(1.9rem,4vw,2.8rem)]">
          How a new roof gets paid for
        </h2>
        <ol className="mt-10 grid list-none gap-8 p-0 md:grid-cols-3 md:gap-0">
          {site.process.map((step, i) => (
            <li key={step.title} className="relative md:pr-10">
              <div className="flex items-center gap-4">
                <span
                  className="heading flex h-12 w-12 flex-none items-center justify-center rounded-full bg-ink text-xl text-hivis"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                {i < site.process.length - 1 && <span className="hidden h-[3px] flex-1 bg-rule md:block" aria-hidden="true" />}
              </div>
              <h3 className="heading mt-5 text-[1.3rem]">{step.title}</h3>
              <p className="measure mt-2 text-ink/85">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

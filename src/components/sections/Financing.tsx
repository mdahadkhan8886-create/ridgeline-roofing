import { Link } from '@tanstack/react-router'
import { site } from '#/config/site'
import { Reveal } from '#/components/Reveal'

export function Financing() {
  return (
    // The wrapper matches the section above, so the sloped roof edge reads cleanly.
    <div className="bg-night">
      <section
        aria-labelledby="financing-title"
        className="pitched relative overflow-hidden bg-[linear-gradient(135deg,var(--rr-accent)_0%,var(--rr-accent2)_100%)] text-on-amber"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(-26.565deg,transparent_0_26px,black_26px_28px)]"
        />
        <Reveal className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-20 sm:px-6 md:grid-cols-[1.3fr_1fr] md:items-center md:pb-24">
          <div>
            <h2 id="financing-title" className="display m-0 text-[clamp(2.1rem,4.8vw,3.4rem)]">
              {site.financing.title}
            </h2>
            <p className="measure mt-5 text-[1.12rem] font-medium opacity-90">{site.financing.text}</p>
            <p className="mt-4 text-sm opacity-75">{site.financing.note}</p>
          </div>
          <div className="grid gap-3 md:justify-items-end">
            <Link
              to="/deposit"
              className="btn w-full bg-night text-[1.05rem] text-fg shadow-[0_20px_40px_-20px_black] hover:bg-surface md:w-auto"
            >
              Reserve your install date
            </Link>
            <a href="#estimate" className="btn w-full border-on-amber/40 text-on-amber hover:bg-black/10 md:w-auto">
              Get a quote first
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

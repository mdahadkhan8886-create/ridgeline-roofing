import { Link } from '@tanstack/react-router'
import { site } from '#/config/site'

export function Financing() {
  return (
    // The wrapper matches the section above, so the sloped roof edge reads cleanly.
    <div className="bg-white">
    <section aria-labelledby="financing-title" className="on-dark pitched bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-18 sm:px-6 md:grid-cols-[1.2fr_1fr] md:items-center md:pb-22">
        <div>
          <h2 id="financing-title" className="display m-0 text-[clamp(2rem,4.5vw,3.1rem)] text-hivis">
            {site.financing.title}
          </h2>
          <p className="measure mt-5 text-[1.12rem] text-white/85">{site.financing.text}</p>
          <p className="mt-4 text-sm text-white/60">{site.financing.note}</p>
        </div>
        <div className="grid gap-3 md:justify-items-end">
          <Link to="/deposit" className="btn btn-primary w-full text-[1.05rem] md:w-auto">
            Reserve your install date
          </Link>
          <a href="#estimate" className="btn btn-ghost w-full text-white md:w-auto">
            Get a quote first
          </a>
        </div>
      </div>
    </section>
    </div>
  )
}

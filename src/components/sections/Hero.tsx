import { Link } from '@tanstack/react-router'
import { formatUSD, site } from '#/config/site'

/** Line drawing of a gable roof with its 6/12 pitch marked — the site's one bold moment. */
function RoofDrawing() {
  return (
    <svg
      viewBox="0 0 520 370"
      className="hero-draw h-auto w-full"
      role="img"
      aria-label="Line drawing of a house roof with a 6 in 12 pitch marked"
      fill="none"
      strokeLinecap="square"
    >
      {/* roof surface */}
      <polyline points="22,209 260,90 498,209" stroke="var(--rr-slate)" strokeWidth="7" />
      <polyline points="52,206 260,102 468,206" stroke="var(--rr-slate)" strokeWidth="2" />
      {/* shingle courses */}
      {[1, 2, 3, 4].map((i) => (
        <polyline
          key={i}
          className="late"
          points={`${52 + i * 44},206 260,${102 + i * 22} ${468 - i * 44},206`}
          stroke="var(--rr-flashing)"
          strokeWidth="1.5"
        />
      ))}
      {/* chimney */}
      <polyline points="334,129 334,70 366,70 366,145" stroke="var(--rr-slate)" strokeWidth="4" />
      <line x1="328" y1="70" x2="372" y2="70" stroke="var(--rr-slate)" strokeWidth="6" />
      {/* walls and ground */}
      <polyline points="74,206 74,330 446,330 446,206" stroke="var(--rr-slate)" strokeWidth="3" />
      <line x1="16" y1="331" x2="504" y2="331" stroke="var(--rr-shingle)" strokeWidth="2" />
      {/* door and windows */}
      <polyline className="late" points="236,330 236,262 284,262 284,330" stroke="var(--rr-slate)" strokeWidth="2.5" />
      <path className="late" d="M118 244 h64 v46 h-64 z M150 244 v46" stroke="var(--rr-slate)" strokeWidth="2.5" />
      <path className="late" d="M338 244 h64 v46 h-64 z M370 244 v46" stroke="var(--rr-slate)" strokeWidth="2.5" />
      {/* pitch marker: 12 across, 6 up, sitting on the left slope */}
      <line className="late" x1="116" y1="162" x2="176" y2="162" stroke="var(--rr-accent)" strokeWidth="5" />
      <line className="late" x1="176" y1="162" x2="176" y2="132" stroke="var(--rr-accent)" strokeWidth="5" />
      <text x="146" y="184" textAnchor="middle" fill="var(--rr-slate)" stroke="var(--rr-sky)" strokeWidth="5" paintOrder="stroke" fontSize="17" fontWeight="700">
        12
      </text>
      <text x="186" y="153" fill="var(--rr-slate)" stroke="var(--rr-sky)" strokeWidth="5" paintOrder="stroke" fontSize="17" fontWeight="700">
        6
      </text>
    </svg>
  )
}

export function Hero() {
  const inspection = site.plans.inspection
  return (
    <section className="shingle-texture relative overflow-hidden" aria-labelledby="hero-title">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 md:pt-16 lg:grid-cols-[1.15fr_1fr] lg:pb-20">
        <div>
          <h1 id="hero-title" className="display m-0 text-[clamp(2.5rem,6vw,4.4rem)] text-ink">
            {site.company.tagline}
          </h1>
          <p className="measure mt-6 text-[1.15rem] text-muted">{site.company.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#estimate" className="btn btn-primary text-[1.05rem]">
              Get a free estimate
            </a>
            <Link
              to="/book/$planKey"
              params={{ planKey: 'inspection' }}
              className="btn btn-ghost text-[1.05rem] text-ink"
            >
              Book a {formatUSD(inspection.price)} inspection
            </Link>
          </div>
          <p className="mt-5 text-[0.95rem] text-muted">
            Storm damage? Our emergency line is open nights and weekends:{' '}
            <a href={`tel:${site.company.emergencyLine.replace(/[^\d+]/g, '')}`} className="font-bold text-ink">
              {site.company.emergencyLine}
            </a>
          </p>
        </div>
        <div className="mx-auto w-full max-w-[34rem]">
          <RoofDrawing />
        </div>
      </div>

      <dl className="relative mx-auto grid max-w-6xl grid-cols-2 border-t border-rule px-4 sm:px-6 md:grid-cols-4">
        {site.facts.map((fact, i) => (
          <div
            key={fact.label}
            className={`py-6 pr-4 ${i % 2 === 1 ? 'pl-4 border-l border-rule md:pl-6' : ''} ${i >= 2 ? 'border-t border-rule md:border-t-0' : ''} ${i === 2 ? 'md:border-l md:pl-6' : ''}`}
          >
            <dt className="text-[0.9rem] text-muted">{fact.label}</dt>
            <dd className="heading m-0 mt-1 text-[1.6rem] text-ink">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

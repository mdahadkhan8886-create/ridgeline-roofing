import { Link } from '@tanstack/react-router'
import { formatUSD, site } from '#/config/site'
import { CountUp } from '#/components/Reveal'

/**
 * The house at night in a storm: the roof outline draws itself in amber, the
 * windows light up, and the outline flares when lightning flashes.
 */
function RoofDrawing() {
  return (
    <svg
      viewBox="0 0 520 370"
      className="hero-draw bolt-sync h-auto w-full"
      role="img"
      aria-label="Line drawing of a house at night with its 6 in 12 roof pitch marked"
      fill="none"
      strokeLinecap="square"
    >
      <defs>
        <linearGradient id="roofStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--rr-accent)" />
          <stop offset="1" stopColor="var(--rr-accent2)" />
        </linearGradient>
        <radialGradient id="windowGlow" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0" stopColor="var(--rr-accent)" stopOpacity="0.95" />
          <stop offset="1" stopColor="var(--rr-accent2)" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      {/* lit windows and door glass */}
      <rect className="window-light" x="119" y="245" width="62" height="44" fill="url(#windowGlow)" />
      <rect className="window-light" x="339" y="245" width="62" height="44" fill="url(#windowGlow)" />
      <rect className="window-light" x="243" y="272" width="34" height="12" fill="url(#windowGlow)" />

      {/* roof surface */}
      <polyline points="22,209 260,90 498,209" stroke="url(#roofStroke)" strokeWidth="7" />
      <polyline points="52,206 260,102 468,206" stroke="var(--rr-accent)" strokeOpacity="0.7" strokeWidth="2" />
      {/* shingle courses */}
      {[1, 2, 3, 4].map((i) => (
        <polyline
          key={i}
          className="late"
          points={`${52 + i * 44},206 260,${102 + i * 22} ${468 - i * 44},206`}
          stroke="var(--rr-muted)"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
      ))}
      {/* chimney */}
      <polyline points="334,129 334,70 366,70 366,145" stroke="var(--rr-text)" strokeOpacity="0.85" strokeWidth="4" />
      <line x1="328" y1="70" x2="372" y2="70" stroke="var(--rr-text)" strokeOpacity="0.85" strokeWidth="6" />
      {/* walls and ground */}
      <polyline points="74,206 74,330 446,330 446,206" stroke="var(--rr-text)" strokeOpacity="0.8" strokeWidth="3" />
      <line x1="16" y1="331" x2="504" y2="331" stroke="var(--rr-muted)" strokeOpacity="0.6" strokeWidth="2" />
      {/* door and windows */}
      <polyline className="late" points="236,330 236,262 284,262 284,330" stroke="var(--rr-text)" strokeOpacity="0.85" strokeWidth="2.5" />
      <path className="late" d="M118 244 h64 v46 h-64 z M150 244 v46" stroke="var(--rr-text)" strokeOpacity="0.85" strokeWidth="2.5" />
      <path className="late" d="M338 244 h64 v46 h-64 z M370 244 v46" stroke="var(--rr-text)" strokeOpacity="0.85" strokeWidth="2.5" />
      {/* pitch marker: 12 across, 6 up, sitting on the left slope */}
      <line className="late" x1="116" y1="162" x2="176" y2="162" stroke="var(--rr-bolt)" strokeWidth="4" />
      <line className="late" x1="176" y1="162" x2="176" y2="132" stroke="var(--rr-bolt)" strokeWidth="4" />
      <text x="146" y="184" textAnchor="middle" fill="var(--rr-bolt)" fontSize="17" fontWeight="700">
        12
      </text>
      <text x="186" y="153" fill="var(--rr-bolt)" fontSize="17" fontWeight="700">
        6
      </text>
    </svg>
  )
}

function Stars() {
  return (
    <span className="flex gap-0.5 text-amber" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4">
          <path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8z" fill="currentColor" />
        </svg>
      ))}
    </span>
  )
}

export function Hero() {
  const inspection = site.plans.inspection
  const rating = site.facts.find((f) => f.label.toLowerCase().includes('rating'))
  return (
    <section className="storm-sky" aria-labelledby="hero-title">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-24">
        <div>
          {rating && (
            <p className="hero-rise m-0 inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-sm text-dim backdrop-blur">
              <Stars />
              <span>
                <strong className="text-fg">{rating.value.toFixed(rating.decimals)}</strong> from North Texas homeowners
              </span>
            </p>
          )}
          <h1 id="hero-title" className="display hero-rise mt-6 text-[clamp(2.6rem,6.4vw,4.8rem)] text-fg" style={{ animationDelay: '120ms' }}>
            {site.company.tagline}
          </h1>
          <p className="measure hero-rise mt-6 text-[1.15rem] text-dim" style={{ animationDelay: '240ms' }}>
            {site.company.intro}
          </p>
          <div className="hero-rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: '360ms' }}>
            <a href="#estimate" className="btn btn-primary text-[1.05rem]">
              Get a free estimate
            </a>
            <Link to="/book/$planKey" params={{ planKey: 'inspection' }} className="btn btn-ghost text-[1.05rem]">
              Book a {formatUSD(inspection.price)} inspection
            </Link>
          </div>
          <p className="hero-rise mt-6 flex items-center gap-2 text-[0.95rem] text-dim" style={{ animationDelay: '480ms' }}>
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-copper opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-copper" />
            </span>
            Storm damage tonight? Emergency line:{' '}
            <a href={`tel:${site.company.emergencyLine.replace(/[^\d+]/g, '')}`} className="font-bold text-fg no-underline hover:text-amber">
              {site.company.emergencyLine}
            </a>
          </p>
        </div>
        <div className="roof-glow mx-auto w-full max-w-[36rem]">
          <RoofDrawing />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <dl className="card-raised grid grid-cols-2 overflow-hidden md:grid-cols-4">
          {site.facts.map((fact, i) => (
            <div
              key={fact.label}
              className={`flex flex-col-reverse px-5 py-6 sm:px-7 ${i % 2 === 1 ? 'border-l border-line' : ''} ${i >= 2 ? 'border-t border-line md:border-t-0' : ''} ${i === 2 ? 'md:border-l' : ''}`}
            >
              <dt className="mt-2 text-[0.9rem] text-dim">{fact.label}</dt>
              <dd className="display m-0 text-[clamp(1.7rem,3.4vw,2.4rem)] text-glow">
                <CountUp value={fact.value} decimals={fact.decimals} suffix={fact.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

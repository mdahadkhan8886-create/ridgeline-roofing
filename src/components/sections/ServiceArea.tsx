import { useState } from 'react'
import type { FormEvent } from 'react'
import { site } from '#/config/site'
import { Reveal } from '#/components/Reveal'

function TownTicker() {
  const towns = site.serviceArea.towns
  // Two copies side by side so the loop is seamless.
  const row = [...towns, ...towns]
  return (
    <div className="fade-edges overflow-hidden border-y border-line py-5" aria-hidden="true">
      <div className="marquee gap-10">
        {row.map((town, i) => (
          <span key={`${town}-${i}`} className="display flex items-center gap-10 whitespace-nowrap text-[clamp(1.6rem,3vw,2.4rem)] text-fg/80">
            {town}
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber">
              <path d="M2 16 L12 7 L22 16" stroke="currentColor" strokeWidth="3" fill="none" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  )
}

export function ServiceArea() {
  const [zip, setZip] = useState('')
  const [result, setResult] = useState<'in' | 'out' | 'invalid' | null>(null)

  function check(event: FormEvent) {
    event.preventDefault()
    const value = zip.trim()
    if (!/^\d{5}$/.test(value)) setResult('invalid')
    else setResult(site.serviceArea.zips.includes(value) ? 'in' : 'out')
  }

  return (
    <section id="service-area" aria-labelledby="area-title" className="bg-night">
      <div className="pt-20 md:pt-28">
        <TownTicker />
      </div>
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.1fr_1fr] md:items-start md:pb-28">
        <Reveal>
          <h2 id="area-title" className="display m-0 text-[clamp(2.1rem,4.6vw,3.4rem)] text-fg">
            {site.serviceArea.title}
          </h2>
          <p className="measure mt-4 text-[1.08rem] text-dim">{site.serviceArea.text}</p>
          <ul className="mt-8 flex list-none flex-wrap gap-2 p-0">
            {site.serviceArea.towns.map((town) => (
              <li key={town} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[0.95rem] text-fg/90">
                {town}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <form onSubmit={check} className="card-raised p-7" noValidate>
            <h3 className="heading m-0 text-[1.35rem] text-fg">Is your home in our area?</h3>
            <p className="mt-2 text-dim">Enter the property’s ZIP code.</p>
            <div className="mt-5 flex gap-2">
              <label className="field flex-1" htmlFor="zip-check">
                <span className="sr-only">ZIP code</span>
                <input
                  id="zip-check"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={5}
                  placeholder="75024"
                  value={zip}
                  onChange={(e) => {
                    setZip(e.target.value.replace(/\D/g, ''))
                    setResult(null)
                  }}
                />
              </label>
              <button type="submit" className="btn btn-primary">
                Check
              </button>
            </div>
            <p role="status" aria-live="polite" className="mb-0 mt-4 min-h-[1.6em] font-semibold">
              {result === 'in' && <span className="text-amber">Yes — {zip} is in our regular service area.</span>}
              {result === 'out' && (
                <span className="text-fg">
                  {zip} is outside our usual area.{' '}
                  <a href="#estimate" className="text-amber">
                    Send an estimate request
                  </a>{' '}
                  and we’ll tell you if we can travel.
                </span>
              )}
              {result === 'invalid' && <span className="text-fg">Enter a 5-digit ZIP code.</span>}
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  )
}

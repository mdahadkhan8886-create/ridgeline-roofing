import { useState } from 'react'
import type { FormEvent } from 'react'
import { site } from '#/config/site'

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
    <section id="service-area" aria-labelledby="area-title" className="bg-paper">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-18 sm:px-6 md:grid-cols-[1fr_1.1fr] md:py-24">
        <div>
          <h2 id="area-title" className="display m-0 text-[clamp(2rem,4.5vw,3.2rem)]">
            {site.serviceArea.title}
          </h2>
          <p className="measure mt-4 text-[1.08rem] text-muted">{site.serviceArea.text}</p>

          <form onSubmit={check} className="mt-8 max-w-md" noValidate>
            <label htmlFor="zip-check" className="field">
              Check your ZIP code
            </label>
            <div className="mt-2 flex gap-2">
              <div className="field flex-1">
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
              </div>
              <button type="submit" className="btn btn-primary">
                Check
              </button>
            </div>
            <p role="status" aria-live="polite" className="mt-3 min-h-[1.6em] font-semibold">
              {result === 'in' && `Yes — ${zip} is in our regular service area.`}
              {result === 'out' && (
                <>
                  {zip} is outside our usual area.{' '}
                  <a href="#estimate" className="text-ink">
                    Send an estimate request
                  </a>{' '}
                  and we’ll tell you if we can travel.
                </>
              )}
              {result === 'invalid' && 'Enter a 5-digit ZIP code.'}
            </p>
          </form>
        </div>

        <div>
          <h3 className="heading m-0 text-[1.15rem] text-muted">Towns we cover every week</h3>
          <ul className="mt-5 grid list-none grid-cols-2 gap-x-6 p-0 sm:grid-cols-3">
            {site.serviceArea.towns.map((town) => (
              <li key={town} className="heading border-b border-rule py-3 text-[1.25rem]">
                {town}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatUSD, site } from '#/config/site'
import { track, visitId } from '#/lib/track'
import { Reveal } from '#/components/Reveal'

const calc = site.calculator

export interface EstimatePrefill {
  service?: string
  roofType?: string
  message?: string
}

/** Lets other sections pre-fill the estimate form, then scrolls to it. */
export function prefillEstimate(detail: EstimatePrefill) {
  window.dispatchEvent(new CustomEvent<EstimatePrefill>('rr:prefill-estimate', { detail }))
  document.getElementById('estimate')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step
}

/** Smoothly animates a number toward its target. */
function useTween(target: number, duration = 450) {
  const [value, setValue] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }
    const start = performance.now()
    const begin = from.current
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = begin + (target - begin) * eased
      setValue(next)
      from.current = next
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

function PitchPreview({ rise }: { rise: number }) {
  // Base 240 wide, so half-run is 120; height follows the real rise/12 ratio.
  const height = (120 * rise) / 12
  return (
    <svg viewBox="0 0 280 170" className="h-auto w-full" aria-hidden="true">
      <line x1="10" y1="160" x2="270" y2="160" stroke="var(--rr-line)" strokeWidth="2" />
      <g style={{ transform: `scaleY(${height / 144})`, transformOrigin: '140px 150px', transition: 'transform 450ms cubic-bezier(.2,.7,.2,1)' }}>
        <polygon points="20,150 140,6 260,150" fill="color-mix(in oklab, var(--rr-accent) 12%, transparent)" />
        <polyline points="20,150 140,6 260,150" fill="none" stroke="url(#calcStroke)" strokeWidth="6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </g>
      <rect x="50" y="150" width="180" height="10" fill="var(--rr-raised)" />
      <defs>
        <linearGradient id="calcStroke" x1="0" x2="1">
          <stop offset="0" stopColor="var(--rr-accent)" />
          <stop offset="1" stopColor="var(--rr-accent2)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string; hint?: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2 p-0 text-[0.92rem] font-semibold text-fg">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`rounded-lg border px-3.5 py-2 text-left text-[0.95rem] font-semibold transition-colors ${
                active ? 'border-amber bg-amber/15 text-fg' : 'border-line bg-night/40 text-dim hover:border-dim hover:text-fg'
              }`}
            >
              {o.label}
              {o.hint && <span className="block text-xs font-normal text-dim">{o.hint}</span>}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function Calculator() {
  const [footprint, setFootprint] = useState(calc.footprint.default)
  const [pitchLabel, setPitchLabel] = useState(calc.pitches[1].label)
  const [materialId, setMaterialId] = useState(calc.materials[0].id)
  const [layers, setLayers] = useState(1)

  const pitch = calc.pitches.find((p) => p.label === pitchLabel) ?? calc.pitches[1]
  const material = calc.materials.find((m) => m.id === materialId) ?? calc.materials[0]

  const result = useMemo(() => {
    const squares = (footprint * pitch.factor * calc.wasteFactor) / 100
    const perSquare = material.perSquare + calc.tearOffPerSquare * layers + (pitch.rise > 8 ? calc.steepPerSquare : 0)
    const mid = Math.max(calc.minimumJob, squares * perSquare)
    return {
      squares: Math.round(squares * 10) / 10,
      low: roundTo(mid * (1 - calc.spread), 100),
      high: roundTo(mid * (1 + calc.spread), 100),
      mid: roundTo(mid, 100),
    }
  }, [footprint, pitch, material, layers])

  const low = useTween(result.low)
  const high = useTween(result.high)

  function getQuote() {
    track('quote_calculated', {
      event_id: `${visitId()}-${result.mid}`,
      value: result.mid,
      currency: 'USD',
      squares: result.squares,
      pitch: pitch.label,
      material: material.name,
      layers,
    })
    prefillEstimate({
      service: 'replacement',
      roofType: material.id === 'metal' ? 'Metal' : 'Asphalt shingle',
      message: `From the cost calculator: about ${result.squares} squares, ${pitch.label} pitch, ${material.name}, ${layers} layer${layers > 1 ? 's' : ''} to remove. Ballpark ${formatUSD(result.low)}–${formatUSD(result.high)}.`,
    })
  }

  return (
    <section id="calculator" aria-labelledby="calc-title" className="relative overflow-hidden border-t border-line bg-surface">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-amber/5 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <Reveal className="max-w-2xl">
          <h2 id="calc-title" className="display m-0 text-[clamp(2.1rem,4.6vw,3.4rem)] text-fg">
            {calc.title}
          </h2>
          <p className="mt-4 text-[1.08rem] text-dim">{calc.text}</p>
        </Reveal>

        <Reveal delay={120} className="mt-12 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="card grid gap-7 p-6 sm:p-8">
            <div>
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor="calc-footprint" className="text-[0.92rem] font-semibold text-fg">
                  Home footprint
                </label>
                <output htmlFor="calc-footprint" className="heading text-[1.3rem] text-amber">
                  {footprint.toLocaleString('en-US')} sq ft
                </output>
              </div>
              <input
                id="calc-footprint"
                type="range"
                min={calc.footprint.min}
                max={calc.footprint.max}
                step={calc.footprint.step}
                value={footprint}
                onChange={(e) => setFootprint(Number(e.target.value))}
                className="mt-3 w-full accent-[var(--rr-accent)]"
              />
              <div className="mt-1 flex justify-between text-xs text-dim">
                <span>{calc.footprint.min.toLocaleString('en-US')}</span>
                <span>{calc.footprint.max.toLocaleString('en-US')}</span>
              </div>
            </div>

            <div className="grid items-center gap-5 sm:grid-cols-[1fr_9rem]">
              <Segmented
                label="Roof pitch"
                value={pitchLabel}
                onChange={setPitchLabel}
                options={calc.pitches.map((p) => ({ value: p.label, label: p.label, hint: p.note }))}
              />
              <div className="hidden sm:block">
                <PitchPreview rise={pitch.rise} />
              </div>
            </div>

            <Segmented
              label="Material"
              value={materialId}
              onChange={setMaterialId}
              options={calc.materials.map((m) => ({ value: m.id, label: m.name, hint: m.note }))}
            />

            <Segmented
              label="Old layers to tear off"
              value={layers}
              onChange={setLayers}
              options={[
                { value: 1, label: '1 layer' },
                { value: 2, label: '2 layers' },
              ]}
            />
          </div>

          <div className="glow-edge flex flex-col rounded-[18px] p-6 sm:p-8">
            <p className="m-0 text-[0.92rem] font-semibold text-dim">Estimated replacement cost</p>
            <p className="m-0 mt-3" aria-live="polite">
              <span className="display text-glow block text-[clamp(2.2rem,5vw,3.2rem)]">
                {formatUSD(roundTo(low, 100))}
                <span className="text-dim"> – </span>
                {formatUSD(roundTo(high, 100))}
              </span>
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 text-[0.95rem]">
              <div>
                <dt className="text-dim">Roof area</dt>
                <dd className="m-0 font-semibold text-fg">{result.squares} squares</dd>
              </div>
              <div>
                <dt className="text-dim">Pitch</dt>
                <dd className="m-0 font-semibold text-fg">{pitch.label}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-dim">Material</dt>
                <dd className="m-0 font-semibold text-fg">{material.name}</dd>
              </div>
            </dl>
            <div className="mt-auto grid gap-3 pt-8">
              <button type="button" onClick={getQuote} className="btn btn-primary w-full text-[1.05rem]">
                Get my exact quote
              </button>
              <Link to="/deposit" className="btn btn-ghost w-full">
                Hold a date with a {formatUSD(site.plans.deposit.price)} deposit
              </Link>
            </div>
            <p className="mb-0 mt-4 text-xs text-dim">{calc.note}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

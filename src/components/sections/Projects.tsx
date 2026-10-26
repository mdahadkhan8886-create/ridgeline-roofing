import { useEffect, useId, useState } from 'react'
import { site } from '#/config/site'
import { track, visitId } from '#/lib/track'
import { Reveal } from '#/components/Reveal'

type Project = (typeof site.projects)[number]

/** Deterministic pseudo-random numbers, so each project's "damage" is stable. */
function seeded(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

/** Illustrated house for the slider when no photos are configured. */
function RoofScene({ project, after }: { project: Project; after: boolean }) {
  const uid = useId().replace(/:/g, '')
  const rand = seeded(project.id)
  const metal = /metal/i.test(project.title + project.scope)
  const roof = '110,238 320,104 530,238'
  const missing = Array.from({ length: 9 }, () => ({ x: 170 + rand() * 300, y: 150 + rand() * 75, w: 18 + rand() * 22 }))
  const tarp = !project.id.includes('leak')
  return (
    <svg viewBox="0 0 640 400" className="block h-full w-full" role="img" aria-label={`${after ? 'After' : 'Before'}: ${project.title}`}>
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={after ? '#14212b' : '#1b2328'} />
          <stop offset="1" stopColor={after ? '#0a0f13' : '#0e1316'} />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="0.5" cy="0.75" r="0.6">
          <stop offset="0" stopColor="var(--rr-accent2)" stopOpacity={after ? 0.35 : 0} />
          <stop offset="1" stopColor="var(--rr-accent2)" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`roof-${uid}`}>
          <polygon points={roof} />
        </clipPath>
      </defs>
      <rect width="640" height="400" fill={`url(#sky-${uid})`} />
      <rect width="640" height="400" fill={`url(#glow-${uid})`} />
      {!after &&
        Array.from({ length: 26 }, (_, i) => (
          <line key={i} x1={i * 26} y1="0" x2={i * 26 - 40} y2="400" stroke="#8fb3c7" strokeOpacity="0.08" strokeWidth="1.5" />
        ))}

      {/* house body */}
      <rect x="150" y="232" width="340" height="138" fill={after ? '#1d2830' : '#192125'} stroke="#2c3a43" strokeWidth="2" />
      {[190, 400].map((x) => (
        <rect key={x} x={x} y="268" width="56" height="44" fill={after ? 'var(--rr-accent)' : '#253037'} opacity={after ? 0.85 : 1} stroke="#2c3a43" strokeWidth="2" />
      ))}
      <rect x="296" y="292" width="48" height="78" fill="#121a1f" stroke="#2c3a43" strokeWidth="2" />

      {/* roof */}
      <polygon points={roof} fill={after ? (metal ? '#2a3a44' : '#2b3338') : '#3a4146'} />
      <g clipPath={`url(#roof-${uid})`}>
        {metal && after
          ? Array.from({ length: 22 }, (_, i) => <line key={i} x1={120 + i * 19} y1="100" x2={120 + i * 19} y2="240" stroke="#9fb4c0" strokeOpacity="0.35" strokeWidth="2" />)
          : Array.from({ length: 11 }, (_, i) => (
              <line key={i} x1="100" y1={128 + i * 11} x2="540" y2={128 + i * 11} stroke={after ? '#11171a' : '#262c30'} strokeWidth="2" />
            ))}
        {!after &&
          missing.map((m, i) => <rect key={i} x={m.x} y={m.y} width={m.w} height="9" fill="#151a1d" transform={`rotate(${(i % 3) - 1} ${m.x} ${m.y})`} />)}
        {!after && tarp && <polygon points="250,150 360,140 382,198 262,212" fill="#2f74ad" opacity="0.85" />}
      </g>
      <polyline points={roof} fill="none" stroke={after ? 'var(--rr-accent)' : '#59636a'} strokeWidth={after ? 5 : 4} strokeLinejoin="round" />

      {/* gutter */}
      {after ? (
        <line x1="112" y1="240" x2="528" y2="240" stroke="#c9d3d9" strokeWidth="4" />
      ) : (
        <path d="M112 240 Q 320 262 528 240" stroke="#59636a" strokeWidth="4" fill="none" />
      )}
      <line x1="40" y1="371" x2="600" y2="371" stroke="#2c3a43" strokeWidth="2" />
    </svg>
  )
}

function BeforeAfter({ project }: { project: Project }) {
  const [pos, setPos] = useState(50)
  const [moved, setMoved] = useState(false)

  useEffect(() => {
    setPos(50)
    setMoved(false)
  }, [project.id])

  const before = project.beforeImage ? (
    <img src={project.beforeImage} alt={`Before: ${project.title}`} className="h-full w-full object-cover" />
  ) : (
    <RoofScene project={project} after={false} />
  )
  const after = project.afterImage ? (
    <img src={project.afterImage} alt={`After: ${project.title}`} className="h-full w-full object-cover" />
  ) : (
    <RoofScene project={project} after />
  )

  return (
    <div className="relative aspect-[16/10] w-full select-none overflow-hidden rounded-2xl border border-line bg-night">
      <div className="absolute inset-0">{after}</div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {before}
      </div>
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-night/80 px-3 py-1 text-xs font-bold text-fg backdrop-blur">Before</span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-amber px-3 py-1 text-xs font-bold text-on-amber">After</span>
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }} aria-hidden="true">
        <div className="absolute inset-y-0 -ml-px w-0.5 bg-amber shadow-[0_0_20px_var(--rr-accent)]" />
        <div className={`absolute top-1/2 -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full bg-amber text-on-amber shadow-lg ${moved ? '' : 'animate-pulse'}`}>
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path d="M9 6l-5 6 5 6M15 6l5 6-5 6" stroke="currentColor" strokeWidth="2.4" fill="none" />
          </svg>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        aria-label={`Compare before and after: ${project.title}`}
        onChange={(e) => {
          setPos(Number(e.target.value))
          if (!moved) {
            setMoved(true)
            track('project_viewed', { project: project.id, town: project.town, event_id: `${project.id}-${visitId()}` })
          }
        }}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  )
}

export function Projects() {
  const [active, setActive] = useState(0)
  const project = site.projects[active]
  if (!project) return null

  return (
    <section id="projects" aria-labelledby="projects-title" className="bg-night">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <Reveal className="grid gap-4 md:grid-cols-[1.2fr_1fr] md:items-end">
          <h2 id="projects-title" className="display m-0 text-[clamp(2.1rem,4.6vw,3.4rem)] text-fg">
            Recent jobs, before and after
          </h2>
          <p className="m-0 text-[1.05rem] text-dim md:text-right">Drag the slider to see the difference.</p>
        </Reveal>

        <Reveal delay={120} className="mt-12 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <BeforeAfter project={project} />
          <div className="flex flex-col gap-3" role="tablist" aria-label="Projects">
            {site.projects.map((p, i) => {
              const selected = i === active
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(i)}
                  className={`rounded-xl border p-5 text-left transition-colors ${
                    selected ? 'border-amber/70 bg-amber/10' : 'border-line bg-surface hover:border-dim'
                  }`}
                >
                  <span className="flex items-center justify-between gap-3 text-sm text-dim">
                    <span>{p.town}</span>
                    <span>{p.duration}</span>
                  </span>
                  <span className="heading mt-1 block text-[1.15rem] text-fg">{p.title}</span>
                  <span className="mt-1 block text-[0.95rem] text-dim">{p.scope}</span>
                </button>
              )
            })}
            {!site.projects.some((p) => p.beforeImage || p.afterImage) && (
              <p className="m-0 mt-1 text-sm text-dim">Sample jobs, illustrated. Add your own before and after photos in the site config.</p>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

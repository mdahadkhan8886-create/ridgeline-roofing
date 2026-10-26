import { useEffect, useState } from 'react'
import { onTrack } from '#/lib/track'
import type { TrackedEvent } from '#/lib/track'

/**
 * On-screen log of Whop pixel events. Turn it on by adding `?debug=pixel` to
 * any URL (it stays on for the rest of the visit). Handy for demo recordings.
 */
export function PixelDebug() {
  const [enabled, setEnabled] = useState(false)
  const [events, setEvents] = useState<TrackedEvent[]>([])
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    let on = false
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('debug') === 'pixel'
      if (fromUrl) window.sessionStorage.setItem('rr_pixel_debug', '1')
      on = fromUrl || window.sessionStorage.getItem('rr_pixel_debug') === '1'
    } catch {
      on = new URLSearchParams(window.location.search).get('debug') === 'pixel'
    }
    setEnabled(on)
    if (!on) return
    return onTrack((event) => setEvents((list) => [event, ...list].slice(0, 30)))
  }, [])

  if (!enabled) return null

  return (
    <aside
      aria-label="Pixel events"
      className="fixed bottom-3 left-3 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-md border border-ink/20 bg-white text-sm text-ink shadow-lg"
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-t-md bg-ink px-3 py-2 text-left font-semibold text-white"
      >
        <span>
          Whop pixel events ({events.length})
          <span className="ml-2 font-normal text-white/70">
            {typeof window !== 'undefined' && window.whop ? 'pixel live' : 'pixel not loaded'}
          </span>
        </span>
        <span aria-hidden="true">{collapsed ? '+' : '−'}</span>
      </button>
      {!collapsed && (
        <ol className="m-0 max-h-72 list-none overflow-auto p-0">
          {events.length === 0 && <li className="px-3 py-3 text-muted">No custom events yet. Scroll the services or submit a form.</li>}
          {events.map((event) => (
            <li key={`${event.at}-${event.name}`} className="border-t border-rule/60 px-3 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <strong>{event.name}</strong>
                <time className="text-xs text-muted">{new Date(event.at).toLocaleTimeString()}</time>
              </div>
              <code className="block break-all text-xs text-muted">{JSON.stringify(event.props)}</code>
              {!event.delivered && <span className="text-xs text-muted">Logged only (window.whop not present)</span>}
            </li>
          ))}
        </ol>
      )}
    </aside>
  )
}

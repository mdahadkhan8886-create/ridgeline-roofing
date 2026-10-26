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
      className="fixed bottom-24 left-3 z-50 md:bottom-3 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-line bg-surface text-sm text-fg shadow-2xl shadow-black"
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between gap-2 bg-raised px-3 py-2 text-left font-semibold text-fg"
      >
        <span>
          Whop pixel events ({events.length})
          <span className="ml-2 font-normal text-amber">
            {typeof window !== 'undefined' && window.whop ? 'pixel live' : 'pixel not loaded'}
          </span>
        </span>
        <span aria-hidden="true">{collapsed ? '+' : '−'}</span>
      </button>
      {!collapsed && (
        <ol className="m-0 max-h-72 list-none overflow-auto p-0">
          {events.length === 0 && <li className="px-3 py-3 text-dim">No custom events yet. Scroll the services or submit a form.</li>}
          {events.map((event) => (
            <li key={`${event.at}-${event.name}`} className="border-t border-line px-3 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <strong className="text-amber">{event.name}</strong>
                <time className="text-xs text-dim">{new Date(event.at).toLocaleTimeString()}</time>
              </div>
              <code className="block break-all text-xs text-dim">{JSON.stringify(event.props)}</code>
              {!event.delivered && <span className="text-xs text-dim">Logged only (window.whop not present)</span>}
            </li>
          ))}
        </ol>
      )}
    </aside>
  )
}

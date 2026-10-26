/**
 * Whop pixel helper.
 *
 * On whop.site, Whop injects the pixel and `window.whop` exists before app code
 * runs. Page views and checkout events are tracked automatically; these are the
 * custom events this template adds.
 *
 * Add `?debug=pixel` to any URL to see every event on screen as it fires.
 */

export type TrackEvent =
  | 'estimate_requested'
  | 'service_viewed'
  | 'deposit_started'
  | 'lead'
  | 'view_content'

export type TrackProps = Record<string, string | number | undefined>

interface WhopPixel {
  track: (event: string, props?: Record<string, string | number>) => void
}

declare global {
  interface Window {
    whop?: WhopPixel
  }
}

export interface TrackedEvent {
  name: string
  props: Record<string, string | number>
  at: number
  delivered: boolean
}

const listeners = new Set<(event: TrackedEvent) => void>()
const sent = new Set<string>()

export function track(name: TrackEvent, props: TrackProps = {}): void {
  if (typeof window === 'undefined') return

  const clean: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== '') clean[key] = value
  }

  // Whop counts each name + event_id pair once; skip obvious repeats locally too.
  if (clean.event_id !== undefined) {
    const dedupeKey = `${name}:${clean.event_id}`
    if (sent.has(dedupeKey)) return
    sent.add(dedupeKey)
  }

  let delivered = false
  try {
    if (window.whop && typeof window.whop.track === 'function') {
      window.whop.track(name, clean)
      delivered = true
    }
  } catch (error) {
    console.warn('[pixel] whop.track failed', error)
  }

  const event: TrackedEvent = { name, props: clean, at: Date.now(), delivered }
  if (!delivered) console.info('[pixel] (not on whop.site — logged only)', name, clean)
  listeners.forEach((listener) => listener(event))
}

export function onTrack(listener: (event: TrackedEvent) => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** A stable per-tab id, so "viewed" events count once per visit. */
export function visitId(): string {
  if (typeof window === 'undefined') return 'ssr'
  try {
    const existing = window.sessionStorage.getItem('rr_visit')
    if (existing) return existing
    const id = randomId('v')
    window.sessionStorage.setItem('rr_visit', id)
    return id
  } catch {
    return 'novisit'
  }
}

export function randomId(prefix: string): string {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

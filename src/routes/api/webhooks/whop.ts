import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/config/site'
import { json } from '#/lib/whop-api'

/**
 * Whop webhooks (Standard Webhooks): Whop signs `${webhook-id}.${webhook-timestamp}.${body}`
 * with HMAC-SHA256 using the webhook's `ws_…` secret and sends `v1,<base64>`
 * in the `webhook-signature` header.
 *
 * Set it up once with `node scripts/setup-whop.mjs`, which registers this URL
 * and stores the secret as the WHOP_WEBHOOK_SECRET app secret.
 *
 * The handler confirms every step of the roofing job — card saved, deposit
 * paid, final invoice paid — and logs it (read with `whop apps logs`). Hook
 * your CRM, job scheduler or crew notifications in where marked.
 */

const TOLERANCE_SECONDS = 5 * 60
const seen = new Set<string>()

function b64(bytes: ArrayBuffer): string {
  let binary = ''
  new Uint8Array(bytes).forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

function keyCandidates(secret: string): Uint8Array<ArrayBuffer>[] {
  const keys: Uint8Array<ArrayBuffer>[] = [new TextEncoder().encode(secret)]
  // Standard Webhooks style "whsec_<base64>" secrets carry the key in base64.
  const raw = secret.replace(/^whsec_/, '')
  if (raw !== secret) {
    try {
      keys.push(Uint8Array.from(atob(raw), (c) => c.charCodeAt(0)))
    } catch {
      /* not base64 */
    }
  }
  return keys
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function verify(secret: string, id: string, timestamp: string, body: string, header: string): Promise<boolean> {
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) return false
  const signed = new TextEncoder().encode(`${id}.${timestamp}.${body}`)
  const given = header
    .split(' ')
    .map((part) => part.trim())
    .filter((part) => part.startsWith('v1,'))
    .map((part) => part.slice(3))
  for (const keyBytes of keyCandidates(secret)) {
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const expected = b64(await crypto.subtle.sign('HMAC', key, signed))
    if (given.some((sig) => constantTimeEqual(sig, expected))) return true
  }
  return false
}

interface WhopEvent {
  id?: string
  type?: string
  data?: Record<string, unknown> & {
    id?: string
    plan?: { id?: string } | null
    metadata?: Record<string, unknown> | null
    total?: number
    email_address?: string
  }
}

function describe(event: WhopEvent): string {
  const d = event.data ?? {}
  const planId = d.plan?.id
  const job = typeof d.metadata?.job_ref === 'string' ? ` (job ${d.metadata.job_ref})` : ''
  switch (event.type) {
    case 'payment.succeeded':
      if (planId === site.plans.deposit.whopPlanId) return `Deposit paid${job} — schedule the crew and order materials`
      if (planId === site.plans.inspection.whopPlanId) return 'Inspection fee paid — call to book the inspection'
      if (planId === site.plans.flatRate.whopPlanId) return `${site.plans.flatRate.name} paid — add to the route`
      return 'Payment succeeded'
    case 'payment.failed':
      return `Payment failed${job} — follow up with the customer`
    case 'setup_intent.succeeded':
      return `Card saved on file${job} — final balance can be billed later`
    case 'invoice.created':
      return `Final invoice created for ${d.email_address ?? 'customer'}`
    case 'invoice.paid':
      return `Final invoice paid by ${d.email_address ?? 'customer'} — job closed`
    case 'invoice.past_due':
      return `Final invoice past due for ${d.email_address ?? 'customer'} — send a reminder`
    default:
      return event.type ?? 'unknown event'
  }
}

export const Route = createFileRoute('/api/webhooks/whop')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.WHOP_WEBHOOK_SECRET
        if (!secret) return json({ error: 'WHOP_WEBHOOK_SECRET is not set.' }, 503)

        const body = await request.text()
        const id = request.headers.get('webhook-id') ?? ''
        const timestamp = request.headers.get('webhook-timestamp') ?? ''
        const signature = request.headers.get('webhook-signature') ?? ''
        if (!id || !(await verify(secret, id, timestamp, body, signature))) {
          console.warn('[webhook] rejected: bad or missing signature', id)
          return json({ error: 'Invalid signature.' }, 401)
        }

        // Whop delivers at least once; skip repeats this worker has already seen.
        if (seen.has(id)) return json({ ok: true, duplicate: true })
        seen.add(id)
        if (seen.size > 500) seen.clear()

        let event: WhopEvent
        try {
          event = JSON.parse(body) as WhopEvent
        } catch {
          return json({ error: 'Invalid JSON.' }, 400)
        }

        console.log('[webhook]', event.type, event.data?.id ?? '', '—', describe(event))
        // ↳ Connect your CRM, scheduler or crew notifications here.

        return json({ ok: true })
      },
    },
  },
})

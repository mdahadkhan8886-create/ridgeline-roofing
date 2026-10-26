import { track } from '#/lib/track'

/** Sends the estimate request and the Whop one-time code to /api/lead, which creates the Whop lead. */
export async function submitLead(input: {
  form: Record<string, string>
  page: string
  code: string
  codeVerifier: string
  redirectUri: string
}): Promise<{ leadId: string | null }> {
  const response = await fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input.form,
      page: input.page,
      code: input.code,
      codeVerifier: input.codeVerifier,
      redirectUri: input.redirectUri,
    }),
  })
  const result = (await response.json().catch(() => ({}))) as { leadId?: string | null; error?: string }
  if (!response.ok) throw new Error(result.error || 'We couldn’t send your request. Please call us instead.')
  return { leadId: result.leadId ?? null }
}

/** estimate_requested (custom) + lead (standard), once per Whop lead. */
export function trackLead(form: Record<string, string>, leadId: string | null) {
  const eventId = leadId ?? undefined
  track('estimate_requested', {
    event_id: eventId,
    service: form.service,
    roof_type: form.roofType,
    timeline: form.timeline,
    zip: form.zip,
  })
  track('lead', { event_id: eventId, name: form.name, email: form.email, phone: form.phone })
}

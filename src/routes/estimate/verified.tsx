import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { site } from '#/config/site'
import { submitLead, trackLead } from '#/lib/submit-lead'
import { clearDraft, readDraft, reportToOpener, verifiedRedirectUri } from '#/lib/whop-oauth'

type VerifiedSearch = { code?: string; state?: string; error?: string; error_description?: string }

export const Route = createFileRoute('/estimate/verified')({
  validateSearch: (search: Record<string, unknown>): VerifiedSearch => {
    const out: VerifiedSearch = {}
    for (const key of ['code', 'state', 'error', 'error_description'] as const) {
      if (typeof search[key] === 'string') out[key] = search[key] as string
    }
    return out
  },
  head: () => ({ meta: [{ title: `Estimate request | ${site.company.name}` }, { name: 'robots', content: 'noindex' }] }),
  component: VerifiedPage,
})

type Face = { kind: 'sending' } | { kind: 'handed-off' } | { kind: 'sent'; firstName: string } | { kind: 'error'; message: string }

function VerifiedPage() {
  const search = Route.useSearch()
  const [face, setFace] = useState<Face>({ kind: 'sending' })
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    // Pop-up flow: hand the code to the estimate form that opened this window.
    if (search.state && reportToOpener({ state: search.state, code: search.code, error: search.error })) {
      setFace({ kind: 'handed-off' })
      window.setTimeout(() => window.close(), 400)
      return
    }

    const draft = readDraft()
    if (search.error) {
      setFace({ kind: 'error', message: 'Email confirmation was cancelled, so your request wasn’t sent. Your answers are saved — try again.' })
      return
    }
    if (!draft || !search.code || search.state !== draft.state) {
      setFace({ kind: 'error', message: 'This confirmation link has expired. Please fill in the estimate form again.' })
      return
    }

    ;(async () => {
      try {
        const { leadId } = await submitLead({
          form: draft.form,
          page: draft.page,
          code: search.code!,
          codeVerifier: draft.verifier,
          redirectUri: verifiedRedirectUri(),
        })
        trackLead(draft.form, leadId)
        clearDraft()
        // Drop the one-time code from the address bar.
        window.history.replaceState(null, '', '/estimate/verified')
        setFace({ kind: 'sent', firstName: (draft.form.name ?? '').trim().split(' ')[0] || 'there' })
      } catch (error) {
        setFace({ kind: 'error', message: error instanceof Error ? error.message : 'Something went wrong.' })
      }
    })()
  }, [search.code, search.error, search.state])

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
      {face.kind === 'handed-off' && (
        <div role="status">
          <h1 className="display text-[clamp(2rem,5vw,3rem)] text-fg">Email confirmed</h1>
          <p className="mt-4 text-dim">You can close this window. Your request is being sent from the page you started on.</p>
        </div>
      )}

      {face.kind === 'sending' && (
        <div role="status">
          <h1 className="display text-[clamp(2rem,5vw,3rem)]">Sending your request…</h1>
          <p className="mt-4 text-dim">Your email is confirmed. This takes a second.</p>
        </div>
      )}

      {face.kind === 'sent' && (
        <div role="status">
          <h1 className="display text-[clamp(2.2rem,5vw,3.4rem)]">Thanks, {face.firstName}. Your request is in.</h1>
          <p className="measure mt-5 text-[1.12rem] text-dim">
            We’ll reply within one business day with next steps and, for most repairs, a ballpark price. If water is coming in right
            now, call our emergency line at{' '}
            <a className="font-bold text-fg" href={`tel:${site.company.emergencyLine.replace(/[^\d+]/g, '')}`}>
              {site.company.emergencyLine}
            </a>
            .
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/book/$planKey" params={{ planKey: 'inspection' }} className="btn btn-primary">
              Book a {`$${site.plans.inspection.price}`} inspection now
            </Link>
            <Link to="/" className="btn btn-ghost">
              Back to the homepage
            </Link>
          </div>
        </div>
      )}

      {face.kind === 'error' && (
        <div role="alert">
          <h1 className="display text-[clamp(2rem,5vw,3rem)]">Your request wasn’t sent</h1>
          <p className="measure mt-5 text-[1.1rem] text-dim">{face.message}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/#estimate" className="btn btn-primary">
              Back to the estimate form
            </a>
            <a href={site.company.phoneHref} className="btn btn-ghost">
              Call {site.company.phone}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

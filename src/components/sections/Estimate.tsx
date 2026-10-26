import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { site } from '#/config/site'
import { openVerifyPopup, readDraft, startEmailVerification, verifyInPopup } from '#/lib/whop-oauth'
import { submitLead, trackLead } from '#/lib/submit-lead'
import { Reveal } from '#/components/Reveal'
import type { EstimatePrefill } from '#/components/sections/Calculator'

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'waiting' }
  | { kind: 'sent'; firstName: string }
  | { kind: 'error'; message: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function EstimateForm() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  // Restores what the visitor typed if they come back from the Whop step, and
  // takes values handed over by the cost calculator.
  const [saved, setSaved] = useState<Record<string, string>>({})
  const [formKey, setFormKey] = useState(0)
  const [appId, setAppId] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const draft = readDraft()
    if (draft) {
      setSaved(draft.form)
      setFormKey((k) => k + 1)
    }
    fetch('/api/public-config')
      .then((r) => r.json())
      .then((config: { appId?: string | null }) => setAppId(config.appId ?? null))
      .catch(() => setAppId(null))

    const onPrefill = (event: Event) => {
      const detail = (event as CustomEvent<EstimatePrefill>).detail ?? {}
      const current = formRef.current
        ? (Object.fromEntries(new FormData(formRef.current).entries()) as Record<string, string>)
        : {}
      setSaved({ ...current, ...detail } as Record<string, string>)
      setFormKey((k) => k + 1)
      setStatus({ kind: 'idle' })
    }
    window.addEventListener('rr:prefill-estimate', onPrefill)
    return () => window.removeEventListener('rr:prefill-estimate', onPrefill)
  }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>
    if (data.company_website) return
    if (!data.name?.trim()) return setStatus({ kind: 'error', message: 'Add your name so we know who to ask for.' })
    if (!EMAIL.test(data.email?.trim() ?? '')) return setStatus({ kind: 'error', message: 'Add a valid email address.' })
    if (!/^\d{5}$/.test(data.zip?.trim() ?? '')) return setStatus({ kind: 'error', message: 'Add the 5-digit ZIP code of the property.' })

    // Open the pop-up now, inside the click, so the browser allows it.
    const popup = openVerifyPopup()
    setStatus({ kind: popup ? 'waiting' : 'sending' })

    ;(async () => {
      try {
        const id =
          appId ??
          ((await fetch('/api/public-config').then((r) => r.json())) as { appId?: string | null }).appId ??
          null
        if (!id) throw new Error('Estimate requests are unavailable right now. Please call us.')

        if (!popup) {
          // Pop-ups blocked: send the whole tab to Whop; /estimate/verified finishes up.
          await startEmailVerification(id, data)
          return
        }

        const controller = new AbortController()
        abortRef.current = controller
        const { code, verifier, redirectUri, draft } = await verifyInPopup(popup, id, data, controller.signal)
        setStatus({ kind: 'sending' })
        const { leadId } = await submitLead({ form: data, page: draft.page, code, codeVerifier: verifier, redirectUri })
        trackLead(data, leadId)
        try {
          window.sessionStorage.removeItem('rr_estimate_draft')
        } catch {
          /* ignore */
        }
        setSaved({})
        setStatus({ kind: 'sent', firstName: data.name.trim().split(' ')[0] || 'there' })
      } catch (error) {
        try {
          popup?.close()
        } catch {
          /* ignore */
        }
        setSaved(data)
        setFormKey((k) => k + 1)
        setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Something went wrong.' })
      } finally {
        abortRef.current = null
      }
    })()
  }

  if (status.kind === 'sent') {
    return (
      <div role="status" className="card-raised p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber text-on-amber shadow-[0_0_30px_-6px_var(--rr-accent2)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.8" fill="none" />
          </svg>
        </span>
        <h3 className="heading m-0 mt-5 text-[1.7rem] text-fg">Thanks, {status.firstName}. Your request is in.</h3>
        <p className="mt-3 text-dim">
          It landed in our Whop leads with your verified email. We’ll reply within one business day. Water coming in right now? Call{' '}
          <a className="font-bold text-fg hover:text-amber" href={`tel:${site.company.emergencyLine.replace(/[^\d+]/g, '')}`}>
            {site.company.emergencyLine}
          </a>
          .
        </p>
        <button type="button" className="btn btn-ghost mt-6" onClick={() => setStatus({ kind: 'idle' })}>
          Send another request
        </button>
      </div>
    )
  }

  const sending = status.kind === 'sending' || status.kind === 'waiting'

  return (
    <form
      key={formKey}
      ref={formRef}
      onSubmit={submit}
      noValidate
      className="card-raised grid gap-5 p-6 sm:p-8"
      aria-describedby="estimate-help"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field">
          Full name
          <input name="name" required autoComplete="name" defaultValue={saved.name} />
        </label>
        <label className="field">
          Phone
          <input name="phone" type="tel" autoComplete="tel" placeholder="(214) 555-0100" defaultValue={saved.phone} />
        </label>
      </div>
      <label className="field">
        Email
        <input name="email" type="email" required autoComplete="email" defaultValue={saved.email} />
      </label>
      <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
        <label className="field">
          Property address
          <input name="address" autoComplete="street-address" defaultValue={saved.address} />
        </label>
        <label className="field">
          ZIP code
          <input name="zip" required inputMode="numeric" pattern="\d{5}" maxLength={5} autoComplete="postal-code" defaultValue={saved.zip} />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <label className="field">
          What do you need?
          <select name="service" defaultValue={saved.service ?? 'replacement'}>
            {site.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value="other">Something else</option>
          </select>
        </label>
        <label className="field">
          Roof type
          <select name="roofType" defaultValue={saved.roofType ?? site.estimateForm.roofTypes[0]}>
            {site.estimateForm.roofTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Timeline
          <select name="timeline" defaultValue={saved.timeline ?? site.estimateForm.timelines[0]}>
            {site.estimateForm.timelines.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        Anything we should know?
        <textarea name="message" defaultValue={saved.message} placeholder="Leak over the kitchen after last week’s hail, roof is about 15 years old…" />
      </label>
      {/* Honeypot for bots — hidden from people and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company website
          <input name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {status.kind === 'error' && (
        <p role="alert" className="m-0 rounded-lg border border-copper/50 bg-copper/10 px-4 py-3 font-semibold text-fg">
          {status.message}
        </p>
      )}

      {status.kind === 'waiting' && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3">
          <span className="flex items-center gap-3 font-semibold text-fg">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber border-t-transparent" aria-hidden="true" />
            Enter the code Whop emailed you in the pop-up window.
          </span>
          <button type="button" className="text-sm font-semibold text-amber underline" onClick={() => abortRef.current?.abort()}>
            Cancel
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary text-[1.05rem]" disabled={sending}>
          {status.kind === 'waiting' ? 'Waiting for your code…' : status.kind === 'sending' ? 'Sending…' : 'Verify email and send request'}
        </button>
        <p id="estimate-help" className="m-0 max-w-sm text-sm text-dim">
          Free, no obligation. A Whop window asks for a one-time code sent to your email (no password), then your request is sent.
        </p>
      </div>
    </form>
  )
}

export function Estimate() {
  return (
    <section id="contact" aria-labelledby="estimate-title" className="relative overflow-hidden bg-night">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-10 h-[34rem] w-[34rem] rounded-full bg-copper/10 blur-3xl"
      />
      <div id="estimate" className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.5fr_1fr]">
        <Reveal>
          <h2 id="estimate-title" className="display m-0 text-[clamp(2.1rem,4.6vw,3.4rem)] text-fg">
            {site.estimateForm.title}
          </h2>
          <p className="measure mb-8 mt-4 text-[1.08rem] text-dim">{site.estimateForm.text}</p>
          <EstimateForm />
        </Reveal>

        <aside aria-labelledby="contact-title" className="lg:pt-28">
          <h3 id="contact-title" className="heading m-0 text-[1.5rem] text-fg">
            Prefer to talk?
          </h3>
          <dl className="card mt-5 grid gap-5 p-6">
            <div>
              <dt className="text-sm text-dim">Office</dt>
              <dd className="m-0">
                <a href={site.company.phoneHref} className="heading text-[1.5rem] text-fg no-underline hover:text-amber">
                  {site.company.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-dim">Storm emergencies, 24/7</dt>
              <dd className="m-0">
                <a
                  href={`tel:${site.company.emergencyLine.replace(/[^\d+]/g, '')}`}
                  className="heading text-[1.5rem] text-fg no-underline hover:text-amber"
                >
                  {site.company.emergencyLine}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-dim">Email</dt>
              <dd className="m-0">
                <a href={`mailto:${site.company.email}`} className="font-semibold text-fg hover:text-amber">
                  {site.company.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-dim">Office hours</dt>
              <dd className="m-0">
                <table className="mt-1 border-collapse text-[0.98rem] text-fg">
                  <tbody>
                    {site.company.hours.map((row) => (
                      <tr key={row.days}>
                        <th scope="row" className="py-0.5 pr-5 text-left font-semibold">
                          {row.days}
                        </th>
                        <td className="py-0.5">{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-dim">Yard and office</dt>
              <dd className="m-0 text-fg">{site.company.address}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  )
}

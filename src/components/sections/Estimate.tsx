import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { site } from '#/config/site'
import { readDraft, startEmailVerification } from '#/lib/whop-oauth'

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'error'; message: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function EstimateForm() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  // Restores what the visitor typed if they come back from the Whop step.
  const [saved, setSaved] = useState<Record<string, string>>({})
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    const draft = readDraft()
    if (draft) {
      setSaved(draft.form)
      setFormKey((k) => k + 1)
    }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>
    if (data.company_website) return
    if (!data.name?.trim()) return setStatus({ kind: 'error', message: 'Add your name so we know who to ask for.' })
    if (!EMAIL.test(data.email?.trim() ?? '')) return setStatus({ kind: 'error', message: 'Add a valid email address.' })
    if (!/^\d{5}$/.test(data.zip?.trim() ?? '')) return setStatus({ kind: 'error', message: 'Add the 5-digit ZIP code of the property.' })

    setStatus({ kind: 'sending' })
    try {
      const config = (await fetch('/api/public-config').then((r) => r.json())) as { appId?: string | null }
      if (!config.appId) throw new Error('Estimate requests are unavailable right now. Please call us.')
      // The lead is created after the homeowner confirms their email on Whop
      // (see /estimate/verified), because Whop leads belong to a Whop user.
      await startEmailVerification(config.appId, data)
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Something went wrong.' })
    }
  }

  const sending = status.kind === 'sending'

  return (
    <form
      key={formKey}
      onSubmit={submit}
      noValidate
      className="grid gap-5 rounded-md border-2 border-ink bg-white p-6 sm:p-8"
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
        <p role="alert" className="m-0 rounded border-l-4 border-ink bg-hivis/25 px-4 py-3 font-semibold">
          {status.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary text-[1.05rem]" disabled={sending}>
          {sending ? 'Opening Whop…' : 'Verify email and send request'}
        </button>
        <p id="estimate-help" className="m-0 text-sm text-muted">
          Free, no obligation. Whop sends a one-time code to confirm your email (no password needed), then your request is sent.
        </p>
      </div>
    </form>
  )
}

export function Estimate() {
  return (
    <section id="contact" aria-labelledby="estimate-title" className="bg-paper">
      <div id="estimate" className="mx-auto grid max-w-6xl gap-12 px-4 py-18 sm:px-6 md:py-24 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h2 id="estimate-title" className="display m-0 text-[clamp(2rem,4.5vw,3.2rem)]">
            {site.estimateForm.title}
          </h2>
          <p className="measure mb-8 mt-4 text-[1.08rem] text-muted">{site.estimateForm.text}</p>
          <EstimateForm />
        </div>

        <aside aria-labelledby="contact-title" className="lg:pt-24">
          <h3 id="contact-title" className="heading m-0 text-[1.5rem]">
            Prefer to talk?
          </h3>
          <dl className="mt-5 grid gap-5">
            <div>
              <dt className="text-sm text-muted">Office</dt>
              <dd className="m-0">
                <a href={site.company.phoneHref} className="heading text-[1.5rem] text-ink no-underline hover:underline">
                  {site.company.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Storm emergencies, 24/7</dt>
              <dd className="m-0">
                <a
                  href={`tel:${site.company.emergencyLine.replace(/[^\d+]/g, '')}`}
                  className="heading text-[1.5rem] text-ink no-underline hover:underline"
                >
                  {site.company.emergencyLine}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Email</dt>
              <dd className="m-0">
                <a href={`mailto:${site.company.email}`} className="font-semibold text-ink">
                  {site.company.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Office hours</dt>
              <dd className="m-0">
                <table className="mt-1 border-collapse text-[0.98rem]">
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
              <dt className="text-sm text-muted">Yard and office</dt>
              <dd className="m-0">{site.company.address}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  )
}

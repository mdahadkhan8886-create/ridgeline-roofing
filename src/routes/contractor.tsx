import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { formatUSD, site } from '#/config/site'
import { randomId } from '#/lib/track'

export const Route = createFileRoute('/contractor')({
  head: () => ({ meta: [{ title: `Contractor console | ${site.company.name}` }, { name: 'robots', content: 'noindex' }] }),
  component: ContractorPage,
})

interface LeadRow {
  id: string
  createdAt: string | null
  name: string
  email: string
  phone: string
  address: string
  service: string
  timeline: string
  message: string
}

interface CardRow {
  setupIntentId: string
  createdAt: string | null
  memberId: string | null
  paymentMethodId: string | null
  card: string
  name: string
  email: string
  address: string
  jobRef: string
}

interface InvoiceResult {
  id: string
  number: string | number | null
  status: string | null
  payUrl: string | null
  balance: number
  collection: string
}

const PIN_KEY = 'rr_admin_pin'

function when(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function ContractorPage() {
  const [pin, setPin] = useState<string | null>(null)
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [cards, setCards] = useState<CardRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      setPin(window.sessionStorage.getItem(PIN_KEY))
    } catch {
      /* private mode */
    }
  }, [])

  const load = useCallback(async (currentPin: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/overview', { headers: { 'x-admin-pin': currentPin } })
      const data = (await response.json().catch(() => ({}))) as { leads?: LeadRow[]; cardsOnFile?: CardRow[]; error?: string }
      if (response.status === 401) {
        try {
          window.sessionStorage.removeItem(PIN_KEY)
        } catch {
          /* ignore */
        }
        setPin(null)
        throw new Error('Wrong PIN. Try again.')
      }
      if (!response.ok) throw new Error(data.error || 'Couldn’t load the console.')
      setLeads(data.leads ?? [])
      setCards(data.cardsOnFile ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t load the console.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (pin) void load(pin)
  }, [pin, load])

  if (!pin) {
    return <PinGate error={error} onSubmit={(value) => {
      try {
        window.sessionStorage.setItem(PIN_KEY, value)
      } catch {
        /* ignore */
      }
      setPin(value)
    }} />
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display m-0 text-[clamp(2rem,4.5vw,3rem)]">Contractor console</h1>
          <p className="mt-2 text-muted">Estimate requests, cards on file, and final-balance invoices — all through Whop.</p>
        </div>
        <button type="button" className="btn btn-ghost text-ink" onClick={() => void load(pin)} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded border-l-4 border-ink bg-hivis/25 px-4 py-3 font-semibold">
          {error}
        </p>
      )}

      <InvoiceBuilder pin={pin} cards={cards} />

      <section aria-labelledby="cards-title" className="mt-14">
        <h2 id="cards-title" className="heading m-0 text-[1.5rem]">
          Cards on file <span className="text-base font-semibold text-muted">({cards.length})</span>
        </h2>
        <p className="mt-1 text-sm text-muted">Saved with Whop setup intents when a customer pays a deposit.</p>
        <div className="mt-4 overflow-x-auto rounded-md border border-rule bg-white">
          <table className="w-full min-w-[44rem] border-collapse text-left text-[0.95rem]">
            <thead className="bg-paper">
              <tr>
                {['Customer', 'Card', 'Property', 'Saved', 'Setup intent'].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-muted">
                    No cards on file yet. They appear here after a customer pays a deposit on the site.
                  </td>
                </tr>
              )}
              {cards.map((c) => (
                <tr key={c.setupIntentId} className="border-t border-rule/70 align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{c.name || '—'}</div>
                    <div className="text-sm text-muted">{c.email}</div>
                  </td>
                  <td className="px-4 py-3">{c.card}</td>
                  <td className="px-4 py-3">{c.address}</td>
                  <td className="px-4 py-3 text-sm">{when(c.createdAt)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{c.setupIntentId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="leads-title" className="mt-14">
        <h2 id="leads-title" className="heading m-0 text-[1.5rem]">
          Estimate requests <span className="text-base font-semibold text-muted">({leads.length})</span>
        </h2>
        <p className="mt-1 text-sm text-muted">Every “Request an estimate” form lands here as a Whop lead.</p>
        <div className="mt-4 overflow-x-auto rounded-md border border-rule bg-white">
          <table className="w-full min-w-[52rem] border-collapse text-left text-[0.95rem]">
            <thead className="bg-paper">
              <tr>
                {['Received', 'Contact', 'Property', 'Needs', 'Notes', 'Lead'].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-muted">
                    No estimate requests yet. Submit the form on the homepage to see one arrive.
                  </td>
                </tr>
              )}
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-rule/70 align-top">
                  <td className="px-4 py-3 text-sm">{when(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{l.name || '—'}</div>
                    <div className="text-sm text-muted">{[l.email, l.phone].filter(Boolean).join(' / ')}</div>
                  </td>
                  <td className="px-4 py-3">{l.address}</td>
                  <td className="px-4 py-3">
                    {l.service}
                    <div className="text-sm text-muted">{l.timeline}</div>
                  </td>
                  <td className="max-w-[18rem] px-4 py-3 text-sm">{l.message}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{l.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function PinGate({ onSubmit, error }: { onSubmit: (pin: string) => void; error: string | null }) {
  const [value, setValue] = useState('')
  return (
    <div className="mx-auto max-w-md px-4 py-24 sm:px-6">
      <h1 className="display text-[2.4rem]">Contractor console</h1>
      <p className="mt-3 text-muted">For {site.company.name} staff. Enter the console PIN.</p>
      <form
        className="mt-6 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (value.trim()) onSubmit(value.trim())
        }}
      >
        <label className="field">
          PIN
          <input type="password" autoComplete="current-password" value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
        {error && <p role="alert" className="m-0 font-semibold">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Open console
        </button>
      </form>
    </div>
  )
}

function InvoiceBuilder({ pin, cards }: { pin: string; cards: CardRow[] }) {
  const [selected, setSelected] = useState('')
  const [collection, setCollection] = useState<'charge_automatically' | 'send_invoice'>('charge_automatically')
  const [jobTotal, setJobTotal] = useState('12400')
  const [depositPaid, setDepositPaid] = useState(String(site.plans.deposit.price))
  const [description, setDescription] = useState('Roof replacement — labor and materials')
  const [email, setEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [dueInDays, setDueInDays] = useState('7')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<InvoiceResult | null>(null)

  const card = cards.find((c) => c.setupIntentId === selected) ?? null
  useEffect(() => {
    if (!selected && cards.length > 0) setSelected(cards[0].setupIntentId)
  }, [cards, selected])

  const method = card ? collection : 'send_invoice'
  const total = Number(jobTotal) || 0
  const deposit = Number(depositPaid) || 0
  const balance = useMemo(() => Math.round((total - deposit) * 100) / 100, [total, deposit])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setResult(null)
    setBusy(true)
    try {
      const response = await fetch('/api/admin/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify({
          requestId: randomId('inv'),
          collection: method,
          jobTotal: total,
          depositPaid: deposit,
          description,
          dueInDays: Number(dueInDays),
          memberId: card?.memberId ?? undefined,
          paymentMethodId: card?.paymentMethodId ?? undefined,
          email: !card ? email : undefined,
          customerName: !card ? customerName : undefined,
        }),
      })
      const data = (await response.json().catch(() => ({}))) as InvoiceResult & { error?: string }
      if (!response.ok) throw new Error(data.error || 'The invoice wasn’t created.')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The invoice wasn’t created.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="invoice-title" className="mt-10 rounded-md border-2 border-ink bg-white p-6 sm:p-8">
      <h2 id="invoice-title" className="heading m-0 text-[1.6rem]">
        Bill the final balance
      </h2>
      <p className="measure mt-2 text-muted">
        When the job is finished, create the final invoice with the Whop Invoices API. Charge the card saved at deposit time, or email the
        customer a pay-online link.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="grid gap-5">
          <label className="field">
            Customer
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {cards.map((c) => (
                <option key={c.setupIntentId} value={c.setupIntentId}>
                  {(c.name || c.email || 'Customer') + ' — ' + c.card}
                </option>
              ))}
              <option value="">New customer (email an invoice)</option>
            </select>
          </label>

          {!card && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field">
                Customer name
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </label>
              <label className="field">
                Customer email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
            </div>
          )}

          <label className="field">
            Line item
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="field">
              Job total ($)
              <input inputMode="decimal" value={jobTotal} onChange={(e) => setJobTotal(e.target.value)} />
            </label>
            <label className="field">
              Deposit paid ($)
              <input inputMode="decimal" value={depositPaid} onChange={(e) => setDepositPaid(e.target.value)} />
            </label>
            <label className="field">
              Due in (days)
              <input inputMode="numeric" value={dueInDays} onChange={(e) => setDueInDays(e.target.value)} />
            </label>
          </div>

          <fieldset className="m-0 grid gap-2 border-0 p-0">
            <legend className="mb-2 p-0 font-semibold">How to collect</legend>
            <label className="flex items-start gap-3">
              <input
                type="radio"
                name="collection"
                className="mt-1 h-4 w-4"
                checked={method === 'charge_automatically'}
                disabled={!card}
                onChange={() => setCollection('charge_automatically')}
              />
              <span>
                <strong>Charge the card on file</strong>
                <span className="block text-sm text-muted">Bills {card ? card.card : 'the saved card'} automatically.</span>
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="radio"
                name="collection"
                className="mt-1 h-4 w-4"
                checked={method === 'send_invoice'}
                onChange={() => setCollection('send_invoice')}
              />
              <span>
                <strong>Email an invoice</strong>
                <span className="block text-sm text-muted">The customer pays online with any method, including financing where offered.</span>
              </span>
            </label>
          </fieldset>
        </div>

        <div className="rounded-md bg-paper p-5">
          <h3 className="heading m-0 text-[1.15rem]">Invoice preview</h3>
          <table className="mt-4 w-full border-collapse text-[0.98rem]">
            <tbody>
              <tr>
                <td className="py-1.5 pr-3">{description || 'Job total'}</td>
                <td className="py-1.5 text-right">{formatUSD(total)}</td>
              </tr>
              {deposit > 0 && (
                <tr>
                  <td className="py-1.5 pr-3">Deposit already paid</td>
                  <td className="py-1.5 text-right">−{formatUSD(deposit)}</td>
                </tr>
              )}
              <tr className="border-t-2 border-ink">
                <th scope="row" className="py-2 pr-3 text-left">
                  Balance due
                </th>
                <td className="heading py-2 text-right text-[1.3rem]">{formatUSD(Math.max(balance, 0))}</td>
              </tr>
            </tbody>
          </table>

          {error && (
            <p role="alert" className="mt-4 rounded border-l-4 border-ink bg-hivis/25 px-3 py-2 text-[0.95rem] font-semibold">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary mt-5 w-full" disabled={busy || balance < 1}>
            {busy
              ? 'Creating invoice…'
              : method === 'charge_automatically'
                ? `Charge ${formatUSD(Math.max(balance, 0))} to card on file`
                : `Email ${formatUSD(Math.max(balance, 0))} invoice`}
          </button>

          {result && (
            <div role="status" className="mt-5 border-t border-rule pt-4 text-[0.95rem]">
              <p className="m-0 font-bold">
                Invoice {result.number ? `#${result.number}` : result.id} created
                {result.status ? ` — ${result.status}` : ''}
              </p>
              <p className="mt-1 text-muted">
                {result.collection === 'charge_automatically'
                  ? `Whop is charging ${formatUSD(result.balance)} to the card on file.`
                  : `Whop emailed the customer a ${formatUSD(result.balance)} invoice.`}
              </p>
              {result.payUrl && (
                <a href={result.payUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-ink">
                  Open the pay-online page
                </a>
              )}
              <p className="mt-1 font-mono text-xs text-muted">{result.id}</p>
            </div>
          )}
        </div>
      </form>
    </section>
  )
}

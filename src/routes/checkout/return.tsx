import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { formatUSD, getPlan, site } from '#/config/site'
import { loadWhopElements } from '#/lib/whop-elements'
import { settleDeposit } from '#/components/checkout/DepositCheckout'
import type { DepositResult } from '#/components/checkout/DepositCheckout'

type ReturnSearch = {
  plan?: string
  order?: string
  flow?: string
  job?: string
  status?: string
  payment?: string
  setup?: string
}

const KEYS = ['plan', 'order', 'flow', 'job', 'status', 'payment', 'setup'] as const

export const Route = createFileRoute('/checkout/return')({
  validateSearch: (search: Record<string, unknown>): ReturnSearch => {
    const out: ReturnSearch = {}
    for (const key of KEYS) if (typeof search[key] === 'string') out[key] = search[key] as string
    return out
  },
  head: () => ({ meta: [{ title: `Payment status | ${site.company.name}` }, { name: 'robots', content: 'noindex' }] }),
  component: ReturnPage,
})

type Face = 'checking' | 'succeeded' | 'failed' | 'pending'

function ReturnPage() {
  const search = Route.useSearch()
  const isDeposit = search.flow === 'deposit'
  const plan = isDeposit ? site.plans.deposit : getPlan(search.plan ?? '')
  const [face, setFace] = useState<Face>('checking')
  const [paymentId, setPaymentId] = useState(search.payment)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const status = search.status ?? ''
    if (status === 'failed' || status === 'canceled') return setFace('failed')

    // Came back from a card-setup step (3D Secure / bank) during the deposit:
    // the card is saved, now charge the deposit to it.
    if (isDeposit && search.setup && status === 'succeeded' && !search.payment) {
      let active = true
      ;(async () => {
        try {
          const response = await fetch('/api/deposit-charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ setupIntentId: search.setup }),
          })
          const first = (await response.json().catch(() => ({}))) as DepositResult
          if (!response.ok) throw new Error(first.error || 'Your card is saved, but the deposit wasn’t charged.')
          const whop = await loadWhopElements()
          const next = await settleDeposit(whop, first, search.job ?? '')
          if (next && active) window.location.replace(next)
        } catch (error) {
          if (!active) return
          setMessage(error instanceof Error ? error.message : null)
          setFace('failed')
        }
      })()
      return () => {
        active = false
      }
    }

    setPaymentId(search.payment)
    setFace(status === 'succeeded' ? 'succeeded' : 'pending')
  }, [isDeposit, search.payment, search.setup, search.status, search.job])

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
      {face === 'checking' && (
        <div role="status">
          <h1 className="display text-[clamp(2rem,5vw,3rem)]">Finishing your deposit…</h1>
          <p className="mt-4 text-muted">Your card is saved. Charging the deposit now — don’t close this tab.</p>
        </div>
      )}

      {face === 'succeeded' && (
        <div role="status">
          <h1 className="display text-[clamp(2.2rem,5vw,3.4rem)]">
            {isDeposit ? 'Your install date is reserved' : 'You’re booked'}
          </h1>
          <p className="measure mt-5 text-[1.12rem] text-ink/85">
            {isDeposit
              ? `We received your ${formatUSD(site.plans.deposit.price)} deposit and your card is saved securely with Whop. We’ll call within one business day to confirm the date. The final balance is billed only after the job is done, on an itemized invoice.`
              : `Payment received${plan ? ` for ${plan.name.toLowerCase()} (${formatUSD(plan.price)})` : ''}. A receipt is on its way to your email, and we’ll call within one business day to pick a time.`}
          </p>
          {paymentId && <p className="mt-4 text-sm text-muted">Payment reference: {paymentId}</p>}
          <Link to="/" className="btn btn-primary mt-8">
            Back to the homepage
          </Link>
        </div>
      )}

      {face === 'pending' && (
        <div role="status">
          <h1 className="display text-[clamp(2rem,5vw,3rem)]">We’re confirming your payment</h1>
          <p className="measure mt-5 text-[1.1rem] text-ink/85">
            Your bank is still processing it. We’ll email you as soon as it clears — there’s nothing else you need to do.
          </p>
          {paymentId && <p className="mt-4 text-sm text-muted">Payment reference: {paymentId}</p>}
          <Link to="/" className="btn btn-ghost mt-8 text-ink">
            Back to the homepage
          </Link>
        </div>
      )}

      {face === 'failed' && (
        <div role="alert">
          <h1 className="display text-[clamp(2rem,5vw,3rem)]">Your payment didn’t go through</h1>
          <p className="measure mt-5 text-[1.1rem] text-ink/85">
            {message ?? 'No money was taken. You can try again with the same card or a different one.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {isDeposit ? (
              <Link to="/deposit" className="btn btn-primary">
                Try the deposit again
              </Link>
            ) : plan ? (
              <Link to="/book/$planKey" params={{ planKey: plan.key }} className="btn btn-primary">
                Try again
              </Link>
            ) : null}
            <a href={site.company.phoneHref} className="btn btn-ghost text-ink">
              Call {site.company.phone}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

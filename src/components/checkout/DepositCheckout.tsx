import { useState } from 'react'
import { formatUSD, site } from '#/config/site'
import { randomId, track } from '#/lib/track'
import { useAccountId } from '#/lib/use-account-id'
import { CustomerFields, customerProblem, emptyCustomer, fullAddress, toBillingDetails } from '#/components/checkout/CustomerFields'
import type { Customer } from '#/components/checkout/CustomerFields'
import { isCancel, useWhopPayments } from '#/components/checkout/useWhopPayments'
import type { WhopElementsInstance } from '#/lib/whop-elements'

export interface DepositResult {
  stage?: 'charged' | 'setup_pending'
  paymentId?: string
  status?: string
  clientSecret?: string | null
  setupIntentId?: string
  jobRef?: string
  error?: string
}

async function post(path: string, body: unknown): Promise<DepositResult> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await response.json().catch(() => ({}))) as DepositResult
  if (!response.ok) throw new Error(data.error || 'The deposit didn’t go through. You haven’t been charged.')
  return data
}

/**
 * Settles a deposit result in the browser: finishes a pending card-setup step,
 * charges the deposit, and finishes any step the deposit charge needs.
 * Returns the final return-page URL, or null if the buyer left for an off-site step.
 */
export async function settleDeposit(whop: WhopElementsInstance, first: DepositResult, jobRef: string): Promise<string | null> {
  let result = first
  const done = (status: string, paymentId?: string) =>
    `/checkout/return?flow=deposit&job=${encodeURIComponent(jobRef)}&status=${encodeURIComponent(status)}${paymentId ? `&payment=${paymentId}` : ''}`

  if (result.stage === 'setup_pending') {
    if (result.clientSecret) {
      const step = await whop.payments.handleNextAction({ clientSecret: result.clientSecret })
      if (step.redirected) return null
      if (step.status !== 'succeeded') {
        if (step.status === 'processing') return done('processing')
        throw new Error(step.lastPaymentError?.message ?? 'Your card wasn’t saved, so nothing was charged. Try again.')
      }
    }
    result = await post('/api/deposit-charge', { setupIntentId: result.setupIntentId })
    if (result.stage === 'setup_pending') return done('processing')
  }

  if (result.status === 'paid' || result.status === 'succeeded') return done('succeeded', result.paymentId)
  if (result.clientSecret) {
    const step = await whop.payments.handleNextAction({ clientSecret: result.clientSecret })
    if (step.redirected) return null
    if (step.status === 'succeeded' || step.status === 'processing') return done(step.status, result.paymentId)
    throw new Error(step.lastPaymentError?.message ?? 'Your card is saved, but the deposit wasn’t completed. Try again or call us.')
  }
  return done(result.status || 'processing', result.paymentId)
}

/**
 * Deposit checkout: PaymentElement + BrandingElement in setup mode.
 * 1. The card is saved on file with a Whop setup intent.
 * 2. The deposit plan is charged to that saved card.
 * 3. Later, the final balance is billed with the Invoices API (contractor console).
 */
export function DepositCheckout() {
  const plan = site.plans.deposit
  const [jobRef] = useState(() => randomId('job'))
  const [customer, setCustomer] = useState<Customer>(emptyCustomer)
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { accountId, loading: accountLoading } = useAccountId()

  const returnPath = `/checkout/return?flow=deposit&job=${jobRef}`
  const { paymentRef, brandingRef, ready, complete, loading, loadError } = useWhopPayments({
    accountId,
    mode: 'setup',
    returnPath,
  })

  async function submit() {
    setError(null)
    const problem = customerProblem(customer)
    if (problem) return setError(problem)
    if (!agreed) return setError('Please confirm the deposit and card-on-file terms.')
    if (!ready) return setError('The payment form is still loading.')

    // deposit_started: the homeowner has committed to paying the deposit.
    track('deposit_started', {
      event_id: jobRef,
      value: plan.price,
      currency: 'USD',
      zip: customer.zip,
      email: customer.email,
    })

    setBusy(true)
    try {
      const { confirmationToken } = await ready.payments.createConfirmationToken({ billingDetails: toBillingDetails(customer) })
      const first = await post('/api/deposit', {
        confirmationToken,
        jobRef,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: fullAddress(customer),
        zip: customer.zip,
      })
      const next = await settleDeposit(ready.whop, first, jobRef)
      if (next) window.location.assign(next)
    } catch (err) {
      if (!isCancel(err)) setError(err instanceof Error ? err.message : 'The deposit didn’t go through.')
    } finally {
      setBusy(false)
    }
  }

  if (!plan.whopPlanId) {
    return (
      <div className="rounded-md border-2 border-ink bg-white p-6">
        <h2 className="heading m-0 text-xl">Online deposits aren’t switched on yet</h2>
        <p className="mt-2 text-ink/85">The owner still needs to add the deposit plan’s Whop ID to the site config. Call us to book your date.</p>
      </div>
    )
  }

  const unavailable = !accountLoading && !accountId

  return (
    <div className="grid gap-6 rounded-md border-2 border-ink bg-white p-5 sm:p-7">
      <CustomerFields value={customer} onChange={setCustomer} disabled={busy} />

      <div>
        <h3 className="heading m-0 mb-1 text-[1.15rem]">Card to keep on file</h3>
        <p className="mb-3 mt-0 text-sm text-muted">
          Saved securely by Whop. We charge the {formatUSD(plan.price)} deposit now, and only bill the final balance after your job is
          finished and you’ve approved the invoice.
        </p>
        {unavailable ? (
          <p className="text-ink/85">Online payment is unavailable right now. Please call us to book.</p>
        ) : (
          <>
            {(loading || accountLoading) && !loadError && <p className="text-sm text-muted">Loading secure card form…</p>}
            <div ref={paymentRef} className="whop-slot" />
            <div ref={brandingRef} className="whop-slot mt-3" />
          </>
        )}
        {loadError && <p role="alert" className="font-semibold">{loadError}</p>}
      </div>

      <label className="flex items-start gap-3 text-[0.95rem]">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-5 w-5 flex-none accent-[var(--rr-slate)]"
          disabled={busy}
        />
        <span>
          I authorize {site.company.name} to charge a {formatUSD(plan.price)} deposit today and to keep this card on file for the final
          balance of my project, which I’ll see on an itemized invoice first.
        </span>
      </label>

      {error && (
        <p role="alert" className="m-0 rounded border-l-4 border-ink bg-hivis/25 px-4 py-3 font-semibold">
          {error}
        </p>
      )}

      <button type="button" onClick={submit} disabled={busy || !ready || !complete} className="btn btn-primary w-full text-[1.1rem]">
        {busy ? 'Processing…' : `Save card and pay ${formatUSD(plan.price)} deposit`}
      </button>
    </div>
  )
}

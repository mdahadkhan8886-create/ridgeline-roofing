import { useState } from 'react'
import { formatUSD } from '#/config/site'
import type { Plan } from '#/config/site'
import { randomId } from '#/lib/track'
import { useAccountId } from '#/lib/use-account-id'
import { CustomerFields, customerProblem, emptyCustomer, fullAddress, toBillingDetails } from '#/components/checkout/CustomerFields'
import type { Customer } from '#/components/checkout/CustomerFields'
import { isCancel, useExpressCheckout, useWhopPayments } from '#/components/checkout/useWhopPayments'

interface PayResponse {
  id?: string
  status?: string
  client_secret?: string | null
  error?: string
}

/**
 * Checkout for a fixed-price plan (inspection or flat-rate service):
 *   ExpressCheckoutElement (Apple Pay / Google Pay)
 *   + PaymentElement + BrandingElement, confirmed server-side with the Payments API.
 */
export function PlanCheckout({ plan }: { plan: Plan }) {
  const [orderRef] = useState(() => randomId('ord'))
  const [customer, setCustomer] = useState<Customer>(emptyCustomer)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { accountId, loading: accountLoading } = useAccountId()

  const returnPath = `/checkout/return?plan=${plan.key}&order=${orderRef}`
  const expressRef = useExpressCheckout({
    planId: plan.whopPlanId,
    returnPath,
    metadata: { flow: plan.key, order_ref: orderRef, channel: 'express' },
  })
  const { paymentRef, brandingRef, ready, complete, loading, loadError } = useWhopPayments({
    accountId,
    mode: 'payment',
    planId: plan.whopPlanId,
    returnPath,
  })

  const finish = (status: string, paymentId?: string) => {
    window.location.assign(`${returnPath}&status=${encodeURIComponent(status)}${paymentId ? `&payment=${paymentId}` : ''}`)
  }

  async function pay() {
    setError(null)
    const problem = customerProblem(customer)
    if (problem) return setError(problem)
    if (!ready) return setError('The payment form is still loading.')

    setBusy(true)
    try {
      const { confirmationToken } = await ready.payments.createConfirmationToken({ billingDetails: toBillingDetails(customer) })
      const response = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey: plan.key,
          confirmationToken,
          orderRef,
          address: fullAddress(customer),
          phone: customer.phone,
        }),
      })
      const payment = (await response.json().catch(() => ({}))) as PayResponse
      if (!response.ok || !payment.id) throw new Error(payment.error || 'The payment didn’t go through. You haven’t been charged.')

      if (payment.status === 'paid' || payment.status === 'succeeded') return finish('succeeded', payment.id)
      if (!payment.client_secret) return finish(payment.status || 'processing', payment.id)

      // 3D Secure, bank step, or a charge still being decided.
      const result = await ready.whop.payments.handleNextAction({ clientSecret: payment.client_secret })
      if (result.redirected) return
      if (result.status === 'succeeded' || result.status === 'processing') return finish(result.status, payment.id)
      setError(result.lastPaymentError?.message ?? 'The payment step wasn’t completed. You haven’t been charged — try again.')
    } catch (err) {
      if (!isCancel(err)) setError(err instanceof Error ? err.message : 'The payment didn’t go through.')
    } finally {
      setBusy(false)
    }
  }

  if (!plan.whopPlanId) {
    return (
      <div className="rounded-md border-2 border-ink bg-white p-6">
        <h2 className="heading m-0 text-xl">Online booking isn’t switched on yet</h2>
        <p className="mt-2 text-ink/85">
          The owner still needs to add this plan’s Whop ID to the site config. Call us and we’ll book you in.
        </p>
      </div>
    )
  }

  const unavailable = !accountLoading && !accountId

  return (
    <div className="grid gap-6 rounded-md border-2 border-ink bg-white p-5 sm:p-7">
      <div>
        <h2 className="heading m-0 text-[1.3rem]">Pay {formatUSD(plan.price)}</h2>
        <div ref={expressRef} className="whop-slot mt-4" />
        <p className="mt-2 text-sm text-muted">Apple Pay and Google Pay appear above on devices that support them.</p>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-rule" />
        or pay by card
        <span className="h-px flex-1 bg-rule" />
      </div>

      <CustomerFields value={customer} onChange={setCustomer} disabled={busy} />

      <div>
        <h3 className="heading m-0 mb-3 text-[1.15rem]">Payment</h3>
        {unavailable ? (
          <p className="text-ink/85">Online payment is unavailable right now. Please call us to book.</p>
        ) : (
          <>
            {(loading || accountLoading) && !loadError && <p className="text-sm text-muted">Loading secure payment form…</p>}
            <div ref={paymentRef} className="whop-slot" />
            <div ref={brandingRef} className="whop-slot mt-3" />
          </>
        )}
        {loadError && <p role="alert" className="font-semibold">{loadError}</p>}
      </div>

      {error && (
        <p role="alert" className="m-0 rounded border-l-4 border-ink bg-hivis/25 px-4 py-3 font-semibold">
          {error}
        </p>
      )}

      <button type="button" onClick={pay} disabled={busy || !ready || !complete} className="btn btn-primary w-full text-[1.1rem]">
        {busy ? 'Processing…' : `Pay ${formatUSD(plan.price)}`}
      </button>
      <p className="-mt-3 text-center text-sm text-muted">Payments are processed by Whop. We never see your card number.</p>
    </div>
  )
}

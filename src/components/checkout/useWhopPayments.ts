import { useEffect, useRef, useState } from 'react'
import { loadWhopElements } from '#/lib/whop-elements'
import type { CheckoutCompletion, PaymentsHandle, WhopElementsInstance } from '#/lib/whop-elements'

/**
 * Mounts Whop's PaymentElement + the required BrandingElement into two refs.
 * `mode: 'payment'` charges a plan; `mode: 'setup'` saves a card without charging.
 */
export function useWhopPayments(options: {
  accountId: string | null
  mode: 'payment' | 'setup'
  planId?: string
  /** Path on this site the buyer returns to after an off-site step (3DS, bank). */
  returnPath: string
}) {
  const { accountId, mode, planId, returnPath } = options
  const paymentRef = useRef<HTMLDivElement>(null)
  const brandingRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState<{ whop: WhopElementsInstance; payments: PaymentsHandle } | null>(null)
  const [complete, setComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!accountId || (mode === 'payment' && !planId)) return
    const paymentNode = paymentRef.current
    const brandingNode = brandingRef.current
    if (!paymentNode || !brandingNode) return

    let cancelled = false
    let payments: PaymentsHandle | null = null
    const returnUrl = `${window.location.origin}${returnPath}`

    loadWhopElements()
      .then((whop) => {
        if (cancelled) return
        payments =
          mode === 'setup'
            ? whop.payments.create({ accountId, mode: 'setup', currency: 'usd', returnUrl, onLoadingChange: setLoading })
            : whop.payments.create({ accountId, plan: planId, returnUrl, onLoadingChange: setLoading })
        payments
          .create('payment', {
            onChange: (event: { complete?: boolean }) => setComplete(Boolean(event?.complete)),
          })
          .mount(paymentNode)
        // Required on every Whop payment form: the merchant-of-record notice.
        payments.create('branding').mount(brandingNode)
        setReady({ whop, payments })
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Secure checkout could not load.')
      })

    return () => {
      cancelled = true
      setReady(null)
      setComplete(false)
      try {
        payments?.destroy()
      } catch {
        /* already gone */
      }
    }
  }, [accountId, mode, planId, returnPath])

  return { paymentRef, brandingRef, ready, complete, loading, loadError }
}

/** Mounts Whop's ExpressCheckoutElement (Apple Pay / Google Pay) for a plan. */
export function useExpressCheckout(options: {
  planId: string
  returnPath: string
  metadata: Record<string, string>
  onComplete?: (completion: CheckoutCompletion) => void
}) {
  const { planId, returnPath } = options
  const ref = useRef<HTMLDivElement>(null)
  const latest = useRef(options)
  latest.current = options

  useEffect(() => {
    const node = ref.current
    if (!planId || !node) return
    let cancelled = false
    let destroy: (() => void) | null = null

    loadWhopElements()
      .then((whop) => {
        if (cancelled) return
        const checkout = whop.checkout.create({
          plan: planId,
          metadata: latest.current.metadata,
          returnUrl: `${window.location.origin}${returnPath}`,
          onComplete: (completion) => latest.current.onComplete?.(completion),
        })
        checkout.create('expressCheckout', { layout: 'auto', wallets: ['apple_pay', 'google_pay'] }).mount(node)
        destroy = () => checkout.destroy()
      })
      .catch(() => {
        /* Wallet buttons are optional; the card form below still works. */
      })

    return () => {
      cancelled = true
      try {
        destroy?.()
      } catch {
        /* already gone */
      }
    }
  }, [planId, returnPath])

  return ref
}

export function isCancel(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  const message = error instanceof Error ? error.message : ''
  return code === 'payment_request_cancelled' || message.includes('payment_request_cancelled')
}

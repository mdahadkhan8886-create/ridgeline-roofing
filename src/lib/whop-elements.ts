/**
 * Loads Whop Elements from Whop's CDN (the documented script-tag install) and
 * exposes a small typed surface for the parts this template uses:
 *
 *   • Checkout group  → ExpressCheckoutElement (Apple Pay / Google Pay)
 *   • Payments group  → PaymentElement + BrandingElement, in payment or setup mode
 *
 * Card details are collected inside Whop's PCI-isolated frames. This site never
 * sees a card number — only a single-use confirmation token.
 */

const ELEMENTS_SRC = 'https://cdn.whop.com/elements/amber/elements.js'

export interface MountedElement {
  mount: (target: string | HTMLElement) => void
  destroy: () => void
}

export interface CheckoutCompletion {
  sessionId: string
  result: 'payment' | 'waitlist_entry' | 'setup'
  paymentId?: string
  setupIntentId?: string
  entryId?: string
}

export interface CheckoutHandle {
  create: (type: 'checkout' | 'expressCheckout', props?: Record<string, unknown>) => MountedElement
  destroy: () => void
}

export interface BillingDetails {
  email: string
  name?: string
  phone?: string
  address?: {
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
}

export interface PaymentsHandle {
  create: (
    type: 'payment' | 'branding' | 'email' | 'address' | 'card',
    props?: Record<string, unknown>,
  ) => MountedElement
  createConfirmationToken: (input: {
    billingDetails?: BillingDetails
  }) => Promise<{ confirmationToken: string; type: string }>
  destroy: () => void
}

export interface NextActionResult {
  status: string
  redirected: boolean
  lastPaymentError: { code?: string | null; message?: string | null } | null
}

export interface WhopElementsInstance {
  checkout: {
    create: (options: {
      plan: string
      metadata?: Record<string, string>
      returnUrl?: string
      onComplete?: (completion: CheckoutCompletion) => void
    }) => CheckoutHandle
  }
  payments: {
    create: (options: {
      accountId: string
      plan?: string
      mode?: 'payment' | 'setup'
      currency?: string
      returnUrl?: string
      setupFutureUsage?: 'off_session'
      onLoadingChange?: (loading: boolean) => void
    }) => PaymentsHandle
    handleNextAction: (input: { clientSecret: string; returnUrl?: string }) => Promise<NextActionResult>
  }
}

type WhopElementsFactory = (options?: Record<string, unknown>) => WhopElementsInstance

declare global {
  interface Window {
    WhopElements?: WhopElementsFactory
  }
}

let loading: Promise<WhopElementsInstance> | null = null

/** Brand the Whop elements to match the site. */
const appearance = {
  theme: { appearance: 'light' },
}

export function loadWhopElements(): Promise<WhopElementsInstance> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Whop Elements only load in the browser.'))
  }
  if (loading) return loading

  loading = new Promise<WhopElementsInstance>((resolve, reject) => {
    const ready = () => {
      if (window.WhopElements) {
        resolve(window.WhopElements({ appearance, locale: 'en' }))
        return true
      }
      return false
    }
    if (ready()) return

    let script = document.querySelector<HTMLScriptElement>(`script[src="${ELEMENTS_SRC}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = ELEMENTS_SRC
      script.async = true
      script.setAttribute('data-whop-elements', '')
      document.head.appendChild(script)
    }

    const started = Date.now()
    const poll = window.setInterval(() => {
      if (ready()) {
        window.clearInterval(poll)
      } else if (Date.now() - started > 20000) {
        window.clearInterval(poll)
        loading = null
        reject(new Error('Secure checkout could not load. Check your connection and refresh the page.'))
      }
    }, 50)

    script.addEventListener('error', () => {
      window.clearInterval(poll)
      loading = null
      reject(new Error('Secure checkout could not load. Check your connection and refresh the page.'))
    })
  })

  return loading
}

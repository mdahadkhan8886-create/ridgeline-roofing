import type { BillingDetails } from '#/lib/whop-elements'

export interface Customer {
  name: string
  email: string
  phone: string
  line1: string
  city: string
  state: string
  zip: string
}

export const emptyCustomer: Customer = { name: '', email: '', phone: '', line1: '', city: '', state: 'TX', zip: '' }

export function customerProblem(c: Customer): string | null {
  if (!c.name.trim()) return 'Add your name so the crew knows who to ask for.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) return 'Add a valid email for your receipt.'
  if (!c.line1.trim() || !c.city.trim()) return 'Add the property address.'
  if (!/^[A-Za-z]{2}$/.test(c.state.trim())) return 'Use the 2-letter state code, like TX.'
  if (!/^\d{5}$/.test(c.zip.trim())) return 'Add a 5-digit ZIP code.'
  return null
}

/**
 * Whop's PaymentElement collects the cardholder name and billing address itself,
 * so only the contact details go into the confirmation token here. The property
 * address (where the work happens) is sent to our server as order metadata.
 */
export function toBillingDetails(c: Customer): BillingDetails {
  return {
    email: c.email.trim(),
    phone: c.phone.trim() || undefined,
  }
}

export function fullAddress(c: Customer): string {
  return `${c.line1.trim()}, ${c.city.trim()}, ${c.state.trim().toUpperCase()} ${c.zip.trim()}`
}

export function CustomerFields({
  value,
  onChange,
  disabled,
}: {
  value: Customer
  onChange: (next: Customer) => void
  disabled?: boolean
}) {
  const set = (key: keyof Customer) => (e: { target: { value: string } }) => onChange({ ...value, [key]: e.target.value })

  return (
    <fieldset disabled={disabled} className="m-0 grid gap-4 border-0 p-0">
      <legend className="heading mb-1 p-0 text-[1.15rem]">Your details</legend>
      <p className="m-0 -mt-1 text-sm text-dim">Card billing details are collected in the secure payment form below.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          Full name
          <input value={value.name} onChange={set('name')} autoComplete="name" required />
        </label>
        <label className="field">
          Phone
          <input value={value.phone} onChange={set('phone')} type="tel" autoComplete="tel" />
        </label>
      </div>
      <label className="field">
        Email for your receipt
        <input value={value.email} onChange={set('email')} type="email" autoComplete="email" required />
      </label>
      <label className="field">
        Property address (where the work is)
        <input value={value.line1} onChange={set('line1')} autoComplete="address-line1" required />
      </label>
      <div className="grid grid-cols-[1.4fr_0.6fr_0.9fr] gap-3">
        <label className="field">
          City
          <input value={value.city} onChange={set('city')} autoComplete="address-level2" required />
        </label>
        <label className="field">
          State
          <input value={value.state} onChange={set('state')} autoComplete="address-level1" maxLength={2} required />
        </label>
        <label className="field">
          ZIP
          <input
            value={value.zip}
            onChange={set('zip')}
            inputMode="numeric"
            maxLength={5}
            autoComplete="postal-code"
            required
          />
        </label>
      </div>
    </fieldset>
  )
}

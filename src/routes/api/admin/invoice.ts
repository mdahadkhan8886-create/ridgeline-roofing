import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/config/site'
import { accountId, checkAdmin, errorResponse, json, readJson, str, whopApi } from '#/lib/whop-api'

interface Invoice {
  id: string
  number?: string | number | null
  status?: string | null
  pay_online_url?: string | null
  due_date?: string | null
  email_address?: string | null
}

function money(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[$,\s]/g, ''))
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN
}

// Final balance → Whop Invoices API (POST /invoices).
//   charge_automatically: bills the card saved at deposit time.
//   send_invoice:         emails the customer a pay-online link.
export const Route = createFileRoute('/api/admin/invoice')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = checkAdmin(request)
        if (denied) return denied
        try {
          if (!site.whop.productId) {
            return json({ error: 'Add your Whop product ID (prod_…) to src/config/site.ts → whop.productId.' }, 503)
          }

          const body = await readJson(request)
          const collection = str(body.collection, 40)
          const jobTotal = money(body.jobTotal)
          const depositPaid = money(body.depositPaid ?? site.plans.deposit.price)
          const description = str(body.description, 120) || 'Roof replacement — labor and materials'
          const dueInDays = Math.min(Math.max(Number(body.dueInDays) || 7, 1), 60)

          if (collection !== 'charge_automatically' && collection !== 'send_invoice') {
            return json({ error: 'Choose how to collect: charge the card on file or email an invoice.' }, 400)
          }
          if (!Number.isFinite(jobTotal) || jobTotal <= 0) return json({ error: 'Enter the job total in dollars.' }, 400)
          if (!Number.isFinite(depositPaid) || depositPaid < 0) return json({ error: 'Enter the deposit already paid.' }, 400)
          const balance = Math.round((jobTotal - depositPaid) * 100) / 100
          if (balance < 1) return json({ error: 'The balance due must be at least $1.00.' }, 400)

          const due = new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000).toISOString()

          const payload: Record<string, unknown> = {
            account_id: accountId(),
            product_id: site.whop.productId,
            collection_method: collection,
            due_date: due,
            plan: {
              plan_type: 'one_time',
              currency: 'usd',
              initial_price: balance,
              description: `Final balance — ${description}`,
            },
            line_items: [
              { label: description, quantity: 1, unit_price: jobTotal },
              ...(depositPaid > 0 ? [{ label: 'Deposit already paid', quantity: 1, unit_price: -depositPaid }] : []),
            ],
          }

          if (collection === 'charge_automatically') {
            const memberId = str(body.memberId, 80)
            const paymentMethodId = str(body.paymentMethodId, 80)
            if (!memberId || !paymentMethodId) {
              return json({ error: 'Pick a customer with a card on file to charge automatically.' }, 400)
            }
            payload.member_id = memberId
            payload.payment_method_id = paymentMethodId
          } else {
            const memberId = str(body.memberId, 80)
            const email = str(body.email, 200)
            const customerName = str(body.customerName, 120)
            if (memberId) {
              payload.member_id = memberId
            } else {
              if (!email || !customerName) {
                return json({ error: 'Add the customer’s name and email to send them the invoice.' }, 400)
              }
              payload.email_address = email
              payload.customer_name = customerName
            }
          }

          const invoice = await whopApi<Invoice>('/invoices', {
            method: 'POST',
            idempotencyKey: str(body.requestId, 80) || undefined,
            body: payload,
          })

          return json({
            id: invoice.id,
            number: invoice.number ?? null,
            status: invoice.status ?? null,
            payUrl: invoice.pay_online_url ?? null,
            balance,
            collection,
          })
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})

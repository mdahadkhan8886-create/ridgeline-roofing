import { createFileRoute } from '@tanstack/react-router'
import { getPlan } from '#/config/site'
import { accountId, errorResponse, json, readJson, siteOrigin, str, whopApi } from '#/lib/whop-api'

interface Payment {
  id: string
  status: string
  client_secret?: string | null
}

// Plans a visitor can buy outright from the site (the deposit has its own flow).
const BUYABLE = new Set(['inspection', 'flatRate'])

// Payment Elements checkout: the browser sends a single-use confirmation token,
// the server charges the configured Whop plan with it.
export const Route = createFileRoute('/api/pay')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await readJson(request)
          const planKey = str(body.planKey, 40)
          const confirmationToken = str(body.confirmationToken, 200)
          const orderRef = str(body.orderRef, 60)
          const plan = getPlan(planKey)

          if (!plan || !BUYABLE.has(planKey)) return json({ error: 'That service can’t be booked online.' }, 400)
          if (!plan.whopPlanId) {
            return json({ error: `Online booking for “${plan.name}” isn’t set up yet. Please call us to book.` }, 503)
          }
          if (!confirmationToken.startsWith('ctok_')) return json({ error: 'Payment details are missing. Please try again.' }, 400)

          const returnUrl = `${siteOrigin(request)}/checkout/return?plan=${encodeURIComponent(planKey)}&order=${encodeURIComponent(orderRef)}`

          const payment = await whopApi<Payment>('/payments', {
            method: 'POST',
            idempotencyKey: `pay-${confirmationToken}`,
            body: {
              account_id: accountId(),
              plan_id: plan.whopPlanId,
              confirmation_token: confirmationToken,
              return_url: returnUrl,
              metadata: {
                flow: planKey,
                order_ref: orderRef,
                property_address: str(body.address, 200),
                phone: str(body.phone, 40),
              },
            },
          })

          return json({ id: payment.id, status: payment.status, client_secret: payment.client_secret ?? null })
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})

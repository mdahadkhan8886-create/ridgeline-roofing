import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/config/site'
import { chargeDeposit } from '#/lib/deposit'
import type { SetupIntent } from '#/lib/deposit'
import { accountId, errorResponse, json, readJson, siteOrigin, str, whopApi } from '#/lib/whop-api'

// Step 1 of the deposit: turn the setup-mode confirmation token into a Whop
// setup intent (card on file), then charge the deposit to that saved card.
export const Route = createFileRoute('/api/deposit')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await readJson(request)
          const confirmationToken = str(body.confirmationToken, 200)
          const jobRef = str(body.jobRef, 60)
          if (!site.plans.deposit.whopPlanId) {
            return json({ error: 'Online deposits aren’t set up yet. Please call us to book your install date.' }, 503)
          }
          if (!confirmationToken.startsWith('ctok_')) {
            return json({ error: 'Card details are missing. Please try again.' }, 400)
          }

          const origin = siteOrigin(request)
          const intent = await whopApi<SetupIntent>('/setup_intents', {
            method: 'POST',
            idempotencyKey: `setup-${confirmationToken}`,
            body: {
              account_id: accountId(),
              confirmation_token: confirmationToken,
              currency: 'usd',
              return_url: `${origin}/checkout/return?flow=deposit&job=${encodeURIComponent(jobRef)}`,
              metadata: {
                flow: 'deposit',
                job_ref: jobRef,
                customer_name: str(body.name, 120),
                phone: str(body.phone, 40),
                property_address: str(body.address, 200),
                zip: str(body.zip, 10),
              },
            },
          })

          if (intent.status === 'succeeded') {
            return json(await chargeDeposit(intent, origin))
          }
          if (intent.status === 'canceled') {
            return json({ error: intent.error_message || 'Your card couldn’t be saved. Try a different card.' }, 402)
          }

          // requires_action (3D Secure, bank step) or processing: the browser
          // finishes the step, then calls /api/deposit-charge.
          return json({
            stage: 'setup_pending',
            setupIntentId: intent.id,
            status: intent.status,
            clientSecret: intent.client_secret ?? null,
          })
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})

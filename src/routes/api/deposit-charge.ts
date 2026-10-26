import { createFileRoute } from '@tanstack/react-router'
import { chargeDeposit, getSetupIntent } from '#/lib/deposit'
import { errorResponse, json, readJson, siteOrigin, str } from '#/lib/whop-api'

const MAX_AGE_MS = 2 * 60 * 60 * 1000

// Step 2 of the deposit, used when saving the card needed an extra step
// (3D Secure or a bank redirect). Charges the deposit once, to that card.
export const Route = createFileRoute('/api/deposit-charge')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await readJson(request)
          const setupIntentId = str(body.setupIntentId, 80)
          if (!setupIntentId.startsWith('sint_')) return json({ error: 'Missing card setup reference.' }, 400)

          const intent = await getSetupIntent(setupIntentId)

          // Only charge cards saved by this site's deposit form, recently.
          const flow = intent.metadata?.flow
          if (flow !== undefined && flow !== 'deposit') return json({ error: 'This card setup isn’t for a deposit.' }, 400)
          const created = intent.created_at ? Date.parse(intent.created_at) : NaN
          if (!Number.isNaN(created) && Date.now() - created > MAX_AGE_MS) {
            return json({ error: 'This deposit link has expired. Please start the deposit again.' }, 410)
          }
          if (intent.status === 'processing' || intent.status === 'requires_action') {
            return json({ stage: 'setup_pending', setupIntentId: intent.id, status: intent.status, clientSecret: null })
          }

          return json(await chargeDeposit(intent, siteOrigin(request)))
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})

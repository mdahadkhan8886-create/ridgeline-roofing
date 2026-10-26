import { createFileRoute } from '@tanstack/react-router'
import { json } from '#/lib/whop-api'

// Public values the browser needs:
//   accountId — the business (biz_…) the payment elements are mounted for
//   appId     — this app's OAuth client ID, for "Sign in with Whop" email verification
// Neither is secret; the API key never leaves Whop's hosting proxy.
export const Route = createFileRoute('/api/public-config')({
  server: {
    handlers: {
      GET: async () =>
        json({
          accountId: process.env.WHOP_ACCOUNT_ID ?? null,
          appId: process.env.APP_ID ?? process.env.WHOP_APP_ID ?? null,
        }),
    },
  },
})

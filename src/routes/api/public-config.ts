import { createFileRoute } from '@tanstack/react-router'
import { json } from '#/lib/whop-api'

// The browser needs the business ID (biz_…) to mount Whop's payment elements.
// It is public information; the API key never leaves Whop's hosting proxy.
export const Route = createFileRoute('/api/public-config')({
  server: {
    handlers: {
      GET: async () => json({ accountId: process.env.WHOP_ACCOUNT_ID ?? null }),
    },
  },
})

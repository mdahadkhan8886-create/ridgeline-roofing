import { createFileRoute } from '@tanstack/react-router'
import { savedMethodId } from '#/lib/deposit'
import type { SetupIntent } from '#/lib/deposit'
import { accountId, checkAdmin, errorResponse, json, whopApi } from '#/lib/whop-api'
import type { WhopList } from '#/lib/whop-api'

interface Lead {
  id: string
  created_at?: string
  metadata?: Record<string, unknown> | null
  user?: { id?: string; email?: string | null; name?: string | null } | null
  referrer?: string | null
}

type CardOnFile = SetupIntent & {
  member?: { id: string; user?: { email?: string | null; name?: string | null } | null } | null
  payment_method?: {
    id: string
    card?: { brand?: string | null; last4?: string | null } | null
  } | null
  payment_instrument?: { display_name?: string | null } | null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

// Contractor console data: recent estimate requests (Leads API) and
// customers with a card on file (Setup Intents API). PIN-protected.
export const Route = createFileRoute('/api/admin/overview')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = checkAdmin(request)
        if (denied) return denied
        try {
          const account = accountId()
          const [leads, intents] = await Promise.all([
            whopApi<WhopList<Lead>>('/leads', { query: { account_id: account, first: 25 } }),
            whopApi<WhopList<CardOnFile>>('/setup_intents', {
              query: { account_id: account, first: 25, direction: 'desc' },
            }),
          ])

          return json({
            leads: (leads.data ?? []).map((lead) => {
              const m = lead.metadata ?? {}
              return {
                id: lead.id,
                createdAt: lead.created_at ?? null,
                name: text(m.name) || lead.user?.name || '',
                email: text(m.email) || lead.user?.email || '',
                phone: text(m.phone),
                address: [text(m.address), text(m.zip)].filter(Boolean).join(', '),
                service: text(m.service),
                timeline: text(m.timeline),
                message: text(m.message),
              }
            }),
            cardsOnFile: (intents.data ?? [])
              .filter((intent) => intent.status === 'succeeded')
              .map((intent) => {
                const m = intent.metadata ?? {}
                const card = intent.payment_method?.card
                return {
                  setupIntentId: intent.id,
                  createdAt: intent.created_at ?? null,
                  memberId: intent.member?.id ?? null,
                  paymentMethodId: savedMethodId(intent),
                  card:
                    intent.payment_instrument?.display_name ||
                    (card?.last4 ? `${card.brand ?? 'Card'} •••• ${card.last4}` : 'Saved payment method'),
                  name: text(m.customer_name) || intent.member?.user?.name || '',
                  email: intent.member?.user?.email || text(m.email),
                  address: [text(m.property_address), text(m.zip)].filter(Boolean).join(', '),
                  jobRef: text(m.job_ref),
                }
              }),
          })
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})

import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/config/site'
import { accountId, errorResponse, json, readJson, str, whopApi } from '#/lib/whop-api'

interface Lead {
  id: string
  created_at?: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// "Request an Estimate" → Whop Leads API (POST /leads).
// Every request lands as a lead on the Whop account, with the details in metadata.
export const Route = createFileRoute('/api/lead')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await readJson(request)

          // Honeypot: bots fill every field; people never see this one.
          if (str(body.company_website)) return json({ ok: true, leadId: null })

          const name = str(body.name, 120)
          const email = str(body.email, 200).toLowerCase()
          const phone = str(body.phone, 40)
          const zip = str(body.zip, 10)
          if (!name) return json({ error: 'Add your name so we know who to ask for.' }, 400)
          if (!EMAIL.test(email)) return json({ error: 'Add a valid email address so we can send your estimate.' }, 400)
          if (!/^\d{5}$/.test(zip)) return json({ error: 'Add the 5-digit ZIP code of the property.' }, 400)

          const metadata: Record<string, string> = {
            source: 'estimate_form',
            name,
            email,
            phone,
            address: str(body.address, 200),
            zip,
            service: str(body.service, 60),
            roof_type: str(body.roofType, 60),
            timeline: str(body.timeline, 60),
            message: str(body.message, 1500),
            in_service_area: site.serviceArea.zips.includes(zip) ? 'yes' : 'no',
          }

          const lead = await whopApi<Lead>('/leads', {
            method: 'POST',
            body: {
              account_id: accountId(),
              product_id: site.whop.productId || undefined,
              referrer: str(body.page, 500) || request.headers.get('referer') || undefined,
              metadata,
            },
          })

          return json({ ok: true, leadId: lead.id })
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})

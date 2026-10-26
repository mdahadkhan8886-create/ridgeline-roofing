import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/config/site'
import { WhopApiError, accountId, errorResponse, json, readJson, str, whopApi } from '#/lib/whop-api'

interface Lead {
  id: string
  created_at?: string
}

interface UserInfo {
  sub: string
  email?: string
  name?: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function oauthOrigin(): string {
  return (process.env.WHOP_API_ORIGIN || 'https://api.whop.com').replace(/\/$/, '')
}

// OAuth calls carry the visitor's own credentials, so tell Whop hosting not to
// attach the app's API key to them.
const NO_APP_KEY = { 'x-whop-inject-key': 'none' }

/** Exchanges the "Sign in with Whop" code (PKCE) and returns the verified Whop user. */
async function verifiedUser(code: string, codeVerifier: string, redirectUri: string): Promise<UserInfo> {
  const clientId = process.env.APP_ID || process.env.WHOP_APP_ID
  if (!clientId) throw new WhopApiError('This site’s Whop app ID is missing.', 500, null)

  const tokenResponse = await fetch(`${oauthOrigin()}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...NO_APP_KEY },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
      ...(process.env.WHOP_OAUTH_CLIENT_SECRET ? { client_secret: process.env.WHOP_OAUTH_CLIENT_SECRET } : {}),
    }),
  })
  const tokens = (await tokenResponse.json().catch(() => ({}))) as {
    access_token?: string
    error?: string
    error_description?: string
  }
  if (!tokenResponse.ok || !tokens.access_token) {
    console.error('[oauth] token exchange failed', tokenResponse.status, JSON.stringify(tokens).slice(0, 300))
    throw new WhopApiError('We couldn’t confirm your email with Whop. Please try again.', 401, tokens)
  }

  const infoResponse = await fetch(`${oauthOrigin()}/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: 'application/json', ...NO_APP_KEY },
  })
  const info = (await infoResponse.json().catch(() => ({}))) as Partial<UserInfo>
  if (!infoResponse.ok || !info.sub) {
    console.error('[oauth] userinfo failed', infoResponse.status, JSON.stringify(info).slice(0, 300))
    throw new WhopApiError('We couldn’t confirm your email with Whop. Please try again.', 401, info)
  }
  return { sub: info.sub, email: info.email, name: info.name }
}

// "Request an Estimate" → Whop Leads API (POST /leads).
// The homeowner confirms their email with "Sign in with Whop"; the lead is then
// created for that Whop user, with the request details in metadata.
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

          const code = str(body.code, 500)
          const codeVerifier = str(body.codeVerifier, 200)
          const redirectUri = str(body.redirectUri, 300)
          if (!code || !codeVerifier) return json({ error: 'Please confirm your email to send the request.' }, 400)
          if (!/^https?:\/\/[^/]+\/estimate\/verified$/.test(redirectUri)) return json({ error: 'Invalid verification link.' }, 400)

          const user = await verifiedUser(code, codeVerifier, redirectUri)

          const metadata: Record<string, string> = {
            source: 'estimate_form',
            name,
            email,
            verified_email: user.email ?? '',
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
              user_id: user.sub,
              product_id: site.whop.productId || undefined,
              referrer: str(body.page, 500) || undefined,
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

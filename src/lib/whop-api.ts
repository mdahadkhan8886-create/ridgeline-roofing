/**
 * Server-side Whop API helper.
 *
 * On Whop hosting, server-side requests to WHOP_API_ORIGIN are signed by the
 * platform with the app's own API key — the key never reaches this code.
 * Locally, `whop apps dev` exports a short-lived WHOP_API_KEY instead, which we
 * attach ourselves.
 *
 * Only import this from server route handlers.
 */

export class WhopApiError extends Error {
  status: number
  body: unknown
  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

function env(name: string): string | undefined {
  const value = process.env[name]
  return value && value.length > 0 ? value : undefined
}

export function accountId(): string {
  const id = env('WHOP_ACCOUNT_ID')
  if (!id) {
    throw new WhopApiError(
      'WHOP_ACCOUNT_ID is not set. Run the site with `whop apps dev` locally or deploy it with `whop apps deploy`.',
      500,
      null,
    )
  }
  return id
}

function apiOrigin(): string {
  return (env('WHOP_API_ORIGIN') ?? 'https://api.whop.com').replace(/\/$/, '')
}

interface WhopRequest {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | undefined>
  idempotencyKey?: string
}

export async function whopApi<T = Record<string, unknown>>(
  path: string,
  { method = 'GET', body, query, idempotencyKey }: WhopRequest = {},
): Promise<T> {
  const url = new URL(`${apiOrigin()}/api/v1${path}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
  const localKey = env('WHOP_API_KEY')
  if (localKey) headers.Authorization = `Bearer ${localKey}`

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await response.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    const message =
      (data as { error?: { message?: string } } | null)?.error?.message ??
      `Whop API ${method} ${path} failed with ${response.status}`
    console.error('[whop-api]', method, path, response.status, text.slice(0, 500))
    throw new WhopApiError(message, response.status, data)
  }

  return data as T
}

/** JSON response helper for route handlers. */
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

/** Turns any thrown error into a JSON error response. */
export function errorResponse(error: unknown): Response {
  if (error instanceof WhopApiError) {
    return json({ error: error.message }, error.status >= 400 && error.status < 600 ? error.status : 500)
  }
  console.error('[server]', error)
  return json({ error: 'Something went wrong on our side. Please try again or call us.' }, 500)
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const data = await request.json()
    return data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export function str(value: unknown, max = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export function siteOrigin(request: Request): string {
  return new URL(request.url).origin
}

/** Checks the contractor console PIN against the ADMIN_PIN app secret. */
export function checkAdmin(request: Request): Response | null {
  const pin = env('ADMIN_PIN')
  if (!pin) {
    return json(
      {
        error:
          'The contractor console is turned off. Set a PIN with: whop apps secrets set --secret ADMIN_PIN=your-pin',
      },
      503,
    )
  }
  const given = request.headers.get('x-admin-pin') ?? ''
  if (!timingSafeEqual(given, pin)) return json({ error: 'Wrong PIN.' }, 401)
  return null
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Whop list endpoints return { data, page_info }. */
export interface WhopList<T> {
  data: T[]
}

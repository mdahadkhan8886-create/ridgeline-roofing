/**
 * "Sign in with Whop" (OAuth 2.1 + PKCE), used to verify an estimate
 * requester's email. Whop's Leads API records every lead against a Whop user,
 * so the homeowner confirms their email with a one-time code on Whop (signing in
 * or creating a free account) and the lead is created for that user.
 */

const DRAFT_KEY = 'rr_estimate_draft'
const MAX_AGE_MS = 60 * 60 * 1000

export interface EstimateDraft {
  form: Record<string, string>
  page: string
  verifier: string
  state: string
  createdAt: number
}

function base64url(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomString(length: number): string {
  return base64url(crypto.getRandomValues(new Uint8Array(length)))
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return base64url(new Uint8Array(digest))
}

export function verifiedRedirectUri(): string {
  return `${window.location.origin}/estimate/verified`
}

/** Saves the form, then sends the visitor to Whop to confirm their email. */
export async function startEmailVerification(appId: string, form: Record<string, string>): Promise<void> {
  const draft: EstimateDraft = {
    form,
    page: window.location.href,
    verifier: randomString(32),
    state: randomString(16),
    createdAt: Date.now(),
  }
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: appId,
    redirect_uri: verifiedRedirectUri(),
    scope: 'openid profile email',
    state: draft.state,
    nonce: randomString(16),
    code_challenge: await sha256(draft.verifier),
    code_challenge_method: 'S256',
  })
  if (form.email) params.set('login_hint', form.email)

  window.location.assign(`https://api.whop.com/oauth/authorize?${params.toString()}`)
}

export function readDraft(): EstimateDraft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as EstimateDraft
    if (!draft?.form || Date.now() - draft.createdAt > MAX_AGE_MS) return null
    return draft
  } catch {
    return null
  }
}

export function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * "Sign in with Whop" (OAuth 2.1 + PKCE), used to verify an estimate
 * requester's email. Whop's Leads API records every lead against a Whop user,
 * so the homeowner confirms their email with a one-time code on Whop (signing in
 * or creating a free account) and the lead is created for that user.
 *
 * Preferred flow: Whop opens in a small pop-up and the form never leaves the
 * page. If the browser blocks pop-ups, the whole tab goes to Whop instead and
 * /estimate/verified finishes the request (the "redirect" flow).
 */

const DRAFT_KEY = 'rr_estimate_draft'
const PENDING_KEY = 'rr_oauth_pending'
const RESULT_KEY = 'rr_oauth_result'
const CHANNEL = 'rr-oauth'
const MAX_AGE_MS = 60 * 60 * 1000

export interface EstimateDraft {
  form: Record<string, string>
  page: string
  verifier: string
  state: string
  createdAt: number
}

export interface OAuthResult {
  state: string
  code?: string
  error?: string
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

async function authorizeUrl(appId: string, draft: EstimateDraft, email?: string): Promise<string> {
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
  if (email) params.set('login_hint', email)
  return `https://api.whop.com/oauth/authorize?${params.toString()}`
}

function newDraft(form: Record<string, string>): EstimateDraft {
  return { form, page: window.location.href, verifier: randomString(32), state: randomString(16), createdAt: Date.now() }
}

/** Redirect flow: saves the form, then sends the whole tab to Whop. */
export async function startEmailVerification(appId: string, form: Record<string, string>): Promise<void> {
  const draft = newDraft(form)
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  window.location.assign(await authorizeUrl(appId, draft, form.email))
}

/**
 * Opens an empty pop-up. Call this synchronously inside the click/submit
 * handler (before any await) so the browser doesn't block it.
 */
export function openVerifyPopup(): Window | null {
  const width = 480
  const height = 720
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2)
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2)
  const popup = window.open('', 'rr-whop-verify', `popup=yes,width=${width},height=${height},left=${left},top=${top}`)
  if (popup) {
    try {
      popup.document.title = 'Confirm your email'
      popup.document.body.style.cssText = 'margin:0;display:grid;place-items:center;height:100vh;background:#0a0f13;color:#eef3f6;font:16px system-ui'
      popup.document.body.textContent = 'Opening Whop…'
    } catch {
      /* not critical */
    }
  }
  return popup
}

/**
 * Pop-up flow: points the pop-up at Whop and resolves with the one-time code
 * once the homeowner confirms their email. The pop-up reports back through a
 * same-origin BroadcastChannel (with a localStorage fallback), which keeps
 * working even when Whop's pages cut the window.opener link.
 */
export async function verifyInPopup(
  popup: Window,
  appId: string,
  form: Record<string, string>,
  signal?: AbortSignal,
): Promise<{ code: string; verifier: string; redirectUri: string; draft: EstimateDraft }> {
  const draft = newDraft(form)
  // Also keep a redirect-flow draft, so a pop-up that turned into a tab still works.
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  window.localStorage.setItem(PENDING_KEY, draft.state)
  window.localStorage.removeItem(RESULT_KEY)
  popup.location.href = await authorizeUrl(appId, draft, form.email)

  return new Promise((resolve, reject) => {
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null
    let settled = false

    const finish = (result: OAuthResult | null, reason?: string) => {
      if (settled) return
      if (result && result.state !== draft.state) return
      settled = true
      channel?.close()
      window.removeEventListener('storage', onStorage)
      window.clearInterval(poll)
      window.clearTimeout(timeout)
      window.localStorage.removeItem(PENDING_KEY)
      window.localStorage.removeItem(RESULT_KEY)
      if (reason) return reject(new Error(reason))
      if (!result?.code) return reject(new Error('Email confirmation was cancelled, so your request wasn’t sent. Try again.'))
      try {
        popup.close()
      } catch {
        /* already closed */
      }
      resolve({ code: result.code, verifier: draft.verifier, redirectUri: verifiedRedirectUri(), draft })
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === RESULT_KEY && event.newValue) finish(JSON.parse(event.newValue) as OAuthResult)
    }
    if (channel) channel.onmessage = (event: MessageEvent<OAuthResult>) => finish(event.data)
    window.addEventListener('storage', onStorage)

    // Whop's pages can sever window.opener, which makes popup.closed read true
    // while the window is still open, so it isn't used to give up. The visitor
    // can cancel (signal) and the wait times out after 15 minutes.
    const poll = window.setInterval(() => {
      const stored = window.localStorage.getItem(RESULT_KEY)
      if (stored) finish(JSON.parse(stored) as OAuthResult)
    }, 500)
    const timeout = window.setTimeout(() => finish(null, 'Email confirmation timed out. Please try again.'), 15 * 60 * 1000)
    signal?.addEventListener('abort', () => {
      try {
        popup.close()
      } catch {
        /* ignore */
      }
      finish(null, 'Email confirmation was cancelled. Your answers are still here.')
    })
  })
}

/**
 * Runs on /estimate/verified. If this window is the pop-up, hands the result
 * to the form that opened it and returns true; otherwise returns false.
 */
export function reportToOpener(result: OAuthResult): boolean {
  try {
    if (window.localStorage.getItem(PENDING_KEY) !== result.state) return false
    window.localStorage.setItem(RESULT_KEY, JSON.stringify(result))
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(CHANNEL)
      channel.postMessage(result)
      channel.close()
    }
    return true
  } catch {
    return false
  }
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

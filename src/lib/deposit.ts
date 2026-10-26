/**
 * Deposit flow (server side):
 *
 *   1. Save the buyer's card with a Whop setup intent (card on file).
 *   2. Charge the $500 deposit plan to that saved card, off-session.
 *   3. Later, the contractor bills the final balance with the Invoices API,
 *      either auto-charging the same saved card or emailing a pay link.
 */
import { site } from '#/config/site'
import { WhopApiError, accountId, whopApi } from '#/lib/whop-api'

export interface SetupIntent {
  id: string
  status: 'processing' | 'succeeded' | 'canceled' | 'requires_action' | string
  client_secret?: string | null
  created_at?: string
  error_message?: string | null
  metadata?: Record<string, unknown> | null
  member?: { id: string } | null
  payment_method_id?: string | null
  payment_method?: { id: string } | null
}

interface Payment {
  id: string
  status: string
  client_secret?: string | null
}

export function savedMethodId(intent: SetupIntent): string | null {
  return intent.payment_method_id ?? intent.payment_method?.id ?? null
}

export async function getSetupIntent(id: string): Promise<SetupIntent> {
  return whopApi<SetupIntent>(`/setup_intents/${encodeURIComponent(id)}`)
}

/**
 * The setup intent normally names the member the card was saved for. If it
 * doesn't, look the member up by the email the homeowner gave us.
 */
async function findMemberId(intent: SetupIntent): Promise<string | undefined> {
  const email = typeof intent.metadata?.email === 'string' ? intent.metadata.email : ''
  if (!email) return undefined
  try {
    const members = await whopApi<{ data?: Array<{ id: string }> }>('/members', {
      query: { account_id: accountId(), query: email, first: 1 },
    })
    return members.data?.[0]?.id
  } catch {
    return undefined
  }
}

/** Charges the deposit plan to the card saved by a succeeded setup intent. */
export async function chargeDeposit(intent: SetupIntent, origin: string) {
  const plan = site.plans.deposit
  if (!plan.whopPlanId) {
    throw new WhopApiError('The deposit plan isn’t set up yet. Add its plan ID to src/config/site.ts.', 503, null)
  }
  const memberId = intent.member?.id ?? (await findMemberId(intent))
  const paymentMethodId = savedMethodId(intent)
  if (intent.status !== 'succeeded' || !paymentMethodId) {
    throw new WhopApiError('Your card wasn’t saved yet, so the deposit wasn’t charged. Please try again.', 409, null)
  }
  if (!memberId) {
    console.error('[deposit] card saved but no member found', intent.id, JSON.stringify({ member: intent.member ?? null }))
    throw new WhopApiError(
      'Your card is saved, but the deposit couldn’t be charged automatically. We’ll call you to finish booking — you haven’t been charged.',
      409,
      null,
    )
  }

  const jobRef = typeof intent.metadata?.job_ref === 'string' ? intent.metadata.job_ref : ''

  const payment = await whopApi<Payment>('/payments', {
    method: 'POST',
    // One deposit per saved card, however many times this runs.
    idempotencyKey: `deposit-${intent.id}`,
    body: {
      account_id: accountId(),
      plan_id: plan.whopPlanId,
      member_id: memberId,
      payment_method_id: paymentMethodId,
      return_url: `${origin}/checkout/return?flow=deposit&job=${encodeURIComponent(jobRef)}`,
      metadata: {
        flow: 'deposit',
        job_ref: jobRef,
        setup_intent_id: intent.id,
      },
    },
  })

  return {
    stage: 'charged' as const,
    paymentId: payment.id,
    status: payment.status,
    clientSecret: payment.client_secret ?? null,
    setupIntentId: intent.id,
    jobRef,
  }
}

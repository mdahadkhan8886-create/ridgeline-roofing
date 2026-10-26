import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/config/site'
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

interface Payment {
  id: string
  status?: string | null
  total?: number | null
  usd_total?: number | null
  created_at?: string | null
  paid_at?: string | null
  plan?: { id: string } | null
  user?: { id?: string; email?: string | null; name?: string | null } | null
  metadata?: Record<string, unknown> | null
}

interface Invoice {
  id: string
  number?: string | number | null
  status?: string | null
  email_address?: string | null
  created_at?: string | null
  due_date?: string | null
  current_plan?: { formatted_price?: string | null } | null
  user?: { id?: string; name?: string | null } | null
}

export type Stage = 'lead' | 'booked' | 'deposit' | 'invoiced' | 'paid'
const ORDER: Stage[] = ['lead', 'booked', 'deposit', 'invoiced', 'paid']

export interface Job {
  key: string
  name: string
  email: string
  address: string
  stage: Stage
  updatedAt: string | null
  steps: Partial<Record<Stage, { at: string | null; detail: string }>>
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function money(n: number | null | undefined): string {
  return typeof n === 'number' ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : ''
}

function later(a: string | null, b: string | null): string | null {
  if (!a) return b
  if (!b) return a
  return Date.parse(a) > Date.parse(b) ? a : b
}

/** Joins leads, payments, saved cards and invoices into one card per customer. */
function buildPipeline(leads: Lead[], payments: Payment[], cards: CardOnFile[], invoices: Invoice[]): Job[] {
  const jobs = new Map<string, Job>()
  const plans = site.plans
  const job = (email: string, fallbackKey: string) => {
    const key = email.trim().toLowerCase() || fallbackKey
    let j = jobs.get(key)
    if (!j) {
      j = { key, name: '', email: email.trim().toLowerCase(), address: '', stage: 'lead', updatedAt: null, steps: {} }
      jobs.set(key, j)
    }
    return j
  }
  const mark = (j: Job, stage: Stage, at: string | null, detail: string) => {
    if (!j.steps[stage]) j.steps[stage] = { at, detail }
    if (ORDER.indexOf(stage) > ORDER.indexOf(j.stage)) j.stage = stage
    j.updatedAt = later(j.updatedAt, at)
  }

  for (const lead of leads) {
    const m = lead.metadata ?? {}
    const j = job(text(m.email) || lead.user?.email || '', lead.id)
    j.name ||= text(m.name) || lead.user?.name || ''
    j.address ||= [text(m.address), text(m.zip)].filter(Boolean).join(', ')
    mark(j, 'lead', lead.created_at ?? null, `Estimate request · ${text(m.service) || 'roof'}`)
  }

  for (const p of payments) {
    if (p.status !== 'paid') continue
    const planId = p.plan?.id
    const j = job(p.user?.email || '', p.id)
    j.name ||= p.user?.name || ''
    const at = p.paid_at ?? p.created_at ?? null
    if (planId && planId === plans.deposit.whopPlanId) mark(j, 'deposit', at, `Deposit paid ${money(p.total)}`)
    else if (planId && planId === plans.inspection.whopPlanId) mark(j, 'booked', at, `Inspection paid ${money(p.total)}`)
    else if (planId && planId === plans.flatRate.whopPlanId) mark(j, 'booked', at, `${plans.flatRate.name} paid ${money(p.total)}`)
  }

  for (const c of cards) {
    if (c.status !== 'succeeded') continue
    const m = c.metadata ?? {}
    const j = job(c.member?.user?.email || text(m.email), c.id)
    j.name ||= text(m.customer_name) || c.member?.user?.name || ''
    j.address ||= [text(m.property_address), text(m.zip)].filter(Boolean).join(', ')
    const card = c.payment_method?.card
    const label = c.payment_instrument?.display_name || (card?.last4 ? `${card.brand ?? 'Card'} •••• ${card.last4}` : 'Card')
    mark(j, 'deposit', c.created_at ?? null, `${label} saved on file`)
  }

  for (const inv of invoices) {
    const j = job(inv.email_address || '', inv.id)
    j.name ||= inv.user?.name || ''
    const price = inv.current_plan?.formatted_price ?? ''
    const label = `Invoice ${inv.number ? `#${inv.number}` : ''} ${price}`.replace(/\s+/g, ' ').trim()
    if (inv.status === 'paid') {
      mark(j, 'invoiced', inv.created_at ?? null, `${label} sent`)
      mark(j, 'paid', inv.created_at ?? null, `${label} paid`)
    } else if (inv.status === 'open' || inv.status === 'past_due' || inv.status === 'draft') {
      mark(j, 'invoiced', inv.created_at ?? null, `${label} ${inv.status === 'past_due' ? 'past due' : inv.status}`)
    }
  }

  return [...jobs.values()].sort((a, b) => Date.parse(b.updatedAt ?? '0') - Date.parse(a.updatedAt ?? '0')).slice(0, 60)
}

// Contractor console data, all read live from Whop: estimate requests (Leads),
// payments, cards on file (Setup Intents) and final invoices (Invoices),
// joined into a jobs pipeline. PIN-protected.
export const Route = createFileRoute('/api/admin/overview')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = checkAdmin(request)
        if (denied) return denied
        try {
          const account = accountId()
          const [leads, intents, payments, invoices] = await Promise.allSettled([
            whopApi<WhopList<Lead>>('/leads', { query: { account_id: account, first: 50 } }),
            whopApi<WhopList<CardOnFile>>('/setup_intents', { query: { account_id: account, first: 50, direction: 'desc' } }),
            whopApi<WhopList<Payment>>('/payments', { query: { account_id: account, first: 50, direction: 'desc' } }),
            whopApi<WhopList<Invoice>>('/invoices', { query: { account_id: account, first: 50, direction: 'desc' } }),
          ])
          const list = <T,>(r: PromiseSettledResult<WhopList<T>>): T[] => (r.status === 'fulfilled' ? (r.value.data ?? []) : [])
          if (leads.status === 'rejected' && intents.status === 'rejected') throw leads.reason

          const leadRows = list(leads)
          const cardRows = list(intents)
          const paymentRows = list(payments)
          const invoiceRows = list(invoices)

          return json({
            pipeline: buildPipeline(leadRows, paymentRows, cardRows, invoiceRows),
            warnings: [
              payments.status === 'rejected' ? 'Payments couldn’t be loaded.' : null,
              invoices.status === 'rejected' ? 'Invoices couldn’t be loaded.' : null,
            ].filter(Boolean),
            leads: leadRows.map((lead) => {
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
            cardsOnFile: cardRows
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
            invoices: invoiceRows.map((inv) => ({
              id: inv.id,
              number: inv.number ?? null,
              status: inv.status ?? null,
              email: inv.email_address ?? '',
              name: inv.user?.name ?? '',
              amount: inv.current_plan?.formatted_price ?? '',
              createdAt: inv.created_at ?? null,
              dueDate: inv.due_date ?? null,
            })),
          })
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})

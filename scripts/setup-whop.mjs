#!/usr/bin/env node
/**
 * One-time setup with the Whop CLI:
 *   1. creates the Whop product and the three plans this site sells (inspection
 *      fee, project deposit, flat-rate service) and writes their IDs into
 *      src/config/site.ts;
 *   2. turns on "Sign in with Whop" for this app (public OAuth client + the
 *      /estimate/verified return address on every domain), which the estimate
 *      form uses to confirm the homeowner's email before creating the lead.
 *
 *   node scripts/setup-whop.mjs
 *
 * Needs the Whop CLI signed in to the right business (`whop quickstart`).
 * Safe to re-run: anything that already has an ID in the config is skipped.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const configPath = path.join(root, 'src/config/site.ts')
let config = readFileSync(configPath, 'utf8')

function whopJson(args) {
  const out = execFileSync('whop', [...args, '--format', 'json'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    shell: process.platform === 'win32',
  })
  try {
    return { out, data: JSON.parse(out) }
  } catch {
    return { out, data: null }
  }
}

function whop(args) {
  const { out, data } = whopJson(args)
  const id = data?.id ?? data?.data?.id ?? data?.result?.id ?? out.match(/"id"\s*:\s*"([a-z]+_[A-Za-z0-9]+)"/)?.[1]
  if (!id) {
    console.error(out)
    throw new Error(`Couldn't read an ID from: whop ${args.join(' ')}`)
  }
  return id
}

/** Finds the `key: { ... }` block for a plan inside `plans: { ... }`. */
function planBlock(key) {
  const plansStart = config.indexOf('plans: {')
  const start = config.indexOf(`${key}: {`, plansStart)
  if (plansStart < 0 || start < 0) throw new Error(`Couldn't find plan "${key}" in src/config/site.ts`)
  const end = config.indexOf('\n    },', start)
  return { start, end, text: config.slice(start, end) }
}

function field(text, name) {
  const m = text.match(new RegExp(`${name}:\\s*(?:'([^']*)'|"([^"]*)"|([0-9.]+))`))
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined
}

const company = field(config.slice(config.indexOf('company: {')), 'name') ?? 'Roofing'

// 1. Product
let productId = field(config.slice(config.indexOf('whop: {')), 'productId')
if (!productId) {
  console.log(`Creating product "${company} Services"…`)
  productId = whop(['products', 'create', '--title', `${company} Services`.slice(0, 80)])
  config = config.replace(/(whop: \{\s*productId:\s*)''/, `$1'${productId}'`)
  writeFileSync(configPath, config)
}
console.log(`  product   ${productId}`)

// 2. Plans
for (const key of ['inspection', 'deposit', 'flatRate']) {
  const block = planBlock(key)
  const existing = field(block.text, 'whopPlanId')
  const name = field(block.text, 'name')
  const price = Number(field(block.text, 'price'))
  if (existing) {
    console.log(`  ${key.padEnd(12)}${existing} (already set)`)
    continue
  }
  if (!name || !Number.isFinite(price)) throw new Error(`Plan "${key}" needs a name and a price in the config.`)

  console.log(`Creating plan "${name}" at $${price}…`)
  const planId = whop([
    'variants',
    'create',
    '--product_id',
    productId,
    '--title',
    name.slice(0, 30),
    '--plan_type',
    'one_time',
    '--initial_price',
    String(price),
    '--unlimited_stock',
  ])
  const updated = block.text.replace(/whopPlanId:\s*''/, `whopPlanId: '${planId}'`)
  config = config.slice(0, block.start) + updated + config.slice(block.end)
  writeFileSync(configPath, config)
  console.log(`  ${key.padEnd(12)}${planId}`)
}

// 3. "Sign in with Whop" for the estimate form's email check
const appId = JSON.parse(readFileSync(path.join(root, 'whop.app.json'), 'utf8')).app_id
const { data: appData } = whopJson(['apps', 'get', appId])
const app = appData?.data ?? appData ?? {}
const hosts = new Set((app.domains ?? []).map((d) => d.domain).filter(Boolean))
if (app.base_url) hosts.add(new URL(app.base_url).host)
const redirectUris = [...[...hosts].map((h) => `https://${h}/estimate/verified`), 'http://localhost:3000/estimate/verified']
console.log('Turning on "Sign in with Whop" for estimate requests…')
whopJson(['apps', 'update', appId, '--oauth_client_type', 'public', '--redirect_uris', JSON.stringify(redirectUris)])
for (const uri of redirectUris) console.log(`  return URL  ${uri}`)

console.log('\nDone. IDs saved to src/config/site.ts. Next: whop apps deploy')

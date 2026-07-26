import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const root = new URL("../", import.meta.url)
const read = (path) => readFile(new URL(path, root), "utf8")

test("production probes use the unified multi-zone paths", async () => {
  for (const file of ["scripts/smoke.mjs", "scripts/monitor.mjs"]) {
    const source = await read(file)
    assert.match(source, /arcsuite-app\.vercel\.app\/treasury/)
    assert.match(source, /arcsuite-app\.vercel\.app\/reputation/)
    assert.match(source, /arcsuite-app\.vercel\.app\/marketplace/)
  }
})

test("smoke proof expectations match the proof page", async () => {
  const [smoke, proof] = await Promise.all([
    read("scripts/smoke.mjs"),
    read("landing/src/app/proof/page.tsx"),
  ])
  for (const text of ["Settlement proof", "Settlement evidence", "Policy chain"]) {
    assert.ok(smoke.includes(text), `smoke is missing ${text}`)
    assert.ok(proof.includes(text), `proof page is missing ${text}`)
  }
})

test("all Next.js apps define the baseline CSP", async () => {
  for (const file of [
    "landing/next.config.ts",
    "treasury/next.config.ts",
    "reputation/next.config.ts",
    "marketplace/next.config.ts",
  ]) {
    const source = await read(file)
    assert.match(source, /Content-Security-Policy/)
    assert.match(source, /frame-ancestors 'none'/)
    assert.match(source, /object-src 'none'/)
  }
})

test("distributed rate limiting is consumed atomically", async () => {
  const [rateLimit, migration] = await Promise.all([
    read("landing/src/lib/backend/rate-limit.ts"),
    read("landing/supabase/migrations/2026071801_atomic_rate_limit.sql"),
  ])
  assert.match(rateLimit, /consumeSupabaseRateLimit/)
  assert.match(await read("landing/src/lib/backend/supabase.ts"), /consumeLegacySupabaseRateLimit/)
  assert.match(migration, /pg_advisory_xact_lock/)
  assert.match(migration, /current_count >= p_max/)
  assert.match(migration, /grant execute .* service_role/i)
})

test("money execution is gated by signed server policy", async () => {
  const [route, policy, client] = await Promise.all([
    read("landing/src/app/api/money/preflight/route.ts"),
    read("landing/src/lib/backend/money-policy.ts"),
    read("landing/src/app/money/MoneyMovementClient.tsx"),
  ])
  assert.match(route, /verifyMessage/)
  assert.match(route, /screenCircleAddress/)
  assert.match(route, /money_preflight/)
  assert.match(route, /money_preflight_nonce/)
  assert.match(route, /authorization_replayed/)
  assert.match(policy, /KESTREL_MONEY_EXECUTION_ENABLED/)
  assert.match(policy, /ARC_SETTLEMENT_ALLOWED_RECIPIENTS/)
  assert.match(client, /authorizeMoneyMovement/)
  assert.match(client, /personal_sign/)
})

test("Kestrel publishing metadata includes app and social assets", async () => {
  const [layout, manifest, socialImage] = await Promise.all([
    read("landing/src/app/layout.tsx"),
    read("landing/src/app/manifest.ts"),
    read("landing/src/app/opengraph-image.tsx"),
  ])
  assert.match(layout, /summary_large_image/)
  assert.match(manifest, /Built on Arc/)
  assert.match(socialImage, /Move money\. Apply policy\. Keep proof\./)
})

test("Money Movement is present in every product navigation", async () => {
  const files = [
    "landing/src/app/EcosystemNav.tsx",
    "treasury/src/components/dashboard/EcosystemNav.tsx",
    "reputation/src/components/dashboard/EcosystemNav.tsx",
    "marketplace/src/components/dashboard/EcosystemNav.tsx",
  ]
  for (const file of files) {
    const source = await read(file)
    assert.match(source, /label: "Money Movement"/)
    assert.match(source, /\/money/)
  }
})

test("Gateway lifecycle webhooks reconcile transfer IDs and final states", async () => {
  const webhook = await read("landing/src/lib/backend/circle-webhook.ts")
  for (const event of ["gateway.deposit.finalized", "gateway.mint.forwarded", "gateway.mint.finalized"]) {
    assert.ok(webhook.includes(event), `Gateway webhook mapping is missing ${event}`)
  }
  assert.match(webhook, /payload\.transferId/)
  assert.match(webhook, /"CONFIRMED"/)
})

test("browser Money Movement never exposes an App Kit secret", async () => {
  const client = await read("landing/src/app/money/MoneyMovementClient.tsx")
  assert.doesNotMatch(client, /NEXT_PUBLIC_CIRCLE_APP_KIT_KEY/)
  assert.match(client, /Swap is fail-closed/)
  assert.match(client, /server-side Circle Wallets or Turnkey adapter/)
})

test("ecosystem audit and Radar include the new settlement direction", async () => {
  const [audit, radar, money] = await Promise.all([
    read("docs/ARC_ECOSYSTEM_AUDIT_2026-07-26.md"),
    read("landing/src/app/radar/RadarClient.tsx"),
    read("landing/src/app/money/MoneyMovementClient.tsx"),
  ])
  for (const signal of ["Wirex", "Cycles", "Pulsar"]) {
    assert.ok(audit.includes(signal), `audit is missing ${signal}`)
    assert.ok(radar.includes(signal), `Radar is missing ${signal}`)
  }
  assert.match(money, /Card settlement control plane/)
  assert.match(money, /USDC · EURC/)
})

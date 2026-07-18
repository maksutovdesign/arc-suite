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

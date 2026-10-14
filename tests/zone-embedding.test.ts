import assert from "node:assert/strict"
import test from "node:test"
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match.js"
import configuration from "../landing/next.config.ts"

async function headersFor(path: string) {
  const headers = new Headers()
  const rules = await configuration.headers!()
  // Next applies matching headers in order; the last value for a key wins.
  for (const rule of rules) {
    if (!getPathMatch(rule.source)(path)) continue
    for (const header of rule.headers) headers.set(header.key, header.value)
  }
  return headers
}

test("the shared host preserves no-embedding headers on product roots and nested routes", async () => {
  for (const product of ["treasury", "reputation", "marketplace"]) {
    for (const suffix of ["", "/", "/agents", "/api/agents", "/_next/static/app.js"]) {
      const headers = await headersFor(`/${product}${suffix}`)
      assert.match(headers.get("content-security-policy") ?? "", /frame-ancestors 'none';/)
      assert.doesNotMatch(headers.get("content-security-policy") ?? "", /maksutovdesign\.ru/)
      assert.equal(headers.get("x-frame-options"), "DENY")
      assert.equal(headers.get("x-content-type-options"), "nosniff")
    }
  }
})

test("landing pages and similar non-product paths retain the explicit portfolio policy", async () => {
  for (const path of ["/", "/grant", "/money", "/treasuryish", "/reputation-history", "/marketplace-preview"]) {
    const headers = await headersFor(path)
    assert.match(headers.get("content-security-policy") ?? "", /frame-ancestors 'self' https:\/\/maksutovdesign\.ru;/)
    assert.equal(headers.get("x-frame-options"), null)
  }
})

test("landing API cache and security headers survive the product-specific overrides", async () => {
  const headers = await headersFor("/api/money/preflight")
  assert.match(headers.get("cache-control") ?? "", /no-store/)
  assert.match(headers.get("content-security-policy") ?? "", /frame-ancestors 'self' https:\/\/maksutovdesign\.ru;/)
  assert.equal(headers.get("x-content-type-options"), "nosniff")
  assert.equal(headers.get("x-frame-options"), null)
})

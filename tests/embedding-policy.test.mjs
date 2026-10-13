import assert from "node:assert/strict"
import test from "node:test"
import { assertEmbeddingPolicy } from "../scripts/embedding-policy.mjs"

test("landing embedding is limited to the configured portfolio and self", () => {
  const headers = new Headers({ "Content-Security-Policy": "default-src 'self'; frame-ancestors 'self' https://maksutovdesign.ru; object-src 'none'" })
  assert.doesNotThrow(() => assertEmbeddingPolicy(headers, true))
  for (const value of ["frame-ancestors *", "frame-ancestors 'self' https://maksutovdesign.ru https://example.com", "frame-ancestors 'none'", "frame-ancestors 'self' https://maksutovdesign.ru; frame-ancestors *"]) {
    assert.throws(() => assertEmbeddingPolicy(new Headers({ "Content-Security-Policy": value }), true))
  }
  headers.set("X-Frame-Options", "DENY")
  assert.throws(() => assertEmbeddingPolicy(headers, true))
})

test("product zones continue to prohibit embedding", () => {
  const headers = new Headers({ "Content-Security-Policy": "frame-ancestors 'none';", "X-Frame-Options": "DENY" })
  assert.doesNotThrow(() => assertEmbeddingPolicy(headers, false))
  headers.delete("X-Frame-Options")
  assert.throws(() => assertEmbeddingPolicy(headers, false))
})

import assert from "node:assert/strict"
import test from "node:test"
import { SupabaseReadTimeoutError, withSupabaseReadDeadline } from "../landing/src/lib/backend/supabase-read-deadline.ts"

test("stalled reads abort once and return a timeout without retrying", async () => {
  let signal: AbortSignal | undefined
  let reads = 0
  await assert.rejects(withSupabaseReadDeadline((requestSignal) => {
    signal = requestSignal
    reads += 1
    return new Promise(() => {})
  }, 20), SupabaseReadTimeoutError)
  assert.equal(signal?.aborted, true)
  assert.equal(reads, 1)
  assert.ok(signal?.reason instanceof SupabaseReadTimeoutError)
})

test("response headers alone do not stop the deadline while JSON is stalled", async () => {
  let headersReceived = false
  let signal: AbortSignal | undefined
  await assert.rejects(withSupabaseReadDeadline(async (requestSignal) => {
    signal = requestSignal
    const response = new Response(new ReadableStream({ start() {} }))
    headersReceived = response.ok
    return response.json()
  }, 20), SupabaseReadTimeoutError)
  assert.equal(headersReceived, true)
  assert.equal(signal?.aborted, true)
})

test("successful JSON reads preserve data and cancel the deadline", async () => {
  let signal: AbortSignal | undefined
  const data = await withSupabaseReadDeadline(async (requestSignal) => {
    signal = requestSignal
    return Response.json([{ id: "proof-1" }]).json()
  }, 20)
  assert.deepEqual(data, [{ id: "proof-1" }])
  await new Promise((resolve) => setTimeout(resolve, 40))
  assert.equal(signal?.aborted, false)
})

test("ordinary read errors are preserved and do not later abort the signal", async () => {
  const original = new Error("read unavailable")
  let signal: AbortSignal | undefined
  await assert.rejects(withSupabaseReadDeadline(async (requestSignal) => {
    signal = requestSignal
    throw original
  }, 20), (error) => error === original)
  await new Promise((resolve) => setTimeout(resolve, 40))
  assert.equal(signal?.aborted, false)
})

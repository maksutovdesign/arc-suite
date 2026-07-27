import { NextResponse } from "next/server"
import { consumeSupabaseRateLimit, deleteSupabaseRateLimitEventsBefore } from "./supabase"

type RateLimitInput = {
  bucketKey?: string | null
  ipHash?: string | null
  max: number
  route: string
  windowMs: number
}

type RateLimitDecision = {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: string
  /** True only when the decision came from the atomic Supabase RPC — i.e. safe to
   * rely on as a single-use / idempotency guard for money movement. In-memory and
   * legacy compatibility paths set this false. */
  durable: boolean
}

const localBuckets = new Map<string, { count: number; resetAt: number }>()
let lastLocalCleanupAt = 0
const LOCAL_CLEANUP_INTERVAL_MS = 5 * 60 * 1000

export async function enforceRateLimit(input: RateLimitInput): Promise<RateLimitDecision> {
  const now = Date.now()
  const resetAtMs = now + input.windowMs
  const resetAt = new Date(resetAtMs).toISOString()
  const bucketKey = normalizeBucketKey(input.bucketKey ?? input.ipHash)
  cleanupLocalRateLimitBuckets(now)

  const supabaseDecision = await consumeSupabaseRateLimit({
    bucketKey,
    ipHash: input.ipHash,
    max: input.max,
    route: input.route,
    sinceIso: new Date(now - input.windowMs).toISOString(),
  })

  if (supabaseDecision !== null) {
    return {
      allowed: supabaseDecision.allowed,
      limit: input.max,
      remaining: Math.max(0, input.max - supabaseDecision.count),
      resetAt,
      durable: supabaseDecision.durable,
    }
  }

  return enforceLocalRateLimit({ ...input, bucketKey }, now, resetAtMs)
}

export function rateLimitHeaders(decision: RateLimitDecision) {
  return {
    "X-RateLimit-Limit": String(decision.limit),
    "X-RateLimit-Remaining": String(decision.remaining),
    "X-RateLimit-Reset": decision.resetAt,
  }
}

export function rateLimitResponse(decision: RateLimitDecision) {
  return NextResponse.json(
    { error: "Too many requests", message: "Please wait before trying again." },
    { headers: rateLimitHeaders(decision), status: 429 },
  )
}

export async function cleanupRateLimitEvents(retentionHours = 24) {
  const normalizedHours = Math.min(Math.max(Math.round(retentionHours), 1), 168)
  const olderThanIso = new Date(Date.now() - normalizedHours * 60 * 60 * 1000).toISOString()
  const deletedSupabase = await deleteSupabaseRateLimitEventsBefore(olderThanIso)

  return {
    dataSource: deletedSupabase === null ? "local" : "supabase",
    deletedLocal: cleanupLocalRateLimitBuckets(Date.now(), true),
    deletedSupabase,
    olderThanIso,
    retentionHours: normalizedHours,
  }
}

function enforceLocalRateLimit(input: RateLimitInput & { bucketKey: string }, now: number, resetAtMs: number): RateLimitDecision {
  const key = `${input.route}:${input.bucketKey}`
  const current = localBuckets.get(key)
  const next = current && current.resetAt > now ? current : { count: 0, resetAt: resetAtMs }

  if (next.count >= input.max) {
    return {
      allowed: false,
      limit: input.max,
      remaining: 0,
      resetAt: new Date(next.resetAt).toISOString(),
      durable: false,
    }
  }

  next.count += 1
  localBuckets.set(key, next)

  return {
    allowed: true,
    limit: input.max,
    remaining: Math.max(0, input.max - next.count),
    resetAt: new Date(next.resetAt).toISOString(),
    durable: false,
  }
}

function cleanupLocalRateLimitBuckets(now: number, force = false) {
  if (!force && now - lastLocalCleanupAt < LOCAL_CLEANUP_INTERVAL_MS) return 0
  lastLocalCleanupAt = now

  let deleted = 0
  for (const [key, bucket] of localBuckets.entries()) {
    if (bucket.resetAt <= now) {
      localBuckets.delete(key)
      deleted += 1
    }
  }
  return deleted
}

function normalizeBucketKey(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized.slice(0, 160) : "anonymous"
}

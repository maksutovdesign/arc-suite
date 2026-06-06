import { NextResponse } from "next/server"
import { countSupabaseRateLimitEvents, insertSupabaseRateLimitEvent } from "./supabase"

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
}

const localBuckets = new Map<string, { count: number; resetAt: number }>()

export async function enforceRateLimit(input: RateLimitInput): Promise<RateLimitDecision> {
  const now = Date.now()
  const resetAtMs = now + input.windowMs
  const resetAt = new Date(resetAtMs).toISOString()
  const bucketKey = normalizeBucketKey(input.bucketKey ?? input.ipHash)

  const supabaseCount = await countSupabaseRateLimitEvents({
    bucketKey,
    route: input.route,
    sinceIso: new Date(now - input.windowMs).toISOString(),
  })

  if (supabaseCount !== null) {
    if (supabaseCount >= input.max) {
      return { allowed: false, limit: input.max, remaining: 0, resetAt }
    }

    await insertSupabaseRateLimitEvent({
      bucketKey,
      ipHash: input.ipHash,
      route: input.route,
    })

    return {
      allowed: true,
      limit: input.max,
      remaining: Math.max(0, input.max - supabaseCount - 1),
      resetAt,
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
    }
  }

  next.count += 1
  localBuckets.set(key, next)

  return {
    allowed: true,
    limit: input.max,
    remaining: Math.max(0, input.max - next.count),
    resetAt: new Date(next.resetAt).toISOString(),
  }
}

function normalizeBucketKey(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized.slice(0, 160) : "anonymous"
}

import { timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { runExecutionWorker } from "@/lib/backend/execution-worker"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await authorizeWorker(request)
  if (unauthorized) return unauthorized
  const limit = Math.max(1, Math.min(25, Number(request.nextUrl.searchParams.get("limit") ?? "10")))
  const outcome = await runExecutionWorker({ limit: Number.isFinite(limit) ? limit : 10 })
  logOperationalEvent({
    event: "execution.worker.completed",
    requestId,
    route: "/api/executions/worker",
    details: { claimed: outcome.claimed, configured: outcome.configured },
  })
  return NextResponse.json(outcome, {
    status: outcome.configured ? 200 : 503,
    headers: requestIdHeaders(requestId),
  })
}

async function authorizeWorker(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && bearer && constantTimeEqual(bearer, cronSecret)) return null
  return requireArcApiKey(request, ["admin"])
}

function constantTimeEqual(a: string, b: string) {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}

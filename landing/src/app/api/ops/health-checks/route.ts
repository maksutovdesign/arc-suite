import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { getOpsHealthHistory, recordOpsHealthCheck } from "@/lib/backend/service"

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized

  const limit = getLimit(request.nextUrl.searchParams.get("limit"), 72)
  const history = await getOpsHealthHistory(limit)

  return NextResponse.json(
    {
      ok: true,
      requestId,
      ...history,
    },
    { headers: requestIdHeaders(requestId) },
  )
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["write"])
  if (unauthorized) return unauthorized

  const body = await request.json().catch(() => null)
  const result = await recordOpsHealthCheck(body)

  if (!result.normalized) {
    return NextResponse.json(
      {
        error: "Invalid monitor payload",
        message: "Expected a monitor summary with status, checks, durationMs and results.",
        ok: false,
        requestId,
      },
      { headers: requestIdHeaders(requestId), status: 400 },
    )
  }

  logOperationalEvent({
    details: {
      failureCount: result.normalized.failureCount,
      stored: result.stored,
      warningCount: result.normalized.warningCount,
    },
    event: "ops.health_check_recorded",
    level: result.normalized.status === "failed" ? "error" : "info",
    requestId,
    route: "/api/ops/health-checks",
  })

  return NextResponse.json(
    {
      check: result.check,
      normalized: result.stored ? undefined : result.normalized,
      ok: true,
      requestId,
      stored: result.stored,
    },
    { headers: requestIdHeaders(requestId), status: result.stored ? 201 : 202 },
  )
}

function getLimit(value: string | null, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(Math.round(parsed), 200)
}

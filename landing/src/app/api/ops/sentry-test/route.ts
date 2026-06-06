import * as Sentry from "@sentry/nextjs"
import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"

export async function POST(request: NextRequest) {
  const unauthorized = await requireArcApiKey(request, ["admin"])
  if (unauthorized) return unauthorized

  const requestId = createRequestId(request)
  const error = new Error("Arc Suite Sentry runtime test error")

  Sentry.setTag("request_id", requestId)
  Sentry.setTag("route", "/api/ops/sentry-test")
  Sentry.captureException(error, {
    extra: {
      requestId,
      route: "/api/ops/sentry-test",
      source: "manual-runtime-test",
    },
    tags: {
      request_id: requestId,
      route: "/api/ops/sentry-test",
      test: "runtime",
    },
  })
  await Sentry.flush(2000)

  logOperationalEvent({
    details: { sentryFlushMs: 2000 },
    event: "sentry.runtime_test",
    level: "info",
    requestId,
    route: "/api/ops/sentry-test",
  })

  return NextResponse.json(
    { ok: true, requestId },
    { headers: requestIdHeaders(requestId) },
  )
}

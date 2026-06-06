import * as Sentry from "@sentry/nextjs"
import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"

export async function POST(request: NextRequest) {
  if (!hasValidSentryTestToken(request)) {
    const unauthorized = await requireArcApiKey(request, ["admin"])
    if (unauthorized) return unauthorized
  }

  const requestId = createRequestId(request)
  const error = new Error("Arc Suite Sentry runtime test error")
  const hasDsn = Boolean(process.env.SENTRY_DSN ?? process.env.ARC_SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN)
  const hasClient = Boolean(Sentry.getClient())

  Sentry.setTag("request_id", requestId)
  Sentry.setTag("route", "/api/ops/sentry-test")
  const eventId = Sentry.captureException(error, {
    extra: {
      hasClient,
      hasDsn,
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
  const flushOk = await Sentry.flush(2000)

  logOperationalEvent({
    details: { eventId, flushOk, hasClient, hasDsn, sentryFlushMs: 2000 },
    event: "sentry.runtime_test",
    level: "info",
    requestId,
    route: "/api/ops/sentry-test",
  })

  return NextResponse.json(
    { ok: true, requestId, sentry: { eventId, flushOk, hasClient, hasDsn } },
    { headers: requestIdHeaders(requestId) },
  )
}

function hasValidSentryTestToken(request: NextRequest) {
  const expectedToken = process.env.SENTRY_TEST_TOKEN
  const providedToken = request.headers.get("x-sentry-test-token")

  return Boolean(expectedToken && providedToken && providedToken === expectedToken)
}

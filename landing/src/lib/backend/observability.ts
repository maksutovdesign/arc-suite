import { randomUUID } from "crypto"
import * as Sentry from "@sentry/nextjs"

type LogLevel = "info" | "warn" | "error"

type OperationalEvent = {
  details?: Record<string, unknown>
  event: string
  level?: LogLevel
  requestId?: string | null
  route?: string
}

const LOG_PREFIX = "arc.ops"

export function createRequestId(request?: Request) {
  const incoming = request?.headers.get("x-request-id")?.trim()
  const requestId = incoming ? incoming.slice(0, 96) : randomUUID()
  setSentryRequestContext(requestId, request)
  return requestId
}

export function requestIdHeaders(requestId: string) {
  return { "X-Request-Id": requestId }
}

export function logOperationalEvent(input: OperationalEvent) {
  const level = input.level ?? "info"
  const payload = {
    details: sanitizeDetails(input.details ?? {}),
    event: input.event,
    level,
    prefix: LOG_PREFIX,
    requestId: input.requestId ?? undefined,
    route: input.route,
    timestamp: new Date().toISOString(),
  }

  const line = JSON.stringify(payload)
  addSentryBreadcrumb(payload)

  if (level === "error") {
    captureSentryOperationalError(payload)
    console.error(line)
    return
  }

  if (level === "warn") {
    console.warn(line)
    return
  }

  console.log(line)
}

function setSentryRequestContext(requestId: string, request?: Request) {
  try {
    Sentry.setTag("request_id", requestId)
    Sentry.setContext("arc_request", {
      id: requestId,
      method: request?.method,
      path: request ? safePath(request.url) : undefined,
    })
  } catch {
    // Sentry should never affect request handling.
  }
}

function addSentryBreadcrumb(payload: {
  details: Record<string, unknown>
  event: string
  level: LogLevel
  prefix: string
  requestId?: string
  route?: string
  timestamp: string
}) {
  try {
    Sentry.addBreadcrumb({
      category: "arc.ops",
      data: {
        ...payload.details,
        request_id: payload.requestId,
        route: payload.route,
      },
      level: payload.level === "warn" ? "warning" : payload.level,
      message: payload.event,
    })
  } catch {
    // Sentry should never affect request handling.
  }
}

function captureSentryOperationalError(payload: {
  details: Record<string, unknown>
  event: string
  level: LogLevel
  prefix: string
  requestId?: string
  route?: string
  timestamp: string
}) {
  try {
    Sentry.captureMessage(payload.event, {
      extra: payload.details,
      level: "error",
      tags: {
        event: payload.event,
        request_id: payload.requestId,
        route: payload.route,
      },
    })
  } catch {
    // Sentry should never affect request handling.
  }
}

function safePath(url: string) {
  try {
    return new URL(url).pathname.slice(0, 240)
  } catch {
    return undefined
  }
}

function sanitizeDetails(details: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(details)
      .filter(([key]) => !/secret|token|key|authorization|password/i.test(key))
      .slice(0, 24)
      .map(([key, value]) => [key.slice(0, 80), sanitizeValue(value)]),
  )
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === "boolean" || typeof value === "number") return value
  if (typeof value === "string") return value.slice(0, 240)
  if (Array.isArray(value)) return value.slice(0, 10).map(sanitizeValue)
  if (typeof value === "object") {
    return sanitizeDetails(value as Record<string, unknown>)
  }
  return String(value).slice(0, 120)
}

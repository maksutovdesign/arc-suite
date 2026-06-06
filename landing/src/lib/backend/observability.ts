import { randomUUID } from "crypto"

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
  return incoming ? incoming.slice(0, 96) : randomUUID()
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
  if (level === "error") {
    console.error(line)
    return
  }

  if (level === "warn") {
    console.warn(line)
    return
  }

  console.log(line)
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

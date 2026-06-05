"use client"

type TrackInput = {
  eventName: "access_check_run" | "access_check_result"
  surface?: string
  placement?: string
  properties?: Record<string, string | number | boolean | null>
}

const ANALYTICS_ENDPOINT =
  process.env.NEXT_PUBLIC_ARC_ANALYTICS_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://arcsuite-app.vercel.app/api/analytics/events"
    : "http://127.0.0.1:3100/api/analytics/events")

const ANONYMOUS_ID_KEY = "arc_treasury_analytics_anonymous_id"
const SESSION_ID_KEY = "arc_treasury_analytics_session_id"

export function trackTreasuryEvent(input: TrackInput) {
  if (typeof window === "undefined") return

  const payload = {
    anonymousId: getStoredId(ANONYMOUS_ID_KEY, "anon"),
    eventName: input.eventName,
    path: window.location.pathname,
    placement: input.placement,
    properties: input.properties ?? {},
    referrer: document.referrer,
    sessionId: getStoredId(SESSION_ID_KEY, "ses", "session"),
    source: "treasury",
    surface: input.surface ?? "treasury",
    url: window.location.href,
  }

  sendAnalytics(payload)
}

function sendAnalytics(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload)

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(ANALYTICS_ENDPOINT, new Blob([body], { type: "text/plain" }))
    if (sent) return
  }

  void fetch(ANALYTICS_ENDPOINT, {
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    method: "POST",
  }).catch(() => null)
}

function getStoredId(key: string, prefix: string, storageType: "local" | "session" = "local") {
  const storage = storageType === "session" ? window.sessionStorage : window.localStorage
  const existing = storage.getItem(key)
  if (existing) return existing

  const value = `${prefix}_${crypto.randomUUID()}`
  storage.setItem(key, value)
  return value
}

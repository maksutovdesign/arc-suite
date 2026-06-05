"use client"

type TrackInput = {
  eventName: string
  surface?: string
  placement?: string
  properties?: Record<string, string | number | boolean | null>
}

const ANONYMOUS_ID_KEY = "arc_analytics_anonymous_id"
const SESSION_ID_KEY = "arc_analytics_session_id"

export function trackLandingConversion(input: TrackInput) {
  if (typeof window === "undefined") return

  const payload = {
    anonymousId: getStoredId(ANONYMOUS_ID_KEY, "anon"),
    eventName: input.eventName,
    path: window.location.pathname,
    placement: input.placement,
    properties: input.properties ?? {},
    referrer: document.referrer,
    sessionId: getStoredId(SESSION_ID_KEY, "ses", "session"),
    source: "landing",
    surface: input.surface ?? "product_landing",
    url: window.location.href,
  }

  sendAnalytics("/api/analytics/events", payload)
}

function sendAnalytics(url: string, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload)

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(url, new Blob([body], { type: "text/plain" }))
    if (sent) return
  }

  void fetch(url, {
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

import * as Sentry from "@sentry/nextjs"

const dsn = process.env.SENTRY_DSN ?? process.env.ARC_SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  beforeSend(event) {
    event.tags = { ...event.tags, app: "landing", product: "arc-suite", runtime: "edge" }
    return event
  },
  dsn,
  enabled: Boolean(dsn) && process.env.SENTRY_ENABLED !== "false",
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA,
  sendDefaultPii: false,
  tracesSampleRate: sampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, process.env.NODE_ENV === "production" ? 0.05 : 1),
})

function sampleRate(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback
}

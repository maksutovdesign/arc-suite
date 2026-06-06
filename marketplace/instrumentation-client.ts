import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  beforeSend(event) {
    event.tags = { ...event.tags, app: "marketplace", product: "arc-suite" };
    return event;
  },
  dsn,
  enabled: Boolean(dsn) && process.env.NEXT_PUBLIC_SENTRY_ENABLED !== "false",
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE ?? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  sendDefaultPii: false,
  tracesSampleRate: sampleRate(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE, process.env.NODE_ENV === "production" ? 0.05 : 1),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

function sampleRate(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback;
}

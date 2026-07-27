import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const securityHeaders = [
  { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; connect-src 'self' https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.sentry.io; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob: https:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; upgrade-insecure-requests" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Download-Options", value: "noopen" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()" },
]

const apiHeaders = [
  ...securityHeaders,
  { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
]

// Standalone deployments backing the single Kestrel domain via Multi-Zones.
// Each product app sets basePath: "/<product>", so we proxy both the pages and
// their basePath-scoped assets/API under one origin (arcsuite-app.vercel.app).
// NOTE: an env var set to "" must fall back to the default (?? only guards
// undefined), otherwise the proxy target becomes empty and /treasury would
// self-rewrite back to the landing page.
const zoneTarget = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim()
  return trimmed && /^https?:\/\//.test(trimmed) ? trimmed.replace(/\/+$/, "") : fallback
}

const zoneTargets = {
  treasury: zoneTarget(process.env.NEXT_PUBLIC_ARC_TREASURY_URL, "https://treasury-umber.vercel.app"),
  reputation: zoneTarget(process.env.NEXT_PUBLIC_ARC_REPUTATION_URL, "https://reputation-swart.vercel.app"),
  marketplace: zoneTarget(process.env.NEXT_PUBLIC_ARC_MARKETPLACE_URL, "https://marketplace-eosin-eight.vercel.app"),
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return {
      beforeFiles: Object.entries(zoneTargets).flatMap(([product, target]) => [
        { source: `/${product}`, destination: `${target}/${product}` },
        { source: `/${product}/:path*`, destination: `${target}/${product}/:path*` },
      ]),
    }
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: apiHeaders,
      },
    ]
  },
}

const canUploadSourcemaps = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT)

export default withSentryConfig(nextConfig, {
  ...(canUploadSourcemaps
    ? {
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        widenClientFileUpload: true,
      }
    : {}),
  silent: !process.env.CI,
})

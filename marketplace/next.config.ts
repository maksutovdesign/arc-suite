import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; connect-src 'self' https://*.ingest.sentry.io; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob: https:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; upgrade-insecure-requests" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Download-Options", value: "noopen" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()" },
];

const apiHeaders = [
  ...securityHeaders,
  { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
];

// Served under the single Arc Suite domain at /marketplace (Next.js Multi-Zones).
const basePath = "/marketplace";

const nextConfig: NextConfig = {
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  poweredByHeader: false,
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
    ];
  },
};

const canUploadSourcemaps = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);

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
});

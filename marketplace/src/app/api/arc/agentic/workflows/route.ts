import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"

const DEFAULT_API_BASE_URL = process.env.NODE_ENV === "production" ? "https://arcsuite-app.vercel.app" : "http://127.0.0.1:3100"
const API_BASE_URL = process.env.ARC_SUITE_API_URL ?? process.env.NEXT_PUBLIC_ARC_SUITE_API_URL ?? DEFAULT_API_BASE_URL
const ARC_API_KEY = process.env.ARC_API_KEY

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const apiId = typeof body?.apiId === "string" ? body.apiId.slice(0, 80) : "marketplace_api"
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.slice(0, 160) : `marketplace:${apiId}:${hashClientBucket(request).slice(0, 16)}`

  try {
    const response = await fetch(`${API_BASE_URL}/api/agentic/workflows`, {
      body: JSON.stringify({
        apiId,
        sessionId,
        source: "marketplace",
      }),
      headers: {
        "Content-Type": "application/json",
        ...(ARC_API_KEY ? { "x-arc-api-key": ARC_API_KEY } : {}),
        "x-arc-client-bucket": hashClientBucket(request),
      },
      method: "POST",
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload) {
      return NextResponse.json(
        { error: "Agentic workflow failed", message: payload?.message ?? payload?.error ?? `Arc workflow failed: ${response.status}` },
        { status: 502 },
      )
    }

    const proofUrl = typeof payload.proofUrl === "string" ? new URL(payload.proofUrl, API_BASE_URL).toString() : null

    return NextResponse.json({
      ...payload,
      proofUrl,
    }, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { error: "Agentic workflow failed", message: error instanceof Error ? error.message : "Unknown proxy error" },
      { status: 502 },
    )
  }
}

function hashClientBucket(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown-ip"
  const userAgent = request.headers.get("user-agent") || "unknown-agent"
  const salt = process.env.ARC_PROXY_SALT ?? process.env.ARC_API_KEY ?? "arc-marketplace"
  return createHash("sha256").update(`${salt}:${ip}:${userAgent}`).digest("hex")
}

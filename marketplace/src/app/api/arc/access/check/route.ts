import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { runAccessCheck } from "@/lib/arc-api"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.agentId !== "string" || typeof body.apiId !== "string") {
    return NextResponse.json({ error: "agentId and apiId are required" }, { status: 400 })
  }

  try {
    return NextResponse.json(await runAccessCheck({
      agentId: body.agentId,
      apiId: body.apiId,
      amountUsdc: typeof body.amountUsdc === "number" ? body.amountUsdc : undefined,
    }, {
      clientBucket: hashClientBucket(request),
    }))
  } catch (error) {
    return NextResponse.json(
      { error: "Arc access check failed", message: error instanceof Error ? error.message : "Unknown proxy error" },
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

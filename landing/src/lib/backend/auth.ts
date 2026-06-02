import { NextResponse } from "next/server"

const API_KEY = process.env.ARC_API_KEY

export function requireArcApiKey(request: Request) {
  if (!API_KEY) return null

  const headerKey = request.headers.get("x-arc-api-key")
  const bearerKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (headerKey === API_KEY || bearerKey === API_KEY) return null

  return NextResponse.json(
    { error: "Unauthorized", message: "A valid Arc API key is required." },
    { status: 401 },
  )
}

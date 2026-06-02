import { NextRequest, NextResponse } from "next/server"

const DEFAULT_API_BASE_URL = process.env.NODE_ENV === "production" ? "https://arcsuite-app.vercel.app" : "http://127.0.0.1:3100"
const API_BASE_URL = process.env.ARC_SUITE_API_URL ?? process.env.NEXT_PUBLIC_ARC_SUITE_API_URL ?? DEFAULT_API_BASE_URL
const ARC_API_KEY = process.env.ARC_API_KEY

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const response = await fetch(`${API_BASE_URL}/api/agents`, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...(ARC_API_KEY ? { "x-arc-api-key": ARC_API_KEY } : {}),
    },
    method: "POST",
  })

  if (!response.ok) {
    return NextResponse.json({ error: "Arc API create failed" }, { status: 502 })
  }

  return NextResponse.json(await response.json(), { status: 201 })
}

import { NextRequest, NextResponse } from "next/server"
import { createWorkspaceApiKey, getWorkspaceSecurity } from "@/lib/arc-api"
import { requireTreasuryAdmin } from "@/lib/treasury-auth"

export async function GET(request: NextRequest) {
  const unauthorized = requireTreasuryAdmin(request)
  if (unauthorized) return unauthorized

  const security = await getWorkspaceSecurity()
  if (!security) {
    return NextResponse.json({ error: "Arc workspace security is unavailable" }, { status: 502 })
  }

  return NextResponse.json(security)
}

export async function POST(request: NextRequest) {
  const unauthorized = requireTreasuryAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name : "Workspace API key"
  const scopes = Array.isArray(body?.scopes) ? body.scopes : ["read"]

  try {
    return NextResponse.json(await createWorkspaceApiKey({ name, scopes }), { status: 201 })
  } catch {
    return NextResponse.json({ error: "Arc API key creation failed" }, { status: 502 })
  }
}

import { NextResponse } from "next/server"
import { requireArcApiKey } from "@/lib/backend/auth"
import { createWorkspaceApiKey, getWorkspaceSecurity } from "@/lib/backend/service"

export async function GET(request: Request) {
  const unauthorized = await requireArcApiKey(request, ["admin"])
  if (unauthorized) return unauthorized

  return NextResponse.json(await getWorkspaceSecurity())
}

export async function POST(request: Request) {
  const unauthorized = await requireArcApiKey(request, ["admin"])
  if (unauthorized) return unauthorized

  const body = await request.json().catch(() => null)
  const apiKey = await createWorkspaceApiKey({
    name: typeof body?.name === "string" ? body.name : undefined,
    scopes: Array.isArray(body?.scopes) ? body.scopes : undefined,
  })

  if (!apiKey) {
    return NextResponse.json({ error: "Workspace API key storage is not configured" }, { status: 503 })
  }

  return NextResponse.json({ apiKey }, { status: 201 })
}

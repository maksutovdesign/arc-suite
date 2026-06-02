import { NextResponse } from "next/server"
import { requireArcApiKey } from "@/lib/backend/auth"
import { revokeWorkspaceApiKey } from "@/lib/backend/service"

type RouteContext = {
  params: Promise<{ keyId: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const unauthorized = await requireArcApiKey(request, ["admin"])
  if (unauthorized) return unauthorized

  const { keyId } = await context.params
  const apiKey = await revokeWorkspaceApiKey(keyId)
  if (!apiKey) {
    return NextResponse.json({ error: "Workspace API key not found or storage is not configured" }, { status: 404 })
  }

  return NextResponse.json({ apiKey })
}

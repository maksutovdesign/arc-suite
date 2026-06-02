import { NextResponse } from "next/server"
import { rotateWorkspaceApiKey } from "@/lib/arc-api"
import { requireTreasuryAdmin } from "@/lib/treasury-auth"

type RouteContext = {
  params: Promise<{ keyId: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const unauthorized = requireTreasuryAdmin(request)
  if (unauthorized) return unauthorized

  const { keyId } = await context.params

  try {
    return NextResponse.json(await rotateWorkspaceApiKey(keyId))
  } catch {
    return NextResponse.json({ error: "Arc API key rotation failed" }, { status: 502 })
  }
}

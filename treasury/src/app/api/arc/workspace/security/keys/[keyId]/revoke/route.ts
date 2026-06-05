import { NextResponse } from "next/server"
import { revokeWorkspaceApiKey } from "@/lib/arc-api"
import { requireWritableTreasuryAdmin } from "@/lib/treasury-auth"

type RouteContext = {
  params: Promise<{ keyId: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const unauthorized = requireWritableTreasuryAdmin(request)
  if (unauthorized) return unauthorized

  const { keyId } = await context.params

  try {
    return NextResponse.json(await revokeWorkspaceApiKey(keyId))
  } catch {
    return NextResponse.json({ error: "Arc API key revoke failed" }, { status: 502 })
  }
}

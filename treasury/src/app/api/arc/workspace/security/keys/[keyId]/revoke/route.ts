import { NextResponse } from "next/server"
import { revokeWorkspaceApiKey } from "@/lib/arc-api"

type RouteContext = {
  params: Promise<{ keyId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { keyId } = await context.params

  try {
    return NextResponse.json(await revokeWorkspaceApiKey(keyId))
  } catch {
    return NextResponse.json({ error: "Arc API key revoke failed" }, { status: 502 })
  }
}

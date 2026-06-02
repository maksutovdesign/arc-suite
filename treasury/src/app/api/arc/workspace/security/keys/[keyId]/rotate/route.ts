import { NextResponse } from "next/server"
import { rotateWorkspaceApiKey } from "@/lib/arc-api"

type RouteContext = {
  params: Promise<{ keyId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { keyId } = await context.params

  try {
    return NextResponse.json(await rotateWorkspaceApiKey(keyId))
  } catch {
    return NextResponse.json({ error: "Arc API key rotation failed" }, { status: 502 })
  }
}

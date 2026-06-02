import { NextResponse } from "next/server"
import { requireArcApiKey } from "@/lib/backend/auth"
import { listApiListings } from "@/lib/backend/service"

export async function GET(request: Request) {
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized

  return NextResponse.json({ apis: await listApiListings() })
}

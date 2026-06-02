import { NextResponse } from "next/server"
import { listApiListings } from "@/lib/backend/service"

export async function GET() {
  return NextResponse.json({ apis: await listApiListings() })
}

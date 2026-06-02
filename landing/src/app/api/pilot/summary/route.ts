import { NextResponse } from "next/server"
import { getPilotSummary } from "@/lib/backend/service"

export async function GET() {
  return NextResponse.json(await getPilotSummary())
}

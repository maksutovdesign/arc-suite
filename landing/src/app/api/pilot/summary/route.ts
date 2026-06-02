import { NextResponse } from "next/server"
import { getPilotSummary } from "@/lib/backend/service"

export function GET() {
  return NextResponse.json(getPilotSummary())
}

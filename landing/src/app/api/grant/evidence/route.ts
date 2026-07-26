import { NextResponse } from "next/server"

import { getGrantEvidence } from "@/lib/backend/grant-evidence"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(await getGrantEvidence(), {
    headers: { "Cache-Control": "no-store" },
  })
}

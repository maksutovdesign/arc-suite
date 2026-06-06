import { NextRequest, NextResponse } from "next/server"
import { requireArcApiKey } from "@/lib/backend/auth"
import { checkSupabaseReadiness } from "@/lib/backend/supabase"

export async function GET(request: NextRequest) {
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized

  const readiness = await checkSupabaseReadiness()
  return NextResponse.json(
    {
      ok: readiness.ok,
      service: "arc-suite-pilot-api",
      supabase: readiness,
    },
    { status: readiness.ok ? 200 : 503 },
  )
}

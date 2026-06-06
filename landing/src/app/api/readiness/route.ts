import { NextRequest, NextResponse } from "next/server"
import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { checkSupabaseReadiness } from "@/lib/backend/supabase"

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized

  const readiness = await checkSupabaseReadiness()
  if (!readiness.ok) {
    logOperationalEvent({
      details: {
        failedTables: readiness.tables.filter((table) => !table.ok).map((table) => table.name),
      },
      event: "readiness.failed",
      level: "error",
      requestId,
      route: "/api/readiness",
    })
  }

  return NextResponse.json(
    {
      ok: readiness.ok,
      service: "arc-suite-pilot-api",
      supabase: readiness,
    },
    { headers: requestIdHeaders(requestId), status: readiness.ok ? 200 : 503 },
  )
}

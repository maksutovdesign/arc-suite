import { NextRequest, NextResponse } from "next/server"

import { createRequestId, requestIdHeaders } from "@/lib/backend/observability"
import { getProviderTrustOverview } from "@/lib/backend/provider-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const limit = clampLimit(request.nextUrl.searchParams.get("limit"))
  const overview = await getProviderTrustOverview(limit)

  return NextResponse.json(
    {
      generatedAt: overview.generatedAt,
      ok: true,
      receipts: overview.receipts,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        ...requestIdHeaders(requestId),
      },
    },
  )
}

function clampLimit(value: string | null) {
  const parsed = Number.parseInt(value ?? "12", 10)
  if (!Number.isFinite(parsed)) return 12
  return Math.min(Math.max(parsed, 1), 50)
}

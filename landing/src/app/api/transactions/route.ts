import { NextResponse } from "next/server"
import { requireArcApiKey } from "@/lib/backend/auth"
import { listTransactions } from "@/lib/backend/service"

export async function GET(request: Request) {
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized

  return NextResponse.json({ transactions: await listTransactions() })
}

import { NextRequest, NextResponse } from "next/server"
import { clearTreasurySession, isValidTreasuryAdminKey, setTreasurySession } from "@/lib/treasury-auth"

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "production" && !process.env.ARC_TREASURY_ADMIN_KEY) {
    return NextResponse.json({ ok: true, mode: "dev-bypass" })
  }

  const body = await request.json().catch(() => null)
  if (!isValidTreasuryAdminKey(body?.adminKey)) {
    return NextResponse.json({ error: "Invalid Treasury admin key" }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  setTreasurySession(response)
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  clearTreasurySession(response)
  return response
}

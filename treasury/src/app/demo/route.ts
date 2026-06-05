import { NextRequest, NextResponse } from "next/server"
import { setTreasuryDemoSession } from "@/lib/treasury-auth"

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url))
  setTreasuryDemoSession(response)
  return response
}

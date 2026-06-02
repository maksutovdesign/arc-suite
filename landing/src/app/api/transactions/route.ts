import { NextResponse } from "next/server"
import { listTransactions } from "@/lib/backend/service"

export function GET() {
  return NextResponse.json({ transactions: listTransactions() })
}

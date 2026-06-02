import { NextResponse } from "next/server"
import { listTransactions } from "@/lib/backend/service"

export async function GET() {
  return NextResponse.json({ transactions: await listTransactions() })
}

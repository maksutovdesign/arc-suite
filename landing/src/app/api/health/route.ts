import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/backend/supabase"

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "kestrel-pilot-api",
    schemaVersion: "2026-06-22.3",
    mode: "pilot",
    dataSource: isSupabaseConfigured() ? "supabase" : "seed",
  })
}

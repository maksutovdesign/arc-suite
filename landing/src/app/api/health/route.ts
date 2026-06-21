import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/backend/supabase"

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "arc-suite-pilot-api",
    schemaVersion: "2026-06-21.2",
    mode: "pilot",
    dataSource: isSupabaseConfigured() ? "supabase" : "seed",
  })
}

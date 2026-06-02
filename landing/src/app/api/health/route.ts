import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "arc-suite-pilot-api",
    schemaVersion: "2026-06-02.1",
    mode: "pilot",
  })
}

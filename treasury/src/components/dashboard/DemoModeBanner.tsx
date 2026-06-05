import Link from "next/link"
import { Lock, PlayCircle } from "lucide-react"

export function DemoModeBanner() {
  return (
    <div
      className="flex items-center justify-between gap-4 px-6 py-3"
      style={{
        background: "linear-gradient(90deg, rgba(95,191,255,0.14), rgba(52,211,153,0.08))",
        borderBottom: "1px solid rgba(95,191,255,0.2)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="size-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(95,191,255,0.14)", border: "1px solid rgba(95,191,255,0.28)" }}
        >
          <PlayCircle className="size-4" style={{ color: "#5FBFFF" }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Demo workspace</p>
          <p className="text-[11px] truncate" style={{ color: "#a9b8c9" }}>
            Live pilot data is connected. Budget edits, agent changes, and key rotation are read-only in this session.
          </p>
        </div>
      </div>
      <Link
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold whitespace-nowrap"
        href="/settings"
        style={{ color: "#5FBFFF", background: "rgba(5,12,20,0.26)", border: "1px solid rgba(95,191,255,0.22)" }}
      >
        <Lock className="size-3" />
        Security view
      </Link>
    </div>
  )
}

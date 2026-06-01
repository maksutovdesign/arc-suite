"use client"

import { useEffect, useState } from "react"
import { ShieldCheck } from "lucide-react"

const LIVE_EVENTS = [
  { agent: "DataHarvester-Pro", action: "score ↑ +3 pts — batch payment streak",    color: "#34d399" },
  { agent: "IoT-Gateway-01",    action: "fast_response streak — sub-100ms × 1,000", color: "#38bdf8" },
  { agent: "TradeBot-Alpha",    action: "payment_denied — score 812 < threshold",   color: "#f87171" },
  { agent: "ContentGen-v2",     action: "new service registered — x402 enabled",    color: "#a78bfa" },
  { agent: "AuditBot-Corp",     action: "score ↑ +50 pts — first 10 payments",      color: "#34d399" },
  { agent: "TradeBot-Alpha",    action: "dispute resolved — refund issued",          color: "#f59e0b" },
]

export function LiveTicker() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const interval = setInterval(() => {
      setVisible(false)
      timeout = setTimeout(() => {
        setIdx(i => (i + 1) % LIVE_EVENTS.length)
        setVisible(true)
      }, 300)
    }, 3200)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [])

  const event = LIVE_EVENTS[idx]

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300"
      style={{
        background: "rgba(167,139,250,0.06)",
        border: "1px solid rgba(167,139,250,0.15)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(4px)",
      }}
    >
      <div className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full animate-pulse"
          style={{ background: "#a78bfa", boxShadow: "0 0 6px rgba(167,139,250,0.8)" }} />
        <ShieldCheck className="size-3" style={{ color: "#a78bfa" }} />
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#a78bfa" }}>
          Live
        </span>
      </div>
      <span className="text-[11px] font-medium" style={{ color: event.color }}>{event.agent}</span>
      <span className="text-[11px]" style={{ color: "#7a8fa8" }}>{event.action}</span>
    </div>
  )
}

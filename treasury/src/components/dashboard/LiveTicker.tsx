"use client"

import { useEffect, useState } from "react"
import { Zap } from "lucide-react"

// Simulated live transaction feed
const LIVE_EVENTS = [
  { agent: "IoT-Gateway-01",   action: "paid $0.001 → SensorHub",   color: "#34d399" },
  { agent: "DataHarvester-Pro", action: "paid $0.003 → WeatherAPI",  color: "#4d8ee9" },
  { agent: "TradeBot-Alpha",    action: "swap $12.5 USDC → ETH",     color: "#f87171" },
  { agent: "ContentGen-v2",     action: "paid $0.05 → LLM inference", color: "#a78bfa" },
  { agent: "IoT-Gateway-01",   action: "paid $0.001 → AQI feed",    color: "#34d399" },
  { agent: "DataHarvester-Pro", action: "paid $0.002 → CoinGecko",   color: "#4d8ee9" },
]

export function LiveTicker() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const interval = setInterval(() => {
      setVisible(false)
      timeout = setTimeout(() => {
        setIdx((i) => (i + 1) % LIVE_EVENTS.length)
        setVisible(true)
      }, 300)
    }, 3000)
    // ✅ clear both interval AND any pending timeout on unmount
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [])

  const event = LIVE_EVENTS[idx]

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300"
      style={{
        background: "rgba(77,142,233,0.06)",
        border: "1px solid rgba(77,142,233,0.15)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(4px)",
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="size-1.5 rounded-full animate-pulse"
          style={{ background: "#34d399", boxShadow: "0 0 6px rgba(52,211,153,0.8)" }}
        />
        <Zap className="size-3" style={{ color: "#5FBFFF" }} />
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#5FBFFF" }}>
          Live
        </span>
      </div>
      <span className="text-[11px] font-medium" style={{ color: event.color }}>{event.agent}</span>
      <span className="text-[11px]" style={{ color: "#7a8fa8" }}>{event.action}</span>
    </div>
  )
}

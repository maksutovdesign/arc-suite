"use client"

import { Activity, TrendingUp, TrendingDown, Filter } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ArcButton } from "@/components/ui/ArcButton"
import { EVENTS } from "@/data/mock"
import { formatTimestamp } from "@/lib/utils"

const EVENT_CONFIG: Record<string, { label: string; color: string; icon: string; bg: string }> = {
  payment_completed: { label: "Payment",        color: "#34d399", icon: "✓",  bg: "rgba(52,211,153,0.12)"   },
  payment_failed:    { label: "Failed",         color: "#f87171", icon: "✗",  bg: "rgba(248,113,113,0.12)"  },
  payment_denied:    { label: "Access Denied",  color: "#f87171", icon: "⊘",  bg: "rgba(248,113,113,0.15)"  },
  dispute_raised:    { label: "Dispute",        color: "#f87171", icon: "⚠",  bg: "rgba(248,113,113,0.12)"  },
  dispute_resolved:  { label: "Resolved",       color: "#f59e0b", icon: "◎",  bg: "rgba(245,158,11,0.12)"   },
  fast_response:     { label: "Fast Response",  color: "#5FBFFF", icon: "⚡", bg: "rgba(95,191,255,0.12)"   },
  large_tx:          { label: "Large TX",       color: "#a78bfa", icon: "↑",  bg: "rgba(167,139,250,0.12)"  },
  new_service:       { label: "New Service",    color: "#38bdf8", icon: "★",  bg: "rgba(56,189,248,0.12)"   },
}

export default function EventsPage() {
  const total = EVENTS.reduce((s, e) => s + e.scoreDelta, 0)
  const positive = EVENTS.filter(e => e.scoreDelta > 0).length
  const negative = EVENTS.filter(e => e.scoreDelta < 0).length

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Reputation Events"
        subtitle="Every score change, dispute, and milestone across all agents"
        icon={Activity}
        glow
        actions={
          <>
            <ArcButton variant="outline" size="sm" icon={Filter}>Filter</ArcButton>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium" style={{ color: "#34d399" }}>Live</span>
            </div>
          </>
        }
      />

      {/* Summary strip */}
      <div className="flex items-center gap-px border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {[
          { label: "Total Events",    value: String(EVENTS.length), color: "#C7C5D1" },
          { label: "Net Score Delta", value: (total >= 0 ? "+" : "") + total, color: total >= 0 ? "#34d399" : "#f87171" },
          { label: "Score Gains",     value: String(positive),  color: "#34d399" },
          { label: "Score Losses",    value: String(negative),  color: "#f87171" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex-1 px-5 py-3" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: "#7a8fa8" }}>{label}</p>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="p-6">
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(160deg,#263a52 0%,#1e3247 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>

          {/* Header */}
          <div className="grid px-5 py-3"
            style={{ gridTemplateColumns: "44px 1fr 120px 90px 90px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            {["Type", "Event", "Agent", "Time", "Delta"].map((h, i) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#7a8fa8", textAlign: i === 4 ? "right" : "left" }}>{h}</span>
            ))}
          </div>

          {EVENTS.map((ev, i) => {
            const cfg = EVENT_CONFIG[ev.type] ?? { label: ev.type, color: "#7a8fa8", icon: "·", bg: "rgba(122,143,168,0.1)" }
            return (
              <div key={ev.id}
                className="grid items-center px-5 py-3.5 cursor-pointer transition-all duration-150"
                style={{ gridTemplateColumns: "44px 1fr 120px 90px 90px", borderBottom: i < EVENTS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(167,139,250,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                {/* Type icon */}
                <div className="size-7 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                  {cfg.icon}
                </div>

                {/* Description */}
                <div className="min-w-0 pr-4">
                  <p className="text-xs font-medium text-white">{ev.description}</p>
                  {ev.txHash && (
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: "#3d5a74" }}>{ev.txHash}</p>
                  )}
                </div>

                {/* Agent */}
                <div>
                  <span className="text-[11px]" style={{ color: "#C7C5D1" }}>{ev.agentName}</span>
                </div>

                {/* Time */}
                <div className="text-[11px]" style={{ color: "#7a8fa8" }}>{formatTimestamp(ev.timestamp)}</div>

                {/* Delta */}
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {ev.scoreDelta >= 0
                      ? <TrendingUp className="size-3" style={{ color: "#34d399" }} />
                      : <TrendingDown className="size-3" style={{ color: "#f87171" }} />}
                    <span className="text-sm font-bold"
                      style={{ color: ev.scoreDelta >= 0 ? "#34d399" : "#f87171" }}>
                      {ev.scoreDelta >= 0 ? "+" : ""}{ev.scoreDelta}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

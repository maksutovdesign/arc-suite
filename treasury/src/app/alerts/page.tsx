"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Bell, BellOff, ShieldAlert, History } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ArcButton } from "@/components/ui/ArcButton"
import { ALERTS } from "@/data/mock"
import { formatTimestamp } from "@/lib/utils"

const TYPE_META: Record<string, { label: string; icon: string }> = {
  daily_limit:    { label: "Daily Limit",    icon: "📊" },
  monthly_limit:  { label: "Monthly Limit",  icon: "📅" },
  low_balance:    { label: "Low Balance",    icon: "💰" },
  unusual_spend:  { label: "Unusual Spend",  icon: "⚡" },
}

const arcCard = {
  background: "linear-gradient(160deg, #263a52 0%, #1e3247 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
}

export default function AlertsPage() {
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())
  const active = ALERTS.filter((a) => !a.resolved && !resolvedIds.has(a.id))
  const resolved = ALERTS.filter((a) => a.resolved || resolvedIds.has(a.id))

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Alerts"
        subtitle={`${active.length} active · ${resolved.length} resolved · Real-time monitoring`}
        icon={ShieldAlert}
        glow
        actions={<ArcButton variant="outline" size="sm" icon={Bell}>Configure notifications</ArcButton>}
      />

      {/* Stats strip */}
      <div
        className="flex items-center gap-8 px-6 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        {[
          { label: "Critical",  count: active.filter(a => a.severity === "critical").length,  color: "#f87171" },
          { label: "Warning",   count: active.filter(a => a.severity === "warning").length,   color: "#f59e0b" },
          { label: "Resolved",  count: resolved.length,                                        color: "#34d399" },
        ].map(({ label, count, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "#7a8fa8" }}>{label}</span>
            <span className="text-sm font-bold" style={{ color }}>{count}</span>
          </div>
        ))}
      </div>

      <div className="p-6 space-y-5">
        {/* Active alerts */}
        {active.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="size-4" style={{ color: "#f87171" }} />
              <h2 className="text-sm font-semibold text-white">Active Alerts ({active.length})</h2>
            </div>

            <div className="space-y-3">
              {active.map((alert) => {
                const isCritical = alert.severity === "critical"
                const meta = TYPE_META[alert.type]

                return (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between p-4 rounded-2xl"
                    style={{
                      background: isCritical
                        ? "linear-gradient(135deg, rgba(248,113,113,0.08) 0%, rgba(38,58,82,0.6) 100%)"
                        : "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(38,58,82,0.6) 100%)",
                      border: `1px solid ${isCritical ? "rgba(248,113,113,0.25)" : "rgba(245,158,11,0.25)"}`,
                      boxShadow: isCritical ? "0 0 20px rgba(248,113,113,0.06)" : "0 0 20px rgba(245,158,11,0.06)",
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Type icon */}
                      <div
                        className="size-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{
                          background: isCritical ? "rgba(248,113,113,0.12)" : "rgba(245,158,11,0.12)",
                          border: `1px solid ${isCritical ? "rgba(248,113,113,0.25)" : "rgba(245,158,11,0.25)"}`,
                        }}
                      >
                        {meta?.icon ?? "⚠"}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">{alert.agentName}</span>
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={
                              isCritical
                                ? { background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }
                                : { background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }
                            }
                          >
                            {alert.severity}
                          </span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.05)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.08)" }}
                          >
                            {meta?.label}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: "#C7C5D1" }}>{alert.message}</p>
                        <p className="text-[10px] mt-1.5" style={{ color: "#7a8fa8" }}>
                          Triggered at {formatTimestamp(alert.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <ArcButton variant="danger" size="sm">Pause agent</ArcButton>
                      <ArcButton variant="primary" size="sm" onClick={() => setResolvedIds(s => new Set(s).add(alert.id))}>Resolve</ArcButton>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Resolved alerts */}
        {resolved.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="size-4" style={{ color: "#7a8fa8" }} />
              <h2 className="text-sm font-semibold text-white">Resolved ({resolved.length})</h2>
            </div>

            <div className="space-y-2">
              {resolved.map((alert) => {
                const meta = TYPE_META[alert.type]
                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 rounded-2xl"
                    style={{ ...arcCard, opacity: 0.6 }}
                  >
                    <div className="flex items-center gap-3">
                      <BellOff className="size-4 shrink-0" style={{ color: "#7a8fa8" }} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{alert.agentName}</span>
                          <span className="text-[10px]" style={{ color: "#7a8fa8" }}>{meta?.label}</span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "#7a8fa8" }}>{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4" style={{ color: "#34d399" }} />
                      <span className="text-xs font-medium" style={{ color: "#34d399" }}>Resolved</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {active.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="size-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}
            >
              <CheckCircle2 className="size-8" style={{ color: "#34d399" }} />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-white">All clear</p>
              <p className="text-sm mt-1" style={{ color: "#7a8fa8" }}>No active alerts — all agents running within limits</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

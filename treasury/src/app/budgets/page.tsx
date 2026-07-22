import type { Metadata } from "next"
export const metadata: Metadata = { title: "Budgets — Kestrel Treasury" }

import { AlertTriangle, Shield, Bot, Settings2, Plus, BellRing } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ArcProgress } from "@/components/ui/ArcProgress"
import { ArcButton } from "@/components/ui/ArcButton"
import { AgentStatusBadge } from "@/components/agents/AgentStatusBadge"
import { AGENTS, ALERTS } from "@/data/mock"
import { formatCompactUSDC, pctUsed } from "@/lib/utils"

const arcCard = {
  background: "linear-gradient(160deg, #263a52 0%, #1e3247 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
}

export default function BudgetsPage() {
  const unresolvedAlerts = ALERTS.filter((a) => !a.resolved)

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Budgets & Controls"
        subtitle="Set spending limits, alerts and auto-pause rules for each agent"
        icon={Shield}
        glow
        actions={<ArcButton variant="primary" size="sm" icon={Plus}>New Rule</ArcButton>}
      />

      <div className="space-y-5 p-4 sm:p-6">
        {/* Active Alerts */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(248,113,113,0.08) 0%, rgba(31,47,68,0.8) 100%)",
            border: "1px solid rgba(248,113,113,0.2)",
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: "1px solid rgba(248,113,113,0.1)" }}
          >
            <AlertTriangle className="size-4" style={{ color: "#f87171" }} />
            <span className="text-sm font-semibold" style={{ color: "#f87171" }}>
              Active Alerts ({unresolvedAlerts.length})
            </span>
          </div>

          <div className="p-4 space-y-3">
            {unresolvedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col gap-3 p-3 rounded-xl sm:flex-row sm:items-start sm:justify-between"
                style={{
                  background: alert.severity === "critical"
                    ? "rgba(248,113,113,0.06)"
                    : "rgba(245,158,11,0.06)",
                  border: `1px solid ${alert.severity === "critical" ? "rgba(248,113,113,0.2)" : "rgba(245,158,11,0.2)"}`,
                }}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <AlertTriangle
                    className="size-4 mt-0.5 shrink-0"
                    style={{ color: alert.severity === "critical" ? "#f87171" : "#f59e0b" }}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">{alert.agentName}</span>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                        style={
                          alert.severity === "critical"
                            ? { background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }
                            : { background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }
                        }
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#7a8fa8" }}>{alert.message}</p>
                  </div>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0">
                  <ArcButton className="w-full sm:w-auto" variant="danger" size="sm">Pause</ArcButton>
                  <ArcButton className="w-full sm:w-auto" variant="outline" size="sm">Resolve</ArcButton>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget controls per agent */}
        <div style={arcCard} className="overflow-hidden">
          <div
            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2">
              <Shield className="size-4" style={{ color: "#5FBFFF" }} />
              <span className="text-sm font-semibold text-white">Budget Controls by Agent</span>
            </div>
            <ArcButton variant="outline" size="sm" icon={BellRing}>Configure alerts</ArcButton>
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {AGENTS.map((agent) => {
              const mPct = pctUsed(agent.monthlySpent, agent.monthlyBudget)
              const dPct = pctUsed(agent.dailySpent, agent.dailyLimit)

              return (
                <div key={agent.id} className="p-4">
                  {/* Agent header row */}
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="size-9 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(77,142,233,0.12)", border: "1px solid rgba(77,142,233,0.2)" }}
                      >
                        <Bot className="size-4" style={{ color: "#5FBFFF" }} />
                      </div>
                      <div>
                        <p className="truncate text-sm font-semibold text-white">{agent.name}</p>
                        <p className="text-[10px] font-mono" style={{ color: "#7a8fa8" }}>{agent.address}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <AgentStatusBadge status={agent.status} />
                      <ArcButton variant="outline" size="sm" icon={Settings2}>Edit limits</ArcButton>
                    </div>
                  </div>

                  {/* Two budget bars side by side */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    {[
                      { label: "Monthly budget", spent: agent.monthlySpent, limit: agent.monthlyBudget, pct: mPct },
                      { label: "Daily limit",    spent: agent.dailySpent,   limit: agent.dailyLimit,    pct: dPct },
                    ].map(({ label, spent, limit, pct }) => (
                      <div
                        key={label}
                        className="p-3 rounded-xl space-y-2"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px]" style={{ color: "#7a8fa8" }}>{label}</span>
                          <span
                            className="text-[11px] font-semibold"
                            style={{ color: pct > 90 ? "#f87171" : pct > 70 ? "#f59e0b" : "#C7C5D1" }}
                          >
                            {pct}%
                          </span>
                        </div>
                        <ArcProgress value={pct} />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium" style={{ color: "#5FBFFF" }}>
                            {formatCompactUSDC(spent)}
                          </span>
                          <span className="text-[10px]" style={{ color: "#7a8fa8" }}>
                            of {formatCompactUSDC(limit)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

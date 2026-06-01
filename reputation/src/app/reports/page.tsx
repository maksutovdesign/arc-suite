"use client"
import { BarChart2, Download, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ArcButton } from "@/components/ui/ArcButton"
import { ArcProgress } from "@/components/ui/ArcProgress"
import { ArcBarChart } from "@/components/charts/BarChart"
import { AGENTS, EVENTS, SCORE_BAR_DATA, TIER_CONFIG } from "@/data/mock"
import { scoreColor } from "@/lib/utils"
import { ARC_CARD } from "@/lib/styles"



export default function ReputationReportsPage() {
  const sorted = [...AGENTS].sort((a, b) => b.score - a.score)
  const avgScore = Math.round(AGENTS.reduce((s, a) => s + a.score, 0) / AGENTS.length)
  const totalTx = AGENTS.reduce((s, a) => s + a.totalTx, 0)
  const verified = AGENTS.filter(a => a.verified).length

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Reputation health across the ecosystem · June 2026"
        icon={BarChart2}
        glow
        actions={<ArcButton variant="outline" size="sm" icon={Download}>Export CSV</ArcButton>}
      />

      <div className="p-6 space-y-5">
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Agents",      value: String(AGENTS.length),        sub: `${verified} verified`, color: "#C7C5D1" },
            { label: "Avg Trust Score",   value: String(avgScore),             sub: "ecosystem average",     color: "#a78bfa" },
            { label: "Total Transactions",value: totalTx.toLocaleString(),     sub: "all-time",              color: "#5FBFFF" },
            { label: "Reputation Events", value: String(EVENTS.length),        sub: "last 30 days",          color: "#34d399" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="p-4 rounded-2xl" style={ARC_CARD}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#7a8fa8" }}>{label}</p>
              <p className="text-2xl font-bold" style={{ color, letterSpacing: "-0.03em" }}>{value}</p>
              <p className="text-[11px] mt-1" style={{ color: "#7a8fa8" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Score bar chart + tier breakdown */}
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 p-4 rounded-2xl" style={ARC_CARD}>
            <p className="text-sm font-semibold text-white mb-4">Trust Score Comparison</p>
            <ArcBarChart
              data={SCORE_BAR_DATA}
              height={220}
              formatValue={(v) => String(v)}
            />
          </div>

          <div className="p-4 rounded-2xl" style={ARC_CARD}>
            <p className="text-sm font-semibold text-white mb-4">Tier Distribution</p>
            <div className="space-y-3">
              {(["platinum","gold","silver","bronze","new"] as const).map((tier) => {
                const cfg = TIER_CONFIG[tier]
                const count = AGENTS.filter(a => a.tier === tier).length
                const pct = Math.round((count / AGENTS.length) * 100)
                return (
                  <div key={tier} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <span className="text-[11px] font-medium text-white">{count} agent{count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg,${scoreColor(cfg.min)},${scoreColor(cfg.max)})` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Detailed agent ranking */}
        <div className="p-4 rounded-2xl" style={ARC_CARD}>
          <p className="text-sm font-semibold text-white mb-4">Full Agent Ranking</p>
          <div className="space-y-0">
            {sorted.map((agent, i) => {
              const col = scoreColor(agent.score)
              const pct = Math.round(agent.score / 10)
              const medals = ["🥇","🥈","🥉"]
              return (
                <div key={agent.id} className="flex items-center gap-4 py-3"
                  style={{ borderBottom: i < sorted.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div className="w-8 text-center">
                    {i < 3
                      ? <span className="text-base">{medals[i]}</span>
                      : <span className="text-sm font-bold" style={{ color: "#3d5468" }}>{i + 1}</span>}
                  </div>
                  <div className="size-8 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: `${col}25`, border: `1px solid ${col}40` }}>
                    {agent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{agent.name}</p>
                    <p className="text-[10px]" style={{ color: "#7a8fa8" }}>{agent.network} · {agent.totalTx.toLocaleString()} txs</p>
                  </div>
                  <div className="w-28">
                    <ArcProgress value={pct} size="sm" />
                  </div>
                  <div className="text-right w-24 shrink-0">
                    <p className="text-sm font-bold" style={{ color: col }}>{agent.score}</p>
                    <p className="text-[10px]" style={{ color: agent.scoreChange >= 0 ? "#34d399" : "#f87171" }}>
                      {agent.scoreChange >= 0 ? "+" : ""}{agent.scoreChange} (30d)
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Success rates */}
        <div className="grid grid-cols-2 gap-5">
          <div className="p-4 rounded-2xl" style={ARC_CARD}>
            <p className="text-sm font-semibold text-white mb-4">Success Rates</p>
            <div className="space-y-3">
              {sorted.map((agent) => {
                const col = scoreColor(agent.score)
                return (
                  <div key={agent.id}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span style={{ color: "#7a8fa8" }}>{agent.name}</span>
                      <span className="font-semibold" style={{ color: col }}>{agent.successRate}%</span>
                    </div>
                    <ArcProgress value={agent.successRate} size="sm" variant="success" />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-4 rounded-2xl" style={ARC_CARD}>
            <p className="text-sm font-semibold text-white mb-4">Dispute Rates</p>
            <div className="space-y-3">
              {[...sorted].sort((a, b) => b.disputeRate - a.disputeRate).map((agent) => {
                const pct = Math.min(100, Math.round(agent.disputeRate * 20))
                const color = agent.disputeRate > 1 ? "#f87171" : agent.disputeRate > 0.3 ? "#f59e0b" : "#34d399"
                return (
                  <div key={agent.id}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span style={{ color: "#7a8fa8" }}>{agent.name}</span>
                      <span className="font-semibold" style={{ color }}>{agent.disputeRate}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}60` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

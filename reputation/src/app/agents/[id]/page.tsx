import { notFound } from "next/navigation"
import { ShieldCheck, CheckCircle, Activity, TrendingUp, TrendingDown, Clock, ArrowLeft, Zap, AlertTriangle, Globe } from "lucide-react"
import { ArcProgress } from "@/components/ui/ArcProgress"
import { ArcButton } from "@/components/ui/ArcButton"
import { AGENTS, EVENTS, TIER_CONFIG } from "@/data/mock"
import { getReputationData } from "@/lib/arc-api"
import { scoreColor, formatUSDC, formatTimestamp } from "@/lib/utils"
import Link from "next/link"

export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  return AGENTS.map(a => ({ id: a.id }))
}

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { agents, source } = await getReputationData()
  const agent = agents.find(a => a.id === id)
  if (!agent) notFound()

  const tier = TIER_CONFIG[agent.tier]
  const col = scoreColor(agent.score)
  const agentEvents = EVENTS.filter(e => e.agentId === agent.id || e.agentName === agent.name)
  const scorePct = Math.round(agent.score / 10)
  const sourceLabel = source === "api" ? "Live Arc API" : "Mock fallback"

  const SCORE_DIMS = [
    { key: "paymentHistory",    label: "Payment History",    max: 250, icon: Zap },
    { key: "volumeConsistency", label: "Volume Consistency", max: 250, icon: TrendingUp },
    { key: "responseTime",      label: "Response Time",      max: 250, icon: Clock },
    { key: "disputeRecord",     label: "Dispute Record",     max: 250, icon: AlertTriangle },
    { key: "accountAge",        label: "Account Age",        max: 250, icon: Activity },
  ] as const

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="relative flex items-center justify-between px-6 py-4 overflow-hidden"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="pointer-events-none absolute left-0 top-0 w-64 h-full opacity-30"
          style={{ background: `radial-gradient(ellipse at 0% 50%, ${col}30 0%, transparent 70%)` }} />

        <div className="relative flex items-center gap-3">
          <Link href="/agents">
            <ArcButton variant="ghost" size="icon"><ArrowLeft className="size-4" /></ArcButton>
          </Link>
          <div className="size-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg,${col}30,${col}18)`, border: `1px solid ${col}44` }}>
            {agent.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-white">{agent.name}</h1>
              {agent.verified && <CheckCircle className="size-4 shrink-0" style={{ color: "#34d399" }} />}
            </div>
            <p className="text-xs font-mono" style={{ color: "#3d5a74" }}>{agent.address}</p>
            <p className="text-[10px] mt-1" style={{ color: "#5FBFFF" }}>{sourceLabel}</p>
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${tier.bg} ${tier.color}`}
            style={{ border: "1px solid currentColor" }}>
            {tier.label} Tier
          </span>
          <ArcButton variant="outline" size="sm">Export report</ArcButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
        {/* Left column — score + breakdown */}
        <div className="flex flex-col gap-4">
          {/* Big score card */}
          <div className="rounded-2xl p-5"
            style={{ background: `linear-gradient(160deg,#263a52,#1e3247)`, border: `1px solid ${col}22`, boxShadow: `0 0 40px ${col}0a` }}>
            <div className="h-0.5 mb-4 rounded-full" style={{ background: `linear-gradient(90deg,${col},${col}44)` }} />
            <p className="text-[11px] font-medium uppercase tracking-widest mb-1" style={{ color: "#7a8fa8" }}>Trust Score</p>
            <p className="text-5xl font-bold leading-none mb-1" style={{ color: col }}>{agent.score}</p>
            <p className="text-xs mb-3" style={{ color: "#7a8fa8" }}>out of 1000</p>
            <ArcProgress value={scorePct} />
            <div className="flex items-center gap-1.5 mt-3">
              {agent.scoreChange >= 0
                ? <TrendingUp className="size-3.5" style={{ color: "#34d399" }} />
                : <TrendingDown className="size-3.5" style={{ color: "#f87171" }} />}
              <span className="text-xs font-semibold"
                style={{ color: agent.scoreChange >= 0 ? "#34d399" : "#f87171" }}>
                {agent.scoreChange >= 0 ? "+" : ""}{agent.scoreChange} pts in last 30 days
              </span>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="rounded-2xl p-5"
            style={{ background: "linear-gradient(160deg,#263a52,#1e3247)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-sm font-semibold text-white mb-4">Score Breakdown</p>
            <div className="space-y-4">
              {SCORE_DIMS.map(({ key, label, max, icon: Icon }) => {
                const val = agent.scoreBreakdown[key]
                const pct = Math.round((val / max) * 100)
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Icon className="size-3" style={{ color: "#7a8fa8" }} />
                        <span className="text-[11px]" style={{ color: "#7a8fa8" }}>{label}</span>
                      </div>
                      <span className="text-xs font-semibold text-white">{val}<span style={{ color: "#3d5a74" }}>/{max}</span></span>
                    </div>
                    <ArcProgress value={pct} size="sm" />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick stats */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(160deg,#263a52,#1e3247)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { label: "Total Transactions", value: agent.totalTx.toLocaleString() },
              { label: "Total Volume",        value: formatUSDC(agent.totalVolumeUSDC) },
              { label: "Success Rate",        value: `${agent.successRate}%` },
              { label: "Avg Response Time",   value: `${agent.avgResponseMs}ms` },
              { label: "Dispute Rate",        value: `${agent.disputeRate}%` },
              { label: "Account Age",         value: `${agent.agedays} days` },
              { label: "Network",             value: agent.network },
              { label: "Last Active",         value: agent.lastActive },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <span className="text-[11px]" style={{ color: "#7a8fa8" }}>{label}</span>
                <span className="text-xs font-semibold text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right columns — events + API snippet */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {agent.tags.map(t => (
              <span key={t} className="text-[11px] px-2.5 py-1 rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.08)" }}>
                {t}
              </span>
            ))}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl"
              style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <Globe className="size-3" style={{ color: "#34d399" }} />
              <span className="text-[11px] font-medium" style={{ color: "#34d399" }}>{agent.network}</span>
            </div>
          </div>

          {/* Reputation history */}
          <div className="rounded-2xl overflow-hidden flex-1"
            style={{ background: "linear-gradient(160deg,#263a52,#1e3247)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <Activity className="size-4" style={{ color: "#a78bfa" }} />
              <p className="text-sm font-semibold text-white">Reputation History</p>
              <span className="ml-auto text-[10px]" style={{ color: "#7a8fa8" }}>
                {agentEvents.length} event{agentEvents.length !== 1 ? "s" : ""}
              </span>
            </div>

            {agentEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="size-8 mb-2" style={{ color: "#3d5a74" }} />
                <p className="text-sm" style={{ color: "#7a8fa8" }}>No reputation events yet</p>
              </div>
            ) : (
              <div>
                {agentEvents.map((ev, i) => (
                  <div key={ev.id} className="flex items-center gap-4 px-5 py-3.5"
                    style={{ borderBottom: i < agentEvents.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white">{ev.description}</p>
                      {ev.txHash && <p className="text-[10px] font-mono mt-0.5" style={{ color: "#3d5a74" }}>{ev.txHash}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px]" style={{ color: "#7a8fa8" }}>{formatTimestamp(ev.timestamp)}</span>
                      <span className="text-sm font-bold w-12 text-right"
                        style={{ color: ev.scoreDelta >= 0 ? "#34d399" : "#f87171" }}>
                        {ev.scoreDelta >= 0 ? "+" : ""}{ev.scoreDelta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Query API snippet */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "#0d1b2a", border: "1px solid rgba(95,191,255,0.15)" }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(95,191,255,0.04)" }}>
              <div className="flex items-center gap-2">
                <Zap className="size-3.5" style={{ color: "#5FBFFF" }} />
                <span className="text-[11px] font-mono font-medium" style={{ color: "#5FBFFF" }}>
                  Query reputation via API
                </span>
              </div>
            </div>
            <pre className="px-5 py-3.5 text-[11px] leading-relaxed overflow-x-auto"
              style={{ color: "#94a3b8", fontFamily: "'Space Mono', monospace" }}>
{`// Arc MCP — query agent reputation
GET https://arcsuite-app.vercel.app/api/reputation/${agent.id}

// Response
{
  "score": ${agent.score},
  "tier": "${agent.tier}",
  "verified": ${agent.verified},
  "successRate": ${agent.successRate},
  "disputeRate": ${agent.disputeRate}
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

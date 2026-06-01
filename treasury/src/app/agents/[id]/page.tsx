import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Bot, Wallet, Activity, Network, Clock,
  Settings2, Pause, Play, Zap, ArrowLeftRight,
  CheckCircle2, XCircle, Loader2, TrendingUp,
} from "lucide-react"
import { AGENTS, TRANSACTIONS, AGENT_SPARKLINES } from "@/data/mock"

export async function generateStaticParams() {
  return AGENTS.map((a) => ({ id: a.id }))
}
import { formatUSDC, pctUsed, formatTimestamp } from "@/lib/utils"
import { CAT_STYLE, AGENT_GRADIENTS, ARC_CARD } from "@/lib/styles"
import { AgentStatusBadge } from "@/components/agents/AgentStatusBadge"
import { ArcProgress } from "@/components/ui/ArcProgress"
import { ArcButton } from "@/components/ui/ArcButton"
import { AgentSparkline } from "@/components/charts/AgentSparkline"

function StatusIcon({ status }: { status: "completed" | "pending" | "failed" }) {
  if (status === "completed") return <CheckCircle2 className="size-3.5 shrink-0" style={{ color: "#34d399" }} />
  if (status === "pending")   return <Loader2 className="size-3.5 shrink-0 animate-spin" style={{ color: "#f59e0b" }} />
  return <XCircle className="size-3.5 shrink-0" style={{ color: "#f87171" }} />
}

const arcCard = ARC_CARD

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const agentIndex = AGENTS.findIndex((a) => a.id === id)
  const agent = AGENTS[agentIndex]
  if (!agent) notFound()

  const grad = AGENT_GRADIENTS[agentIndex % AGENT_GRADIENTS.length]
  const sparkline = AGENT_SPARKLINES[agent.id] ?? []
  const agentTxs = TRANSACTIONS.filter((t) => t.agentId === agent.id)
  const mPct = pctUsed(agent.monthlySpent, agent.monthlyBudget)
  const dPct = pctUsed(agent.dailySpent, agent.dailyLimit)
  const weeklySpend = sparkline.reduce((s, d) => s + d.value, 0)
  // Compute a plausible "last week" total: sum of first 7 days offset or 0 if no data
  const prevWeekSpend = sparkline.length >= 2
    ? sparkline.slice(0, -1).reduce((s, d) => s + d.value, 0)
    : 0
  const weeklyTrend = prevWeekSpend > 0
    ? `${weeklySpend > prevWeekSpend ? "↑" : "↓"} vs ${formatUSDC(prevWeekSpend)} prev week`
    : agent.txCount > 0 ? "First full week" : "No activity yet"

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div
        className="relative flex items-center justify-between px-6 py-4 overflow-hidden"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Ambient glow matching agent colour */}
        <div
          className="pointer-events-none absolute left-0 top-0 w-80 h-full opacity-25"
          style={{ background: `radial-gradient(ellipse at 0% 50%, ${grad.from}40 0%, transparent 70%)` }}
        />

        <div className="relative flex items-center gap-3">
          <Link
            href="/agents"
            className="size-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5 shrink-0"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#7a8fa8" }}
          >
            <ArrowLeft className="size-4" />
          </Link>

          {/* Agent avatar */}
          <div
            className="size-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${grad.from}30 0%, ${grad.to}20 100%)`,
              border: `1px solid ${grad.from}50`,
              boxShadow: `0 0 16px ${grad.from}20`,
            }}
          >
            <Bot className="size-5" style={{ color: grad.from }} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-white tracking-tight">{agent.name}</h1>
              <AgentStatusBadge status={agent.status} />
            </div>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: "#7a8fa8" }}>
              {agent.address} · {agent.network}
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          {agent.status === "paused" ? (
            <ArcButton variant="primary" size="sm" icon={Play}>Resume</ArcButton>
          ) : (
            <ArcButton variant="outline" size="sm" icon={Pause}>Pause</ArcButton>
          )}
          <ArcButton variant="primary" size="sm" icon={Zap}>Top Up</ArcButton>
          <ArcButton variant="outline" size="icon" icon={Settings2} />
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Wallet Balance", value: formatUSDC(agent.balance), icon: Wallet, color: grad.from, sub: agent.balance < 50 ? "⚠ Low" : "Sufficient" },
            { label: "Monthly Spend", value: formatUSDC(agent.monthlySpent), icon: TrendingUp, color: "#5FBFFF", sub: `${mPct}% of ${formatUSDC(agent.monthlyBudget)}` },
            { label: "7-Day Total", value: formatUSDC(weeklySpend), icon: Activity, color: "#34d399", sub: weeklyTrend },
            { label: "Total Transactions", value: agent.txCount.toLocaleString(), icon: ArrowLeftRight, color: "#a78bfa", sub: `Last: ${agent.lastActive}` },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="p-4 rounded-2xl flex flex-col gap-2" style={arcCard}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#7a8fa8" }}>{label}</span>
                <div className="size-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon className="size-3.5" style={{ color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.03em" }}>{value}</p>
              <p className="text-[11px]" style={{ color: sub.startsWith("⚠") ? "#f87171" : "#7a8fa8" }}>{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Left: Sparkline + Budget */}
          <div className="col-span-1 flex flex-col gap-4">
            {/* 7-day mini chart */}
            <div className="p-4 rounded-2xl" style={arcCard}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white">7-Day Spend</span>
                <span className="text-xs font-bold" style={{ color: grad.from }}>{formatUSDC(weeklySpend)}</span>
              </div>
              {sparkline.length > 0 ? (
                <AgentSparkline data={sparkline} color={grad.from} height={60} />
              ) : (
                <div className="h-14 flex items-center justify-center text-xs" style={{ color: "#7a8fa8" }}>No data yet</div>
              )}
              <div className="flex justify-between mt-2">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i} className="text-[9px]" style={{ color: "#3d5468" }}>{d}</span>
                ))}
              </div>
            </div>

            {/* Budget controls */}
            <div className="p-4 rounded-2xl space-y-4" style={arcCard}>
              <span className="text-sm font-semibold text-white">Budget Controls</span>

              {[
                { label: "Monthly", spent: agent.monthlySpent, limit: agent.monthlyBudget, pct: mPct },
                { label: "Daily",   spent: agent.dailySpent,   limit: agent.dailyLimit,    pct: dPct },
              ].map(({ label, spent, limit, pct }) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "#7a8fa8" }}>{label} limit</span>
                    <span style={{ color: pct > 90 ? "#f87171" : "#C7C5D1" }}>
                      {formatUSDC(spent)} <span style={{ color: "#7a8fa8" }}>/ {formatUSDC(limit)}</span>
                    </span>
                  </div>
                  <ArcProgress value={pct} showLabel />
                </div>
              ))}

              <ArcButton variant="outline" size="sm" icon={Settings2} className="w-full justify-center">
                Edit limits
              </ArcButton>
            </div>

            {/* Agent info */}
            <div className="p-4 rounded-2xl space-y-3" style={arcCard}>
              <span className="text-sm font-semibold text-white">Agent Info</span>
              {[
                { label: "Network", value: agent.network },
                { label: "Created", value: agent.createdAt },
                { label: "Tags", value: agent.tags.join(", ") },
                { label: "Wallet", value: agent.address },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-[11px] shrink-0" style={{ color: "#7a8fa8" }}>{label}</span>
                  <span className="text-[11px] font-medium text-right text-white font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Transaction history */}
          <div className="col-span-2 p-4 rounded-2xl" style={arcCard}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white">
                Transaction History
                <span className="ml-2 text-[11px] font-normal" style={{ color: "#7a8fa8" }}>
                  {agentTxs.length} records
                </span>
              </span>
              <Link href="/transactions" className="text-[11px] font-medium transition-colors hover:text-white" style={{ color: "#4d8ee9" }}>
                View all →
              </Link>
            </div>

            {agentTxs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="size-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(77,142,233,0.08)", border: "1px solid rgba(77,142,233,0.15)" }}>
                  <ArrowLeftRight className="size-5" style={{ color: "#5FBFFF" }} />
                </div>
                <p className="text-sm font-medium text-white">No transactions yet</p>
                <p className="text-xs" style={{ color: "#7a8fa8" }}>This agent hasn&apos;t made any payments</p>
              </div>
            ) : (
              <div className="space-y-0">
                {agentTxs.map((tx, i) => {
                  const cat = CAT_STYLE[tx.category] ?? CAT_STYLE.unknown
                  return (
                    <div
                      key={tx.id}
                      className="arc-tx-row flex items-center gap-3 py-3 rounded-xl px-2 -mx-2"
                      style={{ borderBottom: i < agentTxs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                    >
                      <StatusIcon status={tx.status} />

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono" style={{ color: "#3d5468" }}>{tx.txHash}</span>
                          <span style={{ color: "#2d4560" }}>·</span>
                          <span className="text-[10px] flex items-center gap-0.5" style={{ color: "#7a8fa8" }}>
                            <Clock className="size-2.5" />{formatTimestamp(tx.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
                        >
                          {tx.category.replace("_", " ")}
                        </span>
                        <span className="text-xs font-bold text-white tabular-nums w-16 text-right">
                          {formatUSDC(tx.amount)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from "next"
export const metadata: Metadata = { title: "Dashboard — Arc Treasury" }

import {
  Bot,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ArrowLeftRight,
  Clock,
  Bell,
  Download,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { StatCard } from "@/components/dashboard/StatCard"
import { AlertBanner } from "@/components/dashboard/AlertBanner"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { LiveTicker } from "@/components/dashboard/LiveTicker"
import { ArcProgress } from "@/components/ui/ArcProgress"
import { ArcButton } from "@/components/ui/ArcButton"
import { SpendChart } from "@/components/charts/SpendChart"
import { CategoryChart } from "@/components/charts/CategoryChart"
import { AgentStatusBadge } from "@/components/agents/AgentStatusBadge"
import { getTreasuryDashboardData } from "@/lib/arc-api"
import { CAT_STYLE } from "@/lib/styles"
import { formatUSDC, pctUsed, formatTimestamp } from "@/lib/utils"

export const dynamic = "force-dynamic"

// Arc card wrapper style
const arcCard = {
  background: "linear-gradient(160deg, #263a52 0%, #1e3247 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
}

// Arc section title — action is a route href
function SectionTitle({ children, actionLabel, actionHref }: { children: string; actionLabel?: string; actionHref?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>{children}</h2>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="text-[11px] font-medium transition-colors hover:text-white" style={{ color: "#4d8ee9" }}>
          {actionLabel} →
        </Link>
      )}
    </div>
  )
}

export default async function DashboardPage() {
  const { agents, alerts, transactions, accessDecisions, stats, source } = await getTreasuryDashboardData()
  const recentTxs = transactions.slice(0, 6)
  const topAgents = agents.slice(0, 5)
  const agentNames = new Map(agents.map((agent) => [agent.id, agent.name]))

  return (
    <div className="flex flex-col min-h-full">
      {/* Arc-style header */}
      <PageHeader
        title="Dashboard"
        subtitle={`Overview of all AI agent spending · ${source === "api" ? "Live pilot API" : "Mock fallback"}`}
        icon={LayoutDashboard}
        glow
        actions={
          <>
            <LiveTicker />
            <ArcButton variant="outline" size="sm" icon={Download}>Export</ArcButton>
            <div className="relative">
              <ArcButton variant="outline" size="icon" icon={Bell} />
              <span
                className="absolute top-1 right-1 size-2 rounded-full pointer-events-none"
                style={{ background: "#f87171", boxShadow: "0 0 6px rgba(248,113,113,0.8)" }}
              />
            </div>
          </>
        }
      />

      {/* Critical alert banner */}
      <AlertBanner />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 pt-5">
        <StatCard
          title="Total USDC Managed"
          value={formatUSDC(stats.totalUSDCManaged)}
          sub="Across all wallets"
          icon={DollarSign}
          trend={{ value: "+12.4% this week", up: true }}
        />
        <StatCard
          title="Active Agents"
          value={`${stats.activeAgents} / ${stats.totalAgents}`}
          sub={`${agents.filter(a => a.status === "paused" || a.status === "idle").length} paused or idle`}
          icon={Bot}
          accent="success"
        />
        <StatCard
          title="Monthly Spend"
          value={formatUSDC(stats.monthlySpent)}
          sub={`of ${formatUSDC(stats.monthlyBudget)} budget`}
          icon={TrendingUp}
          accent={pctUsed(stats.monthlySpent, stats.monthlyBudget) > 80 ? "warning" : "default"}
          trend={{ value: `${pctUsed(stats.monthlySpent, stats.monthlyBudget)}% used`, up: false }}
        />
        <StatCard
          title="Active Alerts"
          value={String(alerts.filter(a => !a.resolved).length)}
          sub={`${alerts.filter(a => !a.resolved && a.severity === "critical").length} critical · ${alerts.filter(a => !a.resolved && a.severity === "warning").length} warning`}
          icon={AlertTriangle}
          accent="danger"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-6 pt-4">
        <div className="lg:col-span-2 p-4" style={arcCard}>
          <SectionTitle>Spend Over Time — 7 days</SectionTitle>
          <SpendChart />
        </div>
        <div className="p-4" style={arcCard}>
          <SectionTitle>Spend by Category</SectionTitle>
          <CategoryChart />
        </div>
      </div>

      {/* Agent budgets + Recent txs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-6 pt-4 pb-6">
        {/* Agent budgets */}
        <div className="p-4" style={arcCard}>
          <SectionTitle actionLabel="View all" actionHref="/agents">Agent Budgets</SectionTitle>
          <div className="space-y-4">
            {topAgents.map((agent) => {
              const pct = pctUsed(agent.monthlySpent, agent.monthlyBudget)
              return (
                <div key={agent.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "rgba(77,142,233,0.15)", border: "1px solid rgba(77,142,233,0.2)" }}
                      >
                        <Bot className="size-3" style={{ color: "#5FBFFF" }} />
                      </div>
                      <span className="text-sm font-medium text-white">{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AgentStatusBadge status={agent.status} />
                      <span className="text-[11px]" style={{ color: "#7a8fa8" }}>
                        {formatUSDC(agent.monthlySpent)} / {formatUSDC(agent.monthlyBudget)}
                      </span>
                    </div>
                  </div>
                  <ArcProgress value={pct} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="p-4" style={arcCard}>
          <SectionTitle actionLabel="View all" actionHref="/transactions">Recent Transactions</SectionTitle>
          <div className="space-y-0">
            {recentTxs.map((tx, i) => (
              <div
                key={tx.id}
                className="arc-tx-row flex items-center gap-3 py-2.5 cursor-pointer rounded-xl px-2 -mx-2"
                style={{ borderBottom: i < recentTxs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
              >
                <div
                  className="size-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(77,142,233,0.1)", border: "1px solid rgba(77,142,233,0.15)" }}
                >
                  <ArrowLeftRight className="size-3" style={{ color: "#5FBFFF" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{tx.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px]" style={{ color: "#7a8fa8" }}>{tx.agentName}</span>
                    <span style={{ color: "#3d5468" }}>·</span>
                    <span className="text-[10px] flex items-center gap-0.5" style={{ color: "#7a8fa8" }}>
                      <Clock className="size-2.5" />
                      {formatTimestamp(tx.timestamp)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-bold text-white">{formatUSDC(tx.amount)}</span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{
                      background: CAT_STYLE[tx.category]?.bg ?? CAT_STYLE.unknown.bg,
                      color: CAT_STYLE[tx.category]?.color ?? CAT_STYLE.unknown.color,
                      border: `1px solid ${CAT_STYLE[tx.category]?.border ?? CAT_STYLE.unknown.border}`,
                    }}
                  >
                    {tx.category.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="p-4" style={arcCard}>
          <SectionTitle>Access Decisions</SectionTitle>
          {accessDecisions.length === 0 ? (
            <div className="py-8 text-center text-xs" style={{ color: "#7a8fa8" }}>
              No access decisions yet. Run <span className="font-mono">POST /api/access/check</span> to populate the audit log.
            </div>
          ) : (
            <div className="space-y-0">
              {accessDecisions.slice(0, 8).map((decision, index) => (
                <div
                  className="grid grid-cols-[24px_minmax(0,1fr)_90px_90px_120px] items-center gap-3 py-2.5 text-xs"
                  key={decision.id}
                  style={{ borderBottom: index < accessDecisions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                >
                  {decision.allowed ? (
                    <CheckCircle2 className="size-4" style={{ color: "#34d399" }} />
                  ) : (
                    <XCircle className="size-4" style={{ color: "#f87171" }} />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{agentNames.get(decision.agentId) ?? decision.agentId}</p>
                    <p className="truncate text-[10px]" style={{ color: "#7a8fa8" }}>{decision.reason}</p>
                  </div>
                  <span className="font-mono" style={{ color: "#5FBFFF" }}>{decision.apiId}</span>
                  <span className="text-right text-white">{formatUSDC(decision.amountUsdc)}</span>
                  <span className="text-right text-[10px]" style={{ color: "#7a8fa8" }}>{formatTimestamp(decision.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from "next"
import { Download, BarChart2, Bot } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ArcButton } from "@/components/ui/ArcButton"
import { ArcProgress } from "@/components/ui/ArcProgress"
import { SpendChart } from "@/components/charts/SpendChart"
import { CategoryChart } from "@/components/charts/CategoryChart"
import { ArcBarChart } from "@/components/charts/BarChart"
import { AGENTS, CATEGORY_BREAKDOWN, STATS, AGENT_BAR_DATA } from "@/data/mock"
import { ARC_CARD } from "@/lib/styles"
import { formatUSDC, pctUsed } from "@/lib/utils"

export const metadata: Metadata = { title: "Reports — Arc Treasury" }

const arcCard = ARC_CARD

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="text-sm font-semibold text-white mb-4" style={{ letterSpacing: "-0.01em" }}>
      {children}
    </h2>
  )
}

export default function ReportsPage() {
  const sortedBySpend = [...AGENTS].sort((a, b) => b.monthlySpent - a.monthlySpent)
  const budgetPct = pctUsed(STATS.monthlySpent, STATS.monthlyBudget)
  const remaining = STATS.monthlyBudget - STATS.monthlySpent

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Reports & Analytics"
        subtitle="June 2026 · Arc Corp · Arc Testnet"
        icon={BarChart2}
        glow
        actions={<ArcButton variant="outline" size="sm" icon={Download}>Export CSV</ArcButton>}
      />

      <div className="p-6 space-y-5">
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "Total Transactions",
              value: STATS.totalTransactions.toLocaleString(),
              sub: `Avg cost ${formatUSDC(STATS.avgTxCost)}`,
              color: "#4d8ee9",
            },
            {
              label: "Budget Used",
              value: `${budgetPct}%`,
              sub: `${formatUSDC(remaining)} remaining`,
              color: budgetPct > 80 ? "#f59e0b" : "#34d399",
            },
            {
              label: "Total USDC Settled",
              value: formatUSDC(STATS.monthlySpent),
              sub: `of ${formatUSDC(STATS.monthlyBudget)} budget`,
              color: "#5FBFFF",
            },
            {
              label: "Top Spender",
              value: sortedBySpend[0].name.split("-")[0],
              sub: `${formatUSDC(sortedBySpend[0].monthlySpent)} this month`,
              color: "#f87171",
            },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="p-4 rounded-2xl" style={arcCard}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#7a8fa8" }}>
                {label}
              </p>
              <p className="text-2xl font-bold text-white" style={{ letterSpacing: "-0.03em", color }}>
                {value}
              </p>
              <p className="text-[11px] mt-1" style={{ color: "#7a8fa8" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 p-4 rounded-2xl" style={arcCard}>
            <SectionLabel>Daily Spend — Last 7 Days</SectionLabel>
            <SpendChart />
          </div>
          <div className="p-4 rounded-2xl" style={arcCard}>
            <SectionLabel>Spend by Category</SectionLabel>
            <CategoryChart />
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-3 gap-5">
          {/* Agent bar chart */}
          <div className="col-span-2 p-4 rounded-2xl" style={arcCard}>
            <SectionLabel>Monthly Spend by Agent</SectionLabel>
            <ArcBarChart data={AGENT_BAR_DATA} height={220} />
          </div>

          {/* Category table */}
          <div className="p-4 rounded-2xl" style={arcCard}>
            <SectionLabel>Category Breakdown</SectionLabel>
            <div className="space-y-3">
              {CATEGORY_BREAKDOWN.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full shrink-0" style={{ background: cat.color }} />
                      <span className="text-xs text-white">{cat.name}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: cat.color }}>{cat.value}%</span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${cat.value}%`,
                        background: `linear-gradient(90deg, ${cat.color}cc, ${cat.color})`,
                        boxShadow: `0 0 6px ${cat.color}60`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agent ranking table */}
        <div className="p-4 rounded-2xl" style={arcCard}>
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Agent Spend Ranking</SectionLabel>
          </div>

          <div className="space-y-0">
            {sortedBySpend.map((agent, i) => {
              const pct = pctUsed(agent.monthlySpent, agent.monthlyBudget)
              const medals = ["🥇", "🥈", "🥉"]

              return (
                <div
                  key={agent.id}
                  className="flex items-center gap-4 py-3"
                  style={{ borderBottom: i < sortedBySpend.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                >
                  {/* Rank */}
                  <div className="w-8 text-center">
                    {i < 3 ? (
                      <span className="text-base">{medals[i]}</span>
                    ) : (
                      <span className="text-sm font-bold" style={{ color: "#3d5468" }}>{i + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    className="size-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(77,142,233,0.12)", border: "1px solid rgba(77,142,233,0.2)" }}
                  >
                    <Bot className="size-4" style={{ color: "#5FBFFF" }} />
                  </div>

                  {/* Name + network */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{agent.name}</p>
                    <p className="text-[10px]" style={{ color: "#7a8fa8" }}>{agent.network}</p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-32">
                    <ArcProgress value={pct} size="sm" />
                  </div>

                  {/* Spend + budget */}
                  <div className="text-right w-36 shrink-0">
                    <p className="text-sm font-bold text-white">{formatUSDC(agent.monthlySpent)}</p>
                    <p className="text-[10px]" style={{ color: "#7a8fa8" }}>
                      {pct}% of {formatUSDC(agent.monthlyBudget)}
                    </p>
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

import type { Metadata } from "next"
export const metadata: Metadata = { title: "Transactions — Arc Treasury" }

import { ArrowLeftRight, Clock, CheckCircle2, XCircle, Loader2, SlidersHorizontal, Download, ExternalLink } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ArcButton } from "@/components/ui/ArcButton"
import { getTreasuryDashboardData } from "@/lib/arc-api"
import { CAT_STYLE } from "@/lib/styles"
import { formatUSDC, formatTimestamp } from "@/lib/utils"

export const dynamic = "force-dynamic"

// Status icon components
function StatusIndicator({ status }: { status: "completed" | "pending" | "failed" }) {
  if (status === "completed") return (
    <div className="flex items-center gap-1.5">
      <CheckCircle2 className="size-3.5" style={{ color: "#34d399" }} />
      <span className="text-[11px] font-medium" style={{ color: "#34d399" }}>Confirmed</span>
    </div>
  )
  if (status === "pending") return (
    <div className="flex items-center gap-1.5">
      <Loader2 className="size-3.5 animate-spin" style={{ color: "#f59e0b" }} />
      <span className="text-[11px] font-medium" style={{ color: "#f59e0b" }}>Pending</span>
    </div>
  )
  return (
    <div className="flex items-center gap-1.5">
      <XCircle className="size-3.5" style={{ color: "#f87171" }} />
      <span className="text-[11px] font-medium" style={{ color: "#f87171" }}>Failed</span>
    </div>
  )
}

export default async function TransactionsPage() {
  const { transactions, source } = await getTreasuryDashboardData()
  const total = transactions.reduce((sum, transaction) => transaction.status === "completed" ? sum + transaction.amount : sum, 0)
  const failed = transactions.filter((transaction) => transaction.status === "failed").length
  const pending = transactions.filter((transaction) => transaction.status === "pending").length

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Transactions"
        subtitle={`${transactions.length} total · ${formatUSDC(total)} settled · ${failed} failed · ${pending} pending · ${source === "api" ? "Live pilot API" : "Mock fallback"}`}
        icon={ArrowLeftRight}
        glow
        actions={
          <>
            <ArcButton variant="outline" size="sm" icon={SlidersHorizontal}>Filter</ArcButton>
            <ArcButton variant="outline" size="sm" icon={Download}>Export</ArcButton>
          </>
        }
      />

      {/* Summary strip */}
      <div className="flex items-center gap-6 px-6 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {[
          { label: "Total settled",  value: formatUSDC(total),   color: "#5FBFFF" },
          { label: "Completed",      value: `${transactions.filter((transaction) => transaction.status === "completed").length}`, color: "#34d399" },
          { label: "Pending",        value: String(pending),     color: "#f59e0b" },
          { label: "Failed",         value: String(failed),      color: "#f87171" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "#7a8fa8" }}>{s.label}</span>
            <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="p-6">
        <div
          className="overflow-x-auto rounded-2xl"
          style={{ border: "1px solid rgba(255,255,255,0.07)", background: "linear-gradient(160deg, #263a52 0%, #1e3247 100%)" }}
        >
          <div className="min-w-[900px]">
          {/* Table header */}
          <div
            className="grid px-4 py-3"
            style={{
              gridTemplateColumns: "120px 1fr 160px 110px 90px 80px 100px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {["Status", "Description", "Agent", "Category", "Network", "Time", "Amount"].map((h, i) => (
              <span
                key={h}
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#7a8fa8", textAlign: i === 6 ? "right" : "left" }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {transactions.map((tx, i) => {
            const cat = CAT_STYLE[tx.category] ?? CAT_STYLE.unknown
            const isLast = i === transactions.length - 1
            const isFailed = tx.status === "failed"

            return (
              <div
                key={tx.id}
                className="arc-tx-row grid px-4 py-3 items-center cursor-pointer"
                style={{
                  gridTemplateColumns: "120px 1fr 160px 110px 90px 80px 100px",
                  borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
                  opacity: isFailed ? 0.55 : 1,
                }}
              >
                {/* Status */}
                <div><StatusIndicator status={tx.status} /></div>

                {/* Description */}
                <div className="flex items-center gap-2.5 min-w-0 pr-4">
                  <div
                    className="size-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(77,142,233,0.1)", border: "1px solid rgba(77,142,233,0.2)" }}
                  >
                    <ArrowLeftRight className="size-3" style={{ color: "#5FBFFF" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{tx.description}</p>
                    {tx.explorerUrl ? (
                      <a
                        className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-mono hover:underline"
                        href={tx.explorerUrl}
                        rel="noreferrer"
                        style={{ color: "#5FBFFF" }}
                        target="_blank"
                      >
                        <span className="truncate">{tx.txHash}</span>
                        <ExternalLink className="size-2.5 shrink-0" />
                      </a>
                    ) : (
                      <p className="text-[10px] font-mono truncate mt-0.5" style={{ color: "#3d5a74" }}>{tx.txHash}</p>
                    )}
                  </div>
                </div>

                {/* Agent */}
                <div>
                  <span className="text-[11px]" style={{ color: "#C7C5D1" }}>{tx.agentName}</span>
                </div>

                {/* Category badge */}
                <div>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
                  >
                    {tx.category.replace("_", " ")}
                  </span>
                </div>

                {/* Network */}
                <div>
                  <span
                    className="inline-flex items-center gap-1 text-[11px]"
                    style={{ color: "#7a8fa8" }}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: tx.network === "Arc" ? "#4d8ee9" : "#a78bfa" }}
                    />
                    {tx.network}
                  </span>
                </div>

                {/* Time */}
                <div className="flex items-center gap-1" style={{ color: "#7a8fa8" }}>
                  <Clock className="size-2.5" />
                  <span className="text-[11px]">{formatTimestamp(tx.timestamp)}</span>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <span
                    className="text-xs font-bold"
                    style={{
                      color: isFailed ? "#7a8fa8" : "#E8E6F0",
                      textDecoration: isFailed ? "line-through" : "none",
                    }}
                  >
                    {formatUSDC(tx.amount)}
                  </span>
                  <p className="text-[9px] mt-0.5" style={{ color: "#3d5a74" }}>USDC</p>
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

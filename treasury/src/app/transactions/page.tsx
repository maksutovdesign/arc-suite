import type { Metadata } from "next"
export const metadata: Metadata = { title: "Transactions — Arc Treasury" }

import { ArrowLeftRight, Clock, CheckCircle2, XCircle, Loader2, SlidersHorizontal, Download, ExternalLink, ReceiptText, Layers3 } from "lucide-react"
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

function memoSummary(memo: Record<string, unknown> | undefined) {
  if (!memo) return null
  const primary = ["invoiceId", "payoutReference", "paymentReference", "strategyId"]
    .map((key) => [key, memo[key]] as const)
    .find(([, value]) => typeof value === "string" && value.length > 0)
  if (!primary) return null
  return `${primary[0]}: ${primary[1]}`
}

export default async function TransactionsPage() {
  const { transactions, source } = await getTreasuryDashboardData()
  const total = transactions.reduce((sum, transaction) => transaction.status === "completed" ? sum + transaction.amount : sum, 0)
  const failed = transactions.filter((transaction) => transaction.status === "failed").length
  const pending = transactions.filter((transaction) => transaction.status === "pending").length
  const memoCount = transactions.filter((transaction) => transaction.memoLabel || memoSummary(transaction.memo)).length

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Transactions"
        subtitle={`${transactions.length} total · ${formatUSDC(total)} settled · ${memoCount} memo receipts · ${failed} failed · ${pending} pending · ${source === "api" ? "Live pilot API" : "Mock fallback"}`}
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
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6 sm:gap-x-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {[
          { label: "Total settled",  value: formatUSDC(total),   color: "#5FBFFF" },
          { label: "Completed",      value: `${transactions.filter((transaction) => transaction.status === "completed").length}`, color: "#34d399" },
          { label: "Memo receipts",  value: String(memoCount), color: "#a78bfa" },
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
      <div className="p-4 sm:p-6">
        <div
          className="mb-4 grid gap-3 rounded-2xl p-4 md:grid-cols-[1.2fr_1fr]"
          style={{ background: "linear-gradient(160deg,#263a52,#1e3247)", border: "1px solid rgba(167,139,250,0.16)" }}
        >
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.22)" }}>
              <Layers3 className="size-4" style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Batch Spend Workflow</p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                One agent can group API calls, data-feed payouts, or treasury actions into a single workflow while preserving a memo receipt for every call.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { label: "Calls", value: "3" },
              { label: "Policy", value: "Per call" },
              { label: "Memos", value: "Call level" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl px-3 py-2"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: "#7a8fa8" }}>{item.label}</p>
                <p className="mt-1 text-xs font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

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
            const memoText = memoSummary(tx.memo)

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
                    {(tx.memoLabel || memoText) && (
                      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px]" style={{ color: "#a78bfa" }}>
                        <ReceiptText className="size-3 shrink-0" />
                        <span className="truncate">{tx.memoLabel ?? "Memo receipt"}{memoText ? ` · ${memoText}` : ""}</span>
                      </div>
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

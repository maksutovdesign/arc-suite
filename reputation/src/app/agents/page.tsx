"use client"

import Link from "next/link"
import { useState } from "react"
import { ShieldCheck, CheckCircle, Activity, TrendingUp, TrendingDown, Clock, Search, X } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ArcButton } from "@/components/ui/ArcButton"
import { ArcProgress } from "@/components/ui/ArcProgress"
import { ScoreSparkline } from "@/components/charts/ScoreSparkline"
import { AGENTS, TIER_CONFIG, SCORE_HISTORY } from "@/data/mock"
import { scoreColor, formatUSDC } from "@/lib/utils"

type SortKey = "score" | "trend" | "volume" | "txs" | "dispute"

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "score",    label: "Highest score"   },
  { value: "trend",    label: "Best 30d trend"  },
  { value: "volume",   label: "Most volume"     },
  { value: "txs",      label: "Most txs"        },
  { value: "dispute",  label: "Lowest disputes" },
]

export default function AgentsPage() {
  const [query, setQuery]       = useState("")
  const [sort, setSort]         = useState<SortKey>("score")
  const [verified, setVerified] = useState(false)
  const [network, setNetwork]   = useState<"all" | "Arc" | "Ethereum">("all")

  const filtered = AGENTS
    .filter(a => !verified || a.verified)
    .filter(a => network === "all" || a.network === network)
    .filter(a => a.name.toLowerCase().includes(query.toLowerCase()) || a.address.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      switch (sort) {
        case "trend":   return b.scoreChange - a.scoreChange
        case "volume":  return b.totalVolumeUSDC - a.totalVolumeUSDC
        case "txs":     return b.totalTx - a.totalTx
        case "dispute": return a.disputeRate - b.disputeRate
        default:        return b.score - a.score
      }
    })

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="All Agents"
        subtitle={`${AGENTS.length} registered · ${AGENTS.filter(a => a.verified).length} verified · ${AGENTS.filter(a => a.tier !== "new").length} established`}
        icon={ShieldCheck}
        glow
        actions={<ArcButton variant="outline" size="sm">Export CSV</ArcButton>}
      />

      {/* Filter bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b flex-wrap" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {/* Search */}
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5" style={{ color: "#7a8fa8" }} />
          <input
            className="w-full pl-8 pr-8 h-8 text-sm rounded-xl outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#E8E6F0" }}
            placeholder="Search…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="size-3" style={{ color: "#7a8fa8" }} />
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          className="h-8 px-2.5 rounded-xl text-xs outline-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#C7C5D1" }}
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}>
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value} style={{ background: "#1e3247" }}>{o.label}</option>
          ))}
        </select>

        {/* Network */}
        {(["all","Arc","Ethereum"] as const).map(n => (
          <button key={n}
            onClick={() => setNetwork(n)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
            style={network === n
              ? { background: "rgba(77,142,233,0.2)", color: "#5FBFFF", border: "1px solid rgba(77,142,233,0.3)" }
              : { background: "rgba(255,255,255,0.03)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.07)" }}>
            {n === "all" ? "All Networks" : n}
          </button>
        ))}

        {/* Verified toggle */}
        <button
          onClick={() => setVerified(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
          style={verified
            ? { background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }
            : { background: "rgba(255,255,255,0.03)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.07)" }}>
          <CheckCircle className="size-3" />
          Verified only
        </button>

        <span className="ml-auto text-[11px]" style={{ color: "#7a8fa8" }}>
          {filtered.length} of {AGENTS.length} agents
        </span>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
        {filtered.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-16">
            <Search className="size-10 mb-3" style={{ color: "#3d5a74" }} />
            <p className="text-base font-semibold text-white">No agents found</p>
            <p className="text-sm mt-1" style={{ color: "#7a8fa8" }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          filtered.map((agent) => {
            const col = scoreColor(agent.score)
            const tier = TIER_CONFIG[agent.tier]
            const scorePct = Math.round(agent.score / 10)
            const sparkData = SCORE_HISTORY[agent.id] ?? []

            return (
              <Link key={agent.id} href={`/agents/${agent.id}`}>
                <div className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 flex flex-col"
                  style={{
                    background: "linear-gradient(160deg,#263a52 0%,#1e3247 100%)",
                    border: `1px solid ${col}22`,
                    boxShadow: `0 4px 24px rgba(0,0,0,0.2), 0 0 0 1px ${col}11`,
                  }}>

                  {/* Accent bar */}
                  <div className="h-0.5" style={{ background: `linear-gradient(90deg,${col},${col}44)` }} />

                  <div className="p-4 flex flex-col gap-3 flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: `${col}25`, border: `1px solid ${col}40` }}>
                          {agent.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-white">{agent.name}</p>
                            {agent.verified && <CheckCircle className="size-3 shrink-0" style={{ color: "#34d399" }} />}
                          </div>
                          <p className="text-[10px] font-mono mt-0.5" style={{ color: "#3d5a74" }}>{agent.address}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${tier.bg} ${tier.color}`}
                        style={{ border: "1px solid currentColor" }}>
                        {tier.label}
                      </span>
                    </div>

                    {/* Score + Sparkline side by side */}
                    <div className="flex items-end gap-3">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-widest mb-0.5" style={{ color: "#7a8fa8" }}>Trust Score</p>
                        <p className="text-3xl font-bold leading-none" style={{ color: col }}>{agent.score}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {agent.scoreChange >= 0
                            ? <TrendingUp className="size-3" style={{ color: "#34d399" }} />
                            : <TrendingDown className="size-3" style={{ color: "#f87171" }} />}
                          <span className="text-[10px] font-semibold"
                            style={{ color: agent.scoreChange >= 0 ? "#34d399" : "#f87171" }}>
                            {agent.scoreChange >= 0 ? "+" : ""}{agent.scoreChange}
                          </span>
                          <span className="text-[10px]" style={{ color: "#7a8fa8" }}>(30d)</span>
                        </div>
                      </div>
                      <div className="flex-1 pb-1">
                        <ScoreSparkline data={sparkData} color={col} height={48} />
                      </div>
                    </div>

                    {/* Progress bar */}
                    <ArcProgress value={scorePct} />

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 rounded-xl overflow-hidden"
                      style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                      {[
                        { label: "Success", value: `${agent.successRate}%` },
                        { label: "Resp",    value: `${agent.avgResponseMs}ms` },
                        { label: "Dispute", value: `${agent.disputeRate}%` },
                      ].map(({ label, value }, i) => (
                        <div key={label} className="px-3 py-2 text-center"
                          style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none", background: "rgba(255,255,255,0.02)" }}>
                          <p className="text-[10px]" style={{ color: "#7a8fa8" }}>{label}</p>
                          <p className="text-xs font-bold text-white mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-4 py-2.5"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-1.5">
                      <Activity className="size-3" style={{ color: "#7a8fa8" }} />
                      <span className="text-[10px]" style={{ color: "#7a8fa8" }}>
                        {agent.totalTx.toLocaleString()} txs · {formatUSDC(agent.totalVolumeUSDC)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" style={{ color: "#7a8fa8" }} />
                      <span className="text-[10px]" style={{ color: "#7a8fa8" }}>{agent.lastActive}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

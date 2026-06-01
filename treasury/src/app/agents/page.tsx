"use client"

import { useState } from "react"
import Link from "next/link"
import { Bot, Plus, Search, Wallet, Activity, Zap, Network, MoreHorizontal } from "lucide-react"
import { AgentStatusBadge } from "@/components/agents/AgentStatusBadge"
import { ArcProgress } from "@/components/ui/ArcProgress"
import { ArcButton } from "@/components/ui/ArcButton"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { NewAgentModal } from "@/components/agents/NewAgentModal"
import { AGENTS } from "@/data/mock"
import { AGENT_GRADIENTS } from "@/lib/styles"
import { formatUSDC, pctUsed } from "@/lib/utils"

export default function AgentsPage() {
  const [showModal, setShowModal] = useState(false)
  const activeCount = AGENTS.filter(a => a.status === "active").length
  const alertCount  = AGENTS.filter(a => a.status === "alert").length

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Agents"
        subtitle={`${AGENTS.length} registered · ${activeCount} active · ${alertCount} alert`}
        icon={Bot}
        glow
        actions={
          <>
            <div
              className="relative flex items-center"
              style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "rgba(255,255,255,0.04)" }}
            >
              <Search className="absolute left-2.5 size-3.5" style={{ color: "#7a8fa8" }} />
              <input
                className="pl-8 pr-3 h-8 text-sm bg-transparent outline-none w-44 placeholder:text-[#7a8fa8]"
                placeholder="Search agents…"
                style={{ color: "#C7C5D1" }}
              />
            </div>
            <ArcButton variant="primary" size="md" icon={Plus} onClick={() => setShowModal(true)}>New Agent</ArcButton>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
        {AGENTS.map((agent, idx) => {
          const grad = AGENT_GRADIENTS[idx % AGENT_GRADIENTS.length]
          const mPct = pctUsed(agent.monthlySpent, agent.monthlyBudget)
          const dPct = pctUsed(agent.dailySpent, agent.dailyLimit)
          const isAlert  = agent.status === "alert"
          const isPaused = agent.status === "paused"

          return (
            /* ✅ `relative` added so the paused overlay anchors correctly */
            <div
              key={agent.id}
              className="relative rounded-2xl flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(160deg, #263a52 0%, #1e3247 100%)",
                border: isAlert
                  ? "1px solid rgba(248,113,113,0.3)"
                  : "1px solid rgba(255,255,255,0.08)",
                boxShadow: isAlert ? "0 0 20px rgba(248,113,113,0.08)" : "0 4px 24px rgba(0,0,0,0.2)",
              }}
            >
              {/* Coloured top bar */}
              <div className="h-0.5 w-full shrink-0" style={{ background: `linear-gradient(90deg, ${grad.from}, ${grad.to})` }} />

              {/* Header — ✅ plain div instead of <Link> so no button-in-anchor issue */}
              <div className="flex items-start justify-between p-4 pb-3">
                <Link href={`/agents/${agent.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="size-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${grad.from}25 0%, ${grad.to}15 100%)`,
                      border: `1px solid ${grad.from}40`,
                      boxShadow: `0 0 12px ${grad.from}25`,
                    }}
                  >
                    {/* ✅ size-4.5 → size-5 (valid Tailwind) */}
                    <Bot className="size-5" style={{ color: grad.from }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white leading-none truncate">{agent.name}</p>
                    <p className="text-[10px] font-mono mt-1 truncate" style={{ color: "#7a8fa8" }}>
                      {agent.address}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <AgentStatusBadge status={agent.status} />
                  {/* ✅ MoreHorizontal icon (proper Lucide icon, outside <Link>) */}
                  <button
                    onClick={e => { e.stopPropagation(); e.preventDefault() }}
                    className="size-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                    style={{ color: "#7a8fa8" }}
                    aria-label="Agent options"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
              </div>

              {/* Balance chip */}
              <Link href={`/agents/${agent.id}`} className="block mx-4 mb-3">
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="size-3.5" style={{ color: "#7a8fa8" }} />
                    <span className="text-xs" style={{ color: "#7a8fa8" }}>Wallet balance</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: agent.balance < 50 ? "#f87171" : "#E8E6F0" }}>
                    {formatUSDC(agent.balance)}
                  </span>
                </div>
              </Link>

              {/* Budget bars */}
              <Link href={`/agents/${agent.id}`} className="block px-4 pb-3 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: "#7a8fa8" }}>Monthly budget</span>
                    <span className="text-[11px] font-medium" style={{ color: mPct > 90 ? "#f87171" : "#C7C5D1" }}>
                      {formatUSDC(agent.monthlySpent)} <span style={{ color: "#7a8fa8" }}>/ {formatUSDC(agent.monthlyBudget)}</span>
                    </span>
                  </div>
                  <ArcProgress value={mPct} showLabel />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: "#7a8fa8" }}>Daily limit</span>
                    <span className="text-[11px] font-medium" style={{ color: dPct > 90 ? "#f87171" : "#C7C5D1" }}>
                      {formatUSDC(agent.dailySpent)} <span style={{ color: "#7a8fa8" }}>/ {formatUSDC(agent.dailyLimit)}</span>
                    </span>
                  </div>
                  <ArcProgress value={dPct} size="sm" showLabel />
                </div>
              </Link>

              {/* Footer */}
              <div
                className="flex items-center justify-between px-4 py-3 mt-auto"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-1.5">
                  <Activity className="size-3" style={{ color: "#7a8fa8" }} />
                  <span className="text-[10px]" style={{ color: "#7a8fa8" }}>
                    {agent.txCount.toLocaleString()} txs · {agent.lastActive}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Network className="size-3" style={{ color: "#7a8fa8" }} />
                  <div className="flex gap-1">
                    {agent.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide"
                        style={{ background: "rgba(77,142,233,0.12)", color: "#5FBFFF", border: "1px solid rgba(77,142,233,0.2)" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ✅ Paused overlay — works correctly now that parent has `relative` */}
              {isPaused && (
                <div
                  className="absolute inset-0 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(15,25,38,0.65)", backdropFilter: "blur(2px)" }}
                >
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}
                  >
                    <Zap className="size-4" style={{ color: "#f59e0b" }} />
                    <span className="text-sm font-semibold" style={{ color: "#f59e0b" }}>Paused</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* New Agent Modal */}
      {showModal && <NewAgentModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

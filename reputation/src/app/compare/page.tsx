"use client"

import { useState } from "react"
import { CheckCircle, ArrowLeftRight, Trophy } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ScoreSparkline } from "@/components/charts/ScoreSparkline"
import { AGENTS, TIER_CONFIG, SCORE_HISTORY } from "@/data/mock"
import { scoreColor, formatUSDC } from "@/lib/utils"

const SCORE_DIMS = [
  { key: "paymentHistory",    label: "Payment History"    },
  { key: "volumeConsistency", label: "Volume Consistency" },
  { key: "responseTime",      label: "Response Time"      },
  { key: "disputeRecord",     label: "Dispute Record"     },
  { key: "accountAge",        label: "Account Age"        },
] as const

function AgentPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "#7a8fa8" }}>{label}</p>
      <select
        className="h-9 px-3 rounded-xl text-sm outline-none"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E8E6F0" }}
        value={value}
        onChange={e => onChange(e.target.value)}>
        {AGENTS.map(a => (
          <option key={a.id} value={a.id} style={{ background: "#1e3247" }}>
            {a.name} — {a.score} pts
          </option>
        ))}
      </select>
    </div>
  )
}

export default function ComparePage() {
  const sorted = [...AGENTS].sort((a, b) => b.score - a.score)
  const [idA, setIdA] = useState(sorted[0].id)
  const [idB, setIdB] = useState(sorted[1].id)

  const agentA = AGENTS.find(a => a.id === idA)!
  const agentB = AGENTS.find(a => a.id === idB)!
  const colA = scoreColor(agentA.score)
  const colB = scoreColor(agentB.score)
  const tierA = TIER_CONFIG[agentA.tier]
  const tierB = TIER_CONFIG[agentB.tier]

  const METRICS = [
    { label: "Trust Score",     a: agentA.score,                 b: agentB.score,                  fmt: (v: number) => String(v),          higherIsBetter: true  },
    { label: "Success Rate",    a: agentA.successRate,            b: agentB.successRate,             fmt: (v: number) => `${v}%`,           higherIsBetter: true  },
    { label: "Dispute Rate",    a: agentA.disputeRate,            b: agentB.disputeRate,             fmt: (v: number) => `${v}%`,           higherIsBetter: false },
    { label: "Avg Response",    a: agentA.avgResponseMs,          b: agentB.avgResponseMs,           fmt: (v: number) => `${v}ms`,          higherIsBetter: false },
    { label: "Total TXs",       a: agentA.totalTx,                b: agentB.totalTx,                 fmt: (v: number) => v.toLocaleString(), higherIsBetter: true  },
    { label: "Volume (USDC)",   a: agentA.totalVolumeUSDC,        b: agentB.totalVolumeUSDC,         fmt: formatUSDC,                        higherIsBetter: true  },
    { label: "Account Age",     a: agentA.agedays,                b: agentB.agedays,                 fmt: (v: number) => `${v}d`,           higherIsBetter: true  },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Compare Agents"
        subtitle="Side-by-side trust score and performance breakdown"
        icon={ArrowLeftRight}
        glow
      />

      {/* Agent selectors */}
      <div className="px-6 py-4 border-b grid grid-cols-3 items-center gap-4"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <AgentPicker label="Agent A" value={idA} onChange={setIdA} />
        <div className="flex justify-center">
          <div className="size-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <ArrowLeftRight className="size-4" style={{ color: "#a78bfa" }} />
          </div>
        </div>
        <AgentPicker label="Agent B" value={idB} onChange={setIdB} />
      </div>

      <div className="p-6 space-y-4">
        {/* Hero cards */}
        <div className="grid grid-cols-3 gap-4">
          {/* Agent A card */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(160deg,#263a52,#1e3247)", border: `1px solid ${colA}33` }}>
            <div className="h-0.5" style={{ background: `linear-gradient(90deg,${colA},${colA}44)` }} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: `${colA}25`, border: `1px solid ${colA}40` }}>
                    {agentA.name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-white">{agentA.name}</p>
                      {agentA.verified && <CheckCircle className="size-3" style={{ color: "#34d399" }} />}
                    </div>
                    <p className="text-[10px] font-mono" style={{ color: "#3d5a74" }}>{agentA.address}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tierA.bg} ${tierA.color}`}
                  style={{ border: "1px solid currentColor" }}>{tierA.label}</span>
              </div>
              <p className="text-4xl font-bold mb-1" style={{ color: colA }}>{agentA.score}</p>
              <p className="text-[11px] mb-3" style={{ color: "#7a8fa8" }}>Trust Score</p>
              <ScoreSparkline data={SCORE_HISTORY[agentA.id] ?? []} color={colA} height={44} />
            </div>
          </div>

          {/* VS panel */}
          <div className="rounded-2xl p-5 flex flex-col gap-3 items-center justify-center"
            style={{ background: "linear-gradient(160deg,#263a52,#1e3247)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7a8fa8" }}>Score diff</p>
            <p className="text-3xl font-bold" style={{ color: Math.abs(agentA.score - agentB.score) > 100 ? "#f87171" : "#f59e0b" }}>
              {agentA.score > agentB.score ? "+" : "-"}{Math.abs(agentA.score - agentB.score)}
            </p>
            <p className="text-[11px] text-center" style={{ color: "#7a8fa8" }}>
              {agentA.score > agentB.score ? agentA.name.split("-")[0] : agentB.name.split("-")[0]} leads
            </p>
            <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7a8fa8" }}>Winner</p>
            <div className="size-10 rounded-xl flex items-center justify-center text-lg">
              {agentA.score > agentB.score ? "🥇" : "🥈"}
            </div>
            <p className="text-sm font-bold text-white text-center">
              {agentA.score >= agentB.score ? agentA.name : agentB.name}
            </p>
          </div>

          {/* Agent B card */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(160deg,#263a52,#1e3247)", border: `1px solid ${colB}33` }}>
            <div className="h-0.5" style={{ background: `linear-gradient(90deg,${colB},${colB}44)` }} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: `${colB}25`, border: `1px solid ${colB}40` }}>
                    {agentB.name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-white">{agentB.name}</p>
                      {agentB.verified && <CheckCircle className="size-3" style={{ color: "#34d399" }} />}
                    </div>
                    <p className="text-[10px] font-mono" style={{ color: "#3d5a74" }}>{agentB.address}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tierB.bg} ${tierB.color}`}
                  style={{ border: "1px solid currentColor" }}>{tierB.label}</span>
              </div>
              <p className="text-4xl font-bold mb-1" style={{ color: colB }}>{agentB.score}</p>
              <p className="text-[11px] mb-3" style={{ color: "#7a8fa8" }}>Trust Score</p>
              <ScoreSparkline data={SCORE_HISTORY[agentB.id] ?? []} color={colB} height={44} />
            </div>
          </div>
        </div>

        {/* Score dimension comparison */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(160deg,#263a52,#1e3247)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <Trophy className="size-4" style={{ color: "#facc15" }} />
            <p className="text-sm font-semibold text-white">Dimension Comparison</p>
          </div>
          <div>
            {SCORE_DIMS.map(({ key, label }, i) => {
              const valA = agentA.scoreBreakdown[key]
              const valB = agentB.scoreBreakdown[key]
              const max = 250
              const pctA = Math.round((valA / max) * 100)
              const pctB = Math.round((valB / max) * 100)
              const winnerA = valA >= valB

              return (
                <div key={key} className="px-5 py-3.5"
                  style={{ borderBottom: i < SCORE_DIMS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div className="flex items-center gap-4">
                    {/* A value */}
                    <div className="w-10 text-right">
                      <span className="text-sm font-bold" style={{ color: winnerA ? colA : "#7a8fa8" }}>{valA}</span>
                    </div>
                    {/* A bar */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <div className="h-full rounded-full float-right transition-all duration-700"
                            style={{ width: `${pctA}%`, background: `linear-gradient(90deg,${colA}44,${colA})` }} />
                        </div>
                        <span className="text-[11px] w-28 text-center font-medium text-white">{label}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pctB}%`, background: `linear-gradient(90deg,${colB},${colB}44)` }} />
                        </div>
                      </div>
                    </div>
                    {/* B value */}
                    <div className="w-10">
                      <span className="text-sm font-bold" style={{ color: !winnerA ? colB : "#7a8fa8" }}>{valB}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Full metrics table */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(160deg,#263a52,#1e3247)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="grid px-5 py-3 border-b"
            style={{ gridTemplateColumns: "1fr 140px 140px", borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#7a8fa8" }}>Metric</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-center" style={{ color: colA }}>{agentA.name.split("-")[0]}</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-center" style={{ color: colB }}>{agentB.name.split("-")[0]}</span>
          </div>
          {METRICS.map(({ label, a, b, fmt, higherIsBetter }, i) => {
            const aWins = higherIsBetter ? a >= b : a <= b
            const bWins = higherIsBetter ? b > a : b < a
            return (
              <div key={label} className="grid items-center px-5 py-3"
                style={{ gridTemplateColumns: "1fr 140px 140px", borderBottom: i < METRICS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <span className="text-sm" style={{ color: "#7a8fa8" }}>{label}</span>
                <div className="text-center">
                  <span className="text-sm font-bold" style={{ color: aWins ? colA : "#7a8fa8" }}>{fmt(a)}</span>
                  {aWins && <span className="ml-1 text-[10px]" style={{ color: colA }}>✓</span>}
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold" style={{ color: bWins ? colB : "#7a8fa8" }}>{fmt(b)}</span>
                  {bWins && <span className="ml-1 text-[10px]" style={{ color: colB }}>✓</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { Trophy, Star, CheckCircle, TrendingUp, TrendingDown, Activity, Zap, Search, ShieldCheck } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ArcButton } from "@/components/ui/ArcButton"
import { ArcProgress } from "@/components/ui/ArcProgress"
import { StatCard } from "@/components/dashboard/StatCard"
import { LiveTicker } from "@/components/dashboard/LiveTicker"
import { ScoreSparkline } from "@/components/charts/ScoreSparkline"
import { AGENTS, EVENTS, TIER_CONFIG, SCORE_HISTORY, type Agent } from "@/data/mock"
import { scoreColor } from "@/lib/utils"
import { useState } from "react"

const EVENT_ICON: Record<string, { icon: string; color: string }> = {
  payment_completed: { icon: "✓", color: "#34d399" },
  payment_failed:    { icon: "✗", color: "#f87171" },
  payment_denied:    { icon: "⊘", color: "#f87171" },
  dispute_raised:    { icon: "⚠", color: "#f87171" },
  dispute_resolved:  { icon: "◎", color: "#f59e0b" },
  fast_response:     { icon: "⚡", color: "#5FBFFF" },
  large_tx:          { icon: "↑", color: "#a78bfa" },
  new_service:       { icon: "★", color: "#38bdf8" },
}

type FilterTier = "all" | "platinum" | "gold" | "silver" | "new"

type Props = {
  agents: Agent[]
  source: "api" | "mock"
}

function getScoreHistory(agent: Agent) {
  const mockAgent = AGENTS.find(item => item.name === agent.name)
  return SCORE_HISTORY[agent.id] ?? SCORE_HISTORY[mockAgent?.id ?? ""] ?? [{ value: Math.max(0, agent.score - 12) }, { value: agent.score }]
}

export function ReputationLeaderboard({ agents, source }: Props) {
  const [search, setSearch] = useState("")
  const [tierFilter, setTierFilter] = useState<FilterTier>("all")
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  // Sort a copy — never mutate the module-level array
  const sortedAll = [...agents].sort((a, b) => b.score - a.score)

  const filtered = sortedAll
    .filter(a => tierFilter === "all" || a.tier === tierFilter)
    .filter(a => !verifiedOnly || a.verified)
    .filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.address.toLowerCase().includes(search.toLowerCase()))

  const topAgent = sortedAll[0]
  const recentEvents = EVENTS.slice(0, 7)
  const avgScore = agents.length > 0 ? Math.round(agents.reduce((s, a) => s + a.score, 0) / agents.length) : 0
  const sourceLabel = source === "api" ? "Live Arc API" : "Mock fallback"

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Agent Leaderboard"
        subtitle={`${agents.length} agents scored · ${sourceLabel}`}
        icon={Trophy}
        glow
        actions={
          <>
            <LiveTicker />
            <Link href="/compare">
              <ArcButton variant="outline" size="sm">Compare</ArcButton>
            </Link>
            <Link href="/docs">
              <ArcButton variant="primary" size="sm" icon={Zap}>Query API</ArcButton>
            </Link>
          </>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 pt-5">
        <StatCard
          title="Total Agents"
          value={String(agents.length)}
          sub={`${agents.filter(a => a.verified).length} verified`}
          icon={ShieldCheck}
          accent="default"
        />
        <StatCard
          title="Avg Trust Score"
          value={String(avgScore)}
          sub="ecosystem average"
          icon={Trophy}
          accent="default"
          trend={{ value: "across all tiers", up: true }}
        />
        <StatCard
          title="Rising 30d"
          value={String(agents.filter(a => a.scoreChange > 0).length)}
          sub={`${agents.filter(a => a.scoreChange < 0).length} falling`}
          icon={TrendingUp}
          accent="success"
        />
        <StatCard
          title="Platinum Tier"
          value={String(agents.filter(a => a.tier === "platinum").length)}
          sub={`${agents.filter(a => a.tier === "gold").length} gold tier`}
          icon={Trophy}
          accent="default"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">

        {/* Left: table + filter */}
        <div className="lg:col-span-2 flex flex-col gap-3">

          {/* Filter bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5" style={{ color: "#7a8fa8" }} />
              <input
                className="w-full pl-8 pr-3 h-8 text-sm rounded-xl outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#E8E6F0" }}
                placeholder="Search by name or address…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {(["all","platinum","gold","silver","new"] as FilterTier[]).map(t => (
              <button key={t}
                onClick={() => setTierFilter(t)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-semibold capitalize transition-all"
                style={tierFilter === t
                  ? { background: "rgba(167,139,250,0.2)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }
                  : { background: "rgba(255,255,255,0.03)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.07)" }}>
                {t}
              </button>
            ))}
            <button
              onClick={() => setVerifiedOnly(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
              style={verifiedOnly
                ? { background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }
                : { background: "rgba(255,255,255,0.03)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.07)" }}>
              <CheckCircle className="size-3" />
              Verified
            </button>
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(160deg,#263a52 0%,#1e3247 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>

            {/* Header */}
            <div className="grid px-5 py-2.5"
              style={{ gridTemplateColumns: "36px 40px 1fr 100px 80px 120px 80px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
              {["#", "", "Agent", "Tier", "Score", "7d Trend", "30d Δ"].map((h, i) => (
                <span key={h+i} className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "#7a8fa8", textAlign: i >= 4 ? "right" : "left" }}>
                  {h}
                </span>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="size-8 mb-2" style={{ color: "#3d5a74" }} />
                <p className="text-sm font-medium text-white">No agents match your filters</p>
                <p className="text-xs mt-1" style={{ color: "#7a8fa8" }}>Try adjusting your search or tier filter</p>
              </div>
            ) : (
              filtered.map((agent, i) => {
                const tier = TIER_CONFIG[agent.tier]
                const col = scoreColor(agent.score)
                const sparkData = getScoreHistory(agent)
                const rank = sortedAll.indexOf(agent) + 1

                return (
                  <Link key={agent.id} href={`/agents/${agent.id}`}>
                    <div className="grid items-center px-5 py-3 transition-all duration-150 cursor-pointer"
                      style={{ gridTemplateColumns: "36px 40px 1fr 100px 80px 120px 80px", borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(167,139,250,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                      {/* Rank */}
                      <div className="text-sm font-bold">
                        {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : <span style={{ color: "#7a8fa8" }}>{rank}</span>}
                      </div>

                      {/* Avatar */}
                      <div className="size-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: `linear-gradient(135deg,${col}30,${col}18)`, border: `1px solid ${col}40` }}>
                        {agent.name.slice(0, 2).toUpperCase()}
                      </div>

                      {/* Name */}
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white truncate">{agent.name}</span>
                          {agent.verified && <CheckCircle className="size-3 shrink-0" style={{ color: "#34d399" }} />}
                        </div>
                        <span className="text-[10px] font-mono" style={{ color: "#3d5a74" }}>{agent.address}</span>
                      </div>

                      {/* Tier */}
                      <div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}
                          style={{ border: "1px solid currentColor" }}>
                          {tier.label}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: col }}>{agent.score}</p>
                      </div>

                      {/* Sparkline */}
                      <div className="px-1">
                        <ScoreSparkline data={sparkData} color={col} height={32} />
                      </div>

                      {/* 30d delta */}
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {agent.scoreChange >= 0
                            ? <TrendingUp className="size-3" style={{ color: "#34d399" }} />
                            : <TrendingDown className="size-3" style={{ color: "#f87171" }} />}
                          <span className="text-xs font-bold"
                            style={{ color: agent.scoreChange >= 0 ? "#34d399" : "#f87171" }}>
                            {agent.scoreChange >= 0 ? "+" : ""}{agent.scoreChange}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Score breakdown for #1 */}
          <div className="rounded-2xl p-5"
            style={{ background: "linear-gradient(160deg,#263a52 0%,#1e3247 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="size-4" style={{ color: "#a78bfa" }} />
                <p className="text-sm font-semibold text-white">Score Breakdown</p>
              </div>
              <Link href={`/agents/${topAgent.id}`}>
                <span className="text-[11px]" style={{ color: "#5FBFFF" }}>Full detail →</span>
              </Link>
            </div>
            <p className="text-[11px] mb-3 truncate" style={{ color: "#5FBFFF" }}>
              {topAgent.name}
            </p>
            {(Object.entries(topAgent.scoreBreakdown) as [string, number][]).map(([key, val]) => {
              const meta: Record<string, string> = {
                paymentHistory: "Payment History", volumeConsistency: "Volume Consistency",
                responseTime: "Response Time", disputeRecord: "Dispute Record", accountAge: "Account Age",
              }
              const pct = Math.round((val / 250) * 100)
              return (
                <div key={key} className="mb-2.5 last:mb-0">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span style={{ color: "#7a8fa8" }}>{meta[key] ?? key}</span>
                    <span className="font-semibold text-white">{val}<span style={{ color: "#3d5a74" }}>/250</span></span>
                  </div>
                  <ArcProgress value={pct} size="sm" />
                </div>
              )
            })}
          </div>

          {/* Live events feed */}
          <div className="rounded-2xl p-5 flex-1"
            style={{ background: "linear-gradient(160deg,#263a52 0%,#1e3247 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="size-4" style={{ color: "#34d399" }} />
                <p className="text-sm font-semibold text-white">Live Events</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Link href="/events">
                  <span className="text-[11px]" style={{ color: "#5FBFFF" }}>View all →</span>
                </Link>
              </div>
            </div>
            <div className="space-y-2.5">
              {recentEvents.map((ev) => {
                const cfg = EVENT_ICON[ev.type] ?? { icon: "·", color: "#7a8fa8" }
                return (
                  <div key={ev.id} className="flex items-start gap-2.5">
                    <div className="size-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                      style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-semibold text-white">{ev.agentName}</p>
                        <span className="text-[10px] font-bold" style={{ color: ev.scoreDelta >= 0 ? "#34d399" : "#f87171" }}>
                          {ev.scoreDelta >= 0 ? "+" : ""}{ev.scoreDelta}
                        </span>
                      </div>
                      <p className="text-[10px] truncate" style={{ color: "#7a8fa8" }}>{ev.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/compare",  label: "Compare",  icon: "⇄", desc: "Side-by-side",  color: "#a78bfa" },
              { href: "/docs",     label: "API Docs", icon: "{ }", desc: "Integrate",    color: "#5FBFFF" },
              { href: "/tiers",    label: "Tiers",    icon: "◆",  desc: "Requirements",  color: "#facc15" },
              { href: "/reports",  label: "Reports",  icon: "▧",  desc: "Analytics",     color: "#34d399" },
            ].map(({ href, label, icon, desc, color }) => (
              <Link key={href} href={href}>
                <div className="p-3 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5"
                  style={{ background: `${color}0a`, border: `1px solid ${color}22` }}>
                  <p className="text-base mb-1">{icon}</p>
                  <p className="text-xs font-semibold text-white">{label}</p>
                  <p className="text-[10px]" style={{ color: "#7a8fa8" }}>{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

import { Trophy, ShieldCheck, Users, Info } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { AGENTS, TIER_CONFIG } from "@/data/mock"
import { scoreColor } from "@/lib/utils"

const TIER_PERKS: Record<string, string[]> = {
  platinum: ["Priority listing in Marketplace",  "Verified badge",      "Instant settlement", "Dispute fast-track"],
  gold:     ["Featured in search results",        "Verified badge",      "Standard settlement","Dispute support"],
  silver:   ["Standard listing",                  "Manual verification", "Standard settlement","Dispute support"],
  bronze:   ["Basic listing",                     "Unverified",          "Delayed settlement", "Limited support"],
  new:      ["Unlisted",                          "Unverified",          "Escrow hold",        "No support yet"],
}

export default function TiersPage() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Trust Tiers"
        subtitle="How reputation scores map to trust levels and platform privileges"
        icon={Trophy}
        glow
      />

      {/* How scoring works */}
      <div className="mx-6 mt-5 rounded-2xl p-4 flex items-start gap-3"
        style={{ background: "rgba(77,142,233,0.06)", border: "1px solid rgba(77,142,233,0.15)" }}>
        <Info className="size-4 shrink-0 mt-0.5" style={{ color: "#5FBFFF" }} />
        <div>
          <p className="text-sm font-semibold text-white">How the score is calculated</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "#7a8fa8" }}>
            Each agent is scored 0–1000 across 5 dimensions (250 pts each): <strong className="text-white">Payment History</strong>, <strong className="text-white">Volume Consistency</strong>, <strong className="text-white">Response Time</strong>, <strong className="text-white">Dispute Record</strong>, and <strong className="text-white">Account Age</strong>. Scores update after every on-chain transaction.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
        {(["platinum","gold","silver","bronze","new"] as const).map((tier) => {
          const cfg = TIER_CONFIG[tier]
          const agents = AGENTS.filter(a => a.tier === tier)
          const rangeWidth = cfg.max - cfg.min
          const rangePct = Math.round((rangeWidth / 1000) * 100)

          return (
            <div key={tier} className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: "linear-gradient(160deg,#263a52 0%,#1e3247 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>

              {/* Tier header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Trophy className="size-5" style={{ color: "#a78bfa" }} />
                  </div>
                  <div>
                    <p className={`text-base font-bold ${cfg.color}`}>{cfg.label}</p>
                    <p className="text-[11px]" style={{ color: "#7a8fa8" }}>Score {cfg.min}–{cfg.max}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "#7a8fa8" }}>
                  <Users className="size-3.5" />
                  <span>{agents.length}</span>
                </div>
              </div>

              {/* Score range bar */}
              <div>
                <div className="flex justify-between text-[10px] mb-1" style={{ color: "#7a8fa8" }}>
                  <span>{cfg.min}</span><span>{cfg.max}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${rangePct}%`, marginLeft: `${Math.round((cfg.min / 1000) * 100)}%`, background: `linear-gradient(90deg,${scoreColor(cfg.min)},${scoreColor(cfg.max)})` }} />
                </div>
              </div>

              {/* Perks */}
              <div className="space-y-1.5">
                {TIER_PERKS[tier].map((perk) => (
                  <div key={perk} className="flex items-center gap-2">
                    <div className={`size-1.5 rounded-full shrink-0 ${agents.length ? "bg-emerald-400" : "bg-[#3d5a74]"}`} />
                    <span className="text-[11px]" style={{ color: agents.length ? "#C7C5D1" : "#7a8fa8" }}>{perk}</span>
                  </div>
                ))}
              </div>

              {/* Agents in this tier */}
              {agents.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  {agents.map(a => {
                    const col = scoreColor(a.score)
                    return (
                      <div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                        style={{ background: `${col}10`, border: `1px solid ${col}22` }}>
                        {a.verified && <ShieldCheck className="size-3 shrink-0" style={{ color: "#34d399" }} />}
                        <span className="text-[11px] font-medium text-white">{a.name}</span>
                        <span className="text-[10px] font-bold" style={{ color: col }}>{a.score}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs pt-1 border-t" style={{ color: "#3d5a74", borderColor: "rgba(255,255,255,0.06)" }}>
                  No agents at this tier yet.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

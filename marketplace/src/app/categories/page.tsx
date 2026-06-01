import Link from "next/link"
import { Database, Cpu, TrendingUp, Activity, Zap, CheckCircle, ArrowRight } from "lucide-react"
import { ArcButton } from "@/components/ui/ArcButton"
import { CATEGORIES, APIS_ALL, STATS } from "@/data/mock"
import { CAT_COLORS } from "@/lib/utils"

const ICONS: Record<string, React.ElementType> = {
  Database, Cpu, TrendingUp, HardDrive: Activity, Sparkles: Zap, Fingerprint: CheckCircle, Radio: Activity, MessageSquare: Activity,
}



const CAT_DESC: Record<string, string> = {
  data:      "Real-time market data, weather, sensor streams, and web crawling APIs.",
  compute:   "On-demand GPU / CPU burst for AI inference and heavy computation.",
  finance:   "Price oracles, liquidity data, DeFi analytics, and FX rates.",
  storage:   "IPFS pinning, decentralised databases, and encrypted file vaults.",
  ai:        "LLM inference, embeddings, image generation, and speech models.",
  identity:  "ENS resolution, DID verification, and KYC-lite checks.",
  oracle:    "On-chain data bridges, randomness, and cross-chain state reads.",
  messaging: "Push notifications, webhooks, and wallet-to-wallet messaging.",
}

export default function CategoriesPage() {
  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg,#162436 0%,#0f1c2a 100%)" }}>

      {/* Hero */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "linear-gradient(180deg,#1e3247,#162436)" }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-white mb-1">API Categories</h1>
          <p className="text-sm" style={{ color: "#7a8fa8" }}>
            {CATEGORIES.length} categories · {STATS.totalApis} APIs total · all accept USDC via x402
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = ICONS[cat.icon] ?? Zap
            const color = CAT_COLORS[cat.id] ?? "#7a8fa8"
            const catApis = APIS_ALL.filter(a => a.category === cat.id)
            const liveApis = catApis.filter(a => a.status === "live")
            const avgUptime = catApis.length
              ? Math.round(catApis.reduce((s, a) => s + a.uptime, 0) / catApis.length * 10) / 10
              : 0
            const avgRating = catApis.length
              ? Math.round(catApis.reduce((s, a) => s + a.rating, 0) / catApis.length * 10) / 10
              : 0

            return (
              <Link key={cat.id} href={`/?category=${cat.id}`}>
              <div
                className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(160deg,#1e3247,#162436)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}>
                <div className="h-0.5" style={{ background: `linear-gradient(90deg,${color},${color}44)` }} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl flex items-center justify-center"
                        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                        <Icon className="size-5" style={{ color }} />
                      </div>
                      <div>
                        <p className="text-base font-bold text-white">{cat.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#7a8fa8" }}>{CAT_DESC[cat.id]}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-2xl font-bold" style={{ color }}>{cat.count}</p>
                      <p className="text-[10px]" style={{ color: "#7a8fa8" }}>APIs</p>
                    </div>
                  </div>

                  {/* Stats strip */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Live now",    value: String(liveApis.length),     color: "#34d399" },
                      { label: "Avg uptime",  value: catApis.length ? `${avgUptime}%` : "—", color: "#5FBFFF" },
                      { label: "Avg rating",  value: catApis.length ? String(avgRating) : "—", color: "#facc15" },
                    ].map(({ label, value, color: c }) => (
                      <div key={label} className="rounded-xl px-3 py-2 text-center"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-xs font-bold" style={{ color: c }}>{value}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#7a8fa8" }}>{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Provider mini-list */}
                  {catApis.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {catApis.slice(0, 3).map(a => (
                        <span key={a.id} className="text-[10px] px-2 py-0.5 rounded-lg"
                          style={{ background: "rgba(255,255,255,0.04)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {a.name}
                        </span>
                      ))}
                      {catApis.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg" style={{ color: "#7a8fa8" }}>
                          +{catApis.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <ArcButton variant="outline" size="sm" iconRight={ArrowRight} className="w-full justify-center">
                    Browse {cat.label}
                  </ArcButton>
                </div>
              </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

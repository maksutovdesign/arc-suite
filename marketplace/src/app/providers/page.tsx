import Link from "next/link"
import { CheckCircle, ArrowRight } from "lucide-react"
import { ArcProgress } from "@/components/ui/ArcProgress"
import { PROVIDERS, STATS } from "@/data/mock"
import { formatCount } from "@/lib/utils"

export default function ProvidersPage() {
  const sorted = [...PROVIDERS].sort((a, b) => b.totalRequests - a.totalRequests)

  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg,#162436 0%,#0f1c2a 100%)" }}>

      {/* Hero */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "linear-gradient(180deg,#1e3247,#162436)" }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">API Providers</h1>
              <p className="text-sm" style={{ color: "#7a8fa8" }}>
                {STATS.totalProviders} providers · all accept USDC via x402
              </p>
            </div>
            <div className="flex gap-5 shrink-0">
              {[
                { label: "Providers", value: String(STATS.totalProviders), color: "#C7C5D1" },
                { label: "Verified",  value: String(PROVIDERS.filter(p => p.verified).length), color: "#34d399" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-right">
                  <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-[11px]" style={{ color: "#7a8fa8" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((provider) => (
            <Link key={provider.id} href={`/providers/${provider.id}`} className="block group">
              <div
                className="rounded-2xl p-5 flex flex-col gap-4 cursor-pointer transition-all duration-200 group-hover:-translate-y-0.5 h-full"
                style={{
                  background: "linear-gradient(160deg,#1e3247 0%,#162436 100%)",
                  border: provider.verified ? "1px solid rgba(52,211,153,0.15)" : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                }}>

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Provider avatar */}
                    <div className="size-11 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg,rgba(77,142,233,0.25),rgba(95,191,255,0.15))", border: "1px solid rgba(77,142,233,0.3)" }}>
                      {provider.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white group-hover:text-[#5FBFFF] transition-colors">{provider.name}</p>
                        {provider.verified && <CheckCircle className="size-3.5 shrink-0" style={{ color: "#34d399" }} />}
                      </div>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: "#3d5a74" }}>{provider.address}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-white">{provider.totalApis}</p>
                    <p className="text-[10px]" style={{ color: "#7a8fa8" }}>APIs</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#94a3b8" }}>
                  {provider.description}
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Requests", value: formatCount(provider.totalRequests), color: "#5FBFFF" },
                    { label: "Avg Rating", value: String(provider.avgRating), color: "#facc15" },
                    { label: "Uptime", value: `${provider.avgUptime}%`, color: "#34d399" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl px-2.5 py-2 text-center"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs font-bold" style={{ color }}>{value}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "#7a8fa8" }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Uptime bar */}
                <ArcProgress value={provider.avgUptime} size="sm" variant="success" />

                {/* Tags */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5 flex-wrap">
                    {provider.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md"
                        style={{ background: "rgba(255,255,255,0.04)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "#3d5a74" }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

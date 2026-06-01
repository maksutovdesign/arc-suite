"use client"
import { BarChart2, TrendingUp, Zap, Star, Activity } from "lucide-react"
import { ArcBarChart } from "@/components/charts/BarChart"
import { ArcProgress } from "@/components/ui/ArcProgress"
import { APIS_ALL, CATEGORIES, STATS, CATEGORY_BAR_DATA } from "@/data/mock"
import { formatCount, CAT_COLORS} from "@/lib/utils"
import { ARC_CARD } from "@/lib/styles"





export default function AnalyticsPage() {
  const topByRequests  = [...APIS_ALL].sort((a, b) => b.totalRequests - a.totalRequests).slice(0, 5)
  const topByRating    = [...APIS_ALL].sort((a, b) => b.rating - a.rating).slice(0, 5)

  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg,#162436 0%,#0f1c2a 100%)" }}>
      {/* Hero */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "linear-gradient(180deg,#1e3247,#162436)" }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart2 className="size-5" style={{ color: "#5FBFFF" }} />
            <h1 className="text-2xl font-bold text-white">Marketplace Analytics</h1>
          </div>
          <p className="text-sm" style={{ color: "#7a8fa8" }}>Request volumes, uptime and ratings across {STATS.totalApis} APIs</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total APIs",       value: String(STATS.totalApis),         color: "#C7C5D1" },
            { label: "Total Providers",  value: String(STATS.totalProviders),    color: "#a78bfa" },
            { label: "Total Requests",   value: formatCount(STATS.totalRequests),color: "#5FBFFF" },
            { label: "Avg Uptime",       value: `${STATS.avgUptime}%`,           color: "#34d399" },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 rounded-2xl" style={ARC_CARD}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#7a8fa8" }}>{label}</p>
              <p className="text-2xl font-bold" style={{ color, letterSpacing: "-0.03em" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Category bar + distribution */}
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 p-5 rounded-2xl" style={ARC_CARD}>
            <p className="text-sm font-semibold text-white mb-4">Requests by Category (thousands)</p>
            <ArcBarChart data={CATEGORY_BAR_DATA} height={220} formatValue={(v) => `${v}K`} />
          </div>

          <div className="p-5 rounded-2xl" style={ARC_CARD}>
            <p className="text-sm font-semibold text-white mb-4">Category Share</p>
            <div className="space-y-3">
              {CATEGORIES.map((cat) => {
                const color = CAT_COLORS[cat.id] ?? "#7a8fa8"
                const pct = Math.round((cat.count / STATS.totalApis) * 100)
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span style={{ color: "#7a8fa8" }}>{cat.label}</span>
                      <span className="font-semibold" style={{ color }}>{cat.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color}cc,${color})`, boxShadow: `0 0 6px ${color}50` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top APIs tables */}
        <div className="grid grid-cols-2 gap-5">
          {/* Top by requests */}
          <div className="p-5 rounded-2xl" style={ARC_CARD}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="size-4" style={{ color: "#5FBFFF" }} />
              <p className="text-sm font-semibold text-white">Top by Request Volume</p>
            </div>
            <div className="space-y-0">
              {topByRequests.map((api, i) => {
                const color = CAT_COLORS[api.category] ?? "#5FBFFF"
                const maxReqs = topByRequests[0].totalRequests
                const pct = Math.round((api.totalRequests / maxReqs) * 100)
                return (
                  <div key={api.id} className="flex items-center gap-3 py-2.5"
                    style={{ borderBottom: i < topByRequests.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span className="w-5 text-xs font-bold text-center" style={{ color: "#3d5468" }}>{i + 1}</span>
                    <div className="size-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
                      <Zap className="size-3" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{api.name}</p>
                      <div className="mt-1">
                        <ArcProgress value={pct} size="sm" />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white shrink-0">{formatCount(api.totalRequests)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top by rating */}
          <div className="p-5 rounded-2xl" style={ARC_CARD}>
            <div className="flex items-center gap-2 mb-4">
              <Star className="size-4" style={{ color: "#facc15" }} />
              <p className="text-sm font-semibold text-white">Top Rated APIs</p>
            </div>
            <div className="space-y-0">
              {topByRating.map((api, i) => {
                const color = CAT_COLORS[api.category] ?? "#5FBFFF"
                return (
                  <div key={api.id} className="flex items-center gap-3 py-2.5"
                    style={{ borderBottom: i < topByRating.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span className="w-5 text-xs font-bold text-center" style={{ color: "#3d5468" }}>{i + 1}</span>
                    <div className="size-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
                      <Activity className="size-3" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">{api.name}</p>
                      <p className="text-[10px]" style={{ color: "#7a8fa8" }}>{api.provider}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="size-3" style={{ color: "#facc15" }} />
                      <span className="text-sm font-bold text-white">{api.rating}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* All APIs uptime comparison */}
        <div className="p-5 rounded-2xl" style={ARC_CARD}>
          <p className="text-sm font-semibold text-white mb-4">Uptime Comparison — All APIs</p>
          <div className="space-y-3">
            {[...APIS_ALL].sort((a, b) => b.uptime - a.uptime).map((api) => {
              const color = CAT_COLORS[api.category] ?? "#5FBFFF"
              const variant = api.uptime >= 99.9 ? "success" as const : api.uptime >= 99 ? "default" as const : "warning" as const
              return (
                <div key={api.id} className="flex items-center gap-4">
                  <div className="size-1.5 rounded-full shrink-0" style={{ background: color }} />
                  <p className="text-xs w-44 truncate text-white">{api.name}</p>
                  <div className="flex-1">
                    <ArcProgress value={api.uptime} size="sm" variant={variant} />
                  </div>
                  <span className="text-xs font-bold w-14 text-right" style={{ color: "#34d399" }}>{api.uptime}%</span>
                  <span className="text-[10px] w-14 text-right" style={{ color: "#7a8fa8" }}>{api.latencyMs}ms</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

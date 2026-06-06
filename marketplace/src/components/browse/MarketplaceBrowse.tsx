"use client"

import { useState, useMemo } from "react"
import { Award, SlidersHorizontal, Search, X, ChevronDown } from "lucide-react"
import { ApiCard } from "@/components/browse/ApiCard"
import { ArcButton } from "@/components/ui/ArcButton"
import { CATEGORIES, STATS, API_VOLUME, FEATURED_IDS, type ApiListing } from "@/data/mock"
import { formatCount, CAT_COLORS } from "@/lib/utils"

type SortKey = "rating" | "requests" | "price_asc" | "price_desc" | "uptime" | "newest"
type StatusFilter = "all" | "live" | "beta"

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "rating",     label: "Highest rated"   },
  { value: "requests",   label: "Most requests"   },
  { value: "uptime",     label: "Best uptime"     },
  { value: "price_asc",  label: "Lowest price"    },
  { value: "price_desc", label: "Highest price"   },
  { value: "newest",     label: "Newest first"    },
]



type Props = {
  apis: ApiListing[]
  source: "api" | "mock"
}

export function MarketplaceBrowse({ apis, source }: Props) {
  const [query, setQuery]           = useState("")
  const [category, setCategory]     = useState<string>("all")
  const [status, setStatus]         = useState<StatusFilter>("all")
  const [sort, setSort]             = useState<SortKey>("rating")
  const [verifiedOnly, setVerified] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const allApis = apis
  const totalProviders = new Set(apis.map((api) => api.provider)).size
  const totalRequests = apis.reduce((sum, api) => sum + api.totalRequests, 0)
  const avgUptime = apis.length > 0 ? Math.round((apis.reduce((sum, api) => sum + api.uptime, 0) / apis.length) * 100) / 100 : 0
  const sourceLabel = source === "api" ? "Live Arc API" : "Mock fallback"

  const filtered = useMemo(() => {
    let list = [...allApis]
    if (query)        list = list.filter(a => `${a.name} ${a.description} ${a.provider} ${a.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    if (category !== "all") list = list.filter(a => a.category === category)
    if (status !== "all")   list = list.filter(a => a.status === status)
    if (verifiedOnly)       list = list.filter(a => a.verified)
    return list.sort((a, b) => {
      switch (sort) {
        case "rating":     return b.rating - a.rating
        case "requests":   return b.totalRequests - a.totalRequests
        case "uptime":     return b.uptime - a.uptime
        case "price_asc":  return a.price - b.price
        case "price_desc": return b.price - a.price
        case "newest":     return b.createdAt.localeCompare(a.createdAt)
        default:           return 0
      }
    })
  }, [allApis, query, category, status, verifiedOnly, sort])

  const featuredApis = allApis.filter(a => FEATURED_IDS.includes(a.id)).slice(0, 3)
  const hasActiveFilter = query || category !== "all" || status !== "all" || verifiedOnly
  const showFeatured = !hasActiveFilter

  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg,#162436 0%,#0f1c2a 100%)" }}>

      {/* ── Hero ── */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "linear-gradient(180deg,#1e3247,#162436)" }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: "rgba(95,191,255,0.1)", border: "1px solid rgba(95,191,255,0.2)", color: "#5FBFFF" }}>
                  x402 Native
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}>
                  USDC on Arc
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight" style={{ letterSpacing: "-0.03em" }}>
                Discover x402 APIs
              </h1>
              <p className="text-sm" style={{ color: "#7a8fa8" }}>
                {allApis.length} APIs · {Math.max(totalProviders, STATS.totalProviders)} providers · {sourceLabel}
              </p>
            </div>
            <div className="flex gap-6 shrink-0">
              {[
                { label: "APIs Listed",    value: String(allApis.length),           color: "#C7C5D1" },
                { label: "Avg Uptime",    value: `${avgUptime}%`,              color: "#34d399" },
                { label: "Total Requests", value: formatCount(totalRequests), color: "#5FBFFF" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-right">
                  <p className="text-2xl font-bold" style={{ color, letterSpacing: "-0.03em" }}>{value}</p>
                  <p className="text-[11px]" style={{ color: "#7a8fa8" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Search + filter bar ── */}
          <div className="flex items-center gap-3">
            {/* Search input */}
            <div className="flex-1 relative max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5" style={{ color: "#7a8fa8" }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-9 pr-9 h-9 text-sm rounded-xl outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8e6f0" }}
                placeholder="Search APIs, providers, tags…"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-white/10">
                  <X className="size-3.5" style={{ color: "#7a8fa8" }} />
                </button>
              )}
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCategory("all")}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={category === "all"
                  ? { background: "rgba(77,142,233,0.2)", color: "#5FBFFF", border: "1px solid rgba(77,142,233,0.35)" }
                  : { background: "rgba(255,255,255,0.04)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.08)" }}>
                All
              </button>
              {CATEGORIES.slice(0, 5).map(cat => {
                const color = CAT_COLORS[cat.id]
                const active = category === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(active ? "all" : cat.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={active
                      ? { background: `${color}18`, color, border: `1px solid ${color}35` }
                      : { background: "rgba(255,255,255,0.04)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {cat.label}
                  </button>
                )
              })}
            </div>

            {/* Filters toggle */}
            <ArcButton
              variant={showFilters || hasActiveFilter ? "primary" : "outline"}
              size="sm"
              icon={SlidersHorizontal}
              onClick={() => setShowFilters(v => !v)}
            >
              Filters {hasActiveFilter ? "•" : ""}
            </ArcButton>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: "#7a8fa8" }}>Sort:</span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value as SortKey)}
                    className="pl-2.5 pr-7 h-7 text-xs rounded-lg outline-none appearance-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8e6f0" }}>
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value} style={{ background: "#1e3247" }}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 pointer-events-none" style={{ color: "#7a8fa8" }} />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: "#7a8fa8" }}>Status:</span>
                {(["all","live","beta"] as StatusFilter[]).map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all"
                    style={status === s
                      ? { background: "rgba(77,142,233,0.15)", color: "#5FBFFF", border: "1px solid rgba(77,142,233,0.3)" }
                      : { background: "rgba(255,255,255,0.04)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Verified */}
              <button
                onClick={() => setVerified(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                style={verifiedOnly
                  ? { background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.28)" }
                  : { background: "rgba(255,255,255,0.04)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.07)" }}>
                ✓ Verified only
              </button>

              {hasActiveFilter && (
                <button
                  onClick={() => { setQuery(""); setCategory("all"); setStatus("all"); setVerified(false) }}
                  className="text-[11px] transition-colors hover:text-white"
                  style={{ color: "#7a8fa8" }}>
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">

        {/* ── Featured APIs (only when no filter active) ── */}
        {showFeatured && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Award className="size-4" style={{ color: "#facc15" }} />
              <h2 className="text-sm font-bold text-white">Featured</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(250,204,21,0.1)", color: "#facc15", border: "1px solid rgba(250,204,21,0.2)" }}>
                Editor&apos;s pick
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredApis.map(api => (
                <ApiCard key={api.id} api={api} volume={API_VOLUME[api.id]} featured />
              ))}
            </div>
          </section>
        )}

        {/* ── Results ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                {hasActiveFilter ? "Results" : "All APIs"}
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.08)" }}>
                {filtered.length}
              </span>
            </div>
            {!showFilters && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px]" style={{ color: "#7a8fa8" }}>Sort:</span>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortKey)}
                  className="pl-2 pr-6 h-7 text-[11px] rounded-lg outline-none appearance-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8e6f0" }}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: "#1e3247" }}>{o.label}</option>)}
                </select>
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Search className="size-10 mb-3" style={{ color: "#3d5a74" }} />
              <p className="text-base font-semibold text-white mb-1">No APIs found</p>
              <p className="text-sm" style={{ color: "#7a8fa8" }}>Try a different search term or clear your filters</p>
              <button
                onClick={() => { setQuery(""); setCategory("all"); setStatus("all"); setVerified(false) }}
                className="mt-4 text-sm font-medium transition-colors hover:text-white"
                style={{ color: "#5FBFFF" }}>
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(api => (
                <ApiCard key={api.id} api={api} volume={API_VOLUME[api.id] ?? []} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

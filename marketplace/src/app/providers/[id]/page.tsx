import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Globe, TrendingUp, Star, Calendar, Zap } from "lucide-react"
import { ArcButton } from "@/components/ui/ArcButton"
import { ArcProgress } from "@/components/ui/ArcProgress"
import { ApiCard } from "@/components/browse/ApiCard"
import { PROVIDERS, APIS_ALL, API_VOLUME } from "@/data/mock"
import { formatCount } from "@/lib/utils"

export async function generateStaticParams() {
  return PROVIDERS.map(p => ({ id: p.id }))
}

export default async function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const provider = PROVIDERS.find(p => p.id === id)
  if (!provider) notFound()

  const allApis = APIS_ALL
  const providerApis = allApis.filter(a => a.provider === provider.name)

  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg,#162436 0%,#0f1c2a 100%)" }}>

      {/* Hero */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "linear-gradient(180deg,#1e3247,#162436)" }}>
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link href="/providers" className="flex items-center gap-1.5 text-[11px] mb-4 w-fit"
            style={{ color: "#7a8fa8" }}>
            <ArrowLeft className="size-3" /><span>All providers</span>
          </Link>

          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="size-16 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg,rgba(77,142,233,0.3),rgba(95,191,255,0.15))", border: "1px solid rgba(77,142,233,0.35)", boxShadow: "0 0 24px rgba(77,142,233,0.12)" }}>
              {provider.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">{provider.name}</h1>
                {provider.verified && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}>
                    <CheckCircle className="size-3" />Verified provider
                  </div>
                )}
              </div>
              <p className="text-sm mb-2" style={{ color: "#94a3b8" }}>{provider.description}</p>
              <div className="flex items-center gap-3 text-[11px]" style={{ color: "#7a8fa8" }}>
                <div className="flex items-center gap-1">
                  <Globe className="size-3" /><span>{provider.website}</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <Calendar className="size-3" /><span>Joined {provider.joined}</span>
                </div>
                <span>·</span>
                <p className="text-[10px] font-mono">{provider.address}</p>
              </div>
            </div>

            <a href={provider.website} target="_blank" rel="noopener noreferrer"><ArcButton variant="outline" size="sm" icon={Globe}>Visit website</ArcButton></a>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* APIs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">APIs by {provider.name}</h2>
            <span className="text-[11px]" style={{ color: "#7a8fa8" }}>{providerApis.length} published</span>
          </div>

          {providerApis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Zap className="size-8 mb-2" style={{ color: "#3d5a74" }} />
              <p className="text-sm" style={{ color: "#7a8fa8" }}>No APIs published yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providerApis.map(api => (
                <ApiCard key={api.id} api={api} volume={API_VOLUME[api.id] ?? []} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Key metrics */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ background: "linear-gradient(160deg,#1e3247,#162436)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-sm font-semibold text-white">Metrics</p>
            {[
              { label: "Total Requests", value: formatCount(provider.totalRequests), icon: TrendingUp, color: "#5FBFFF" },
              { label: "Published APIs",  value: String(provider.totalApis),         icon: Zap,        color: "#a78bfa" },
              { label: "Avg Rating",      value: String(provider.avgRating),          icon: Star,       color: "#facc15" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="size-3.5" style={{ color }} />
                  <span className="text-[11px]" style={{ color: "#7a8fa8" }}>{label}</span>
                </div>
                <span className="text-xs font-bold text-white">{value}</span>
              </div>
            ))}
          </div>

          {/* Avg uptime */}
          <div className="rounded-2xl p-4"
            style={{ background: "linear-gradient(160deg,#1e3247,#162436)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex justify-between text-[11px] mb-2">
              <span style={{ color: "#7a8fa8" }}>Avg Uptime (30d)</span>
              <span className="font-bold" style={{ color: "#34d399" }}>{provider.avgUptime}%</span>
            </div>
            <ArcProgress value={provider.avgUptime} variant="success" />
          </div>

          {/* Tags */}
          <div className="rounded-2xl p-4"
            style={{ background: "linear-gradient(160deg,#1e3247,#162436)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-semibold text-white mb-3">Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {provider.tags.map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-md"
                  style={{ background: "rgba(77,142,233,0.1)", color: "#5FBFFF", border: "1px solid rgba(77,142,233,0.2)" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

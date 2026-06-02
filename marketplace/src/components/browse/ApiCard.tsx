"use client"

import Link from "next/link"
import { Star, Zap, CheckCircle, TrendingUp, Clock, ArrowRight } from "lucide-react"
import { ArcProgress } from "@/components/ui/ArcProgress"
import { VolumeSparkline } from "@/components/charts/VolumeSparkline"
import { RequestAccessButton } from "@/components/browse/RequestAccessButton"
import { type ApiListing } from "@/data/mock"
import { formatPrice, formatCount, statusColor, CAT_COLORS} from "@/lib/utils"



interface Props {
  api: ApiListing
  volume?: { value: number }[]
  featured?: boolean
}

export function ApiCard({ api, volume = [], featured = false }: Props) {
  const sc = statusColor(api.status)
  const catColor = CAT_COLORS[api.category] ?? "#5FBFFF"

  return (
    <div className="block group">
      <div
        className="rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-200 group-hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(160deg,#1e3247 0%,#162436 100%)",
          border: featured ? `1px solid ${catColor}33` : "1px solid rgba(255,255,255,0.08)",
          boxShadow: featured
            ? `0 4px 28px rgba(0,0,0,0.28), 0 0 0 1px ${catColor}11`
            : "0 4px 20px rgba(0,0,0,0.2)",
        }}
      >
        {/* Accent bar */}
        <div className="h-0.5" style={{ background: `linear-gradient(90deg,${catColor},${catColor}44)` }} />

        <div className="p-5 flex flex-col gap-3 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${catColor}18`, border: `1px solid ${catColor}28` }}>
                <Zap className="size-4" style={{ color: catColor }} />
              </div>
              <div>
                <Link href={`/apis/${api.id}`} className="text-sm font-semibold text-white group-hover:text-[#5FBFFF] transition-colors">{api.name}</Link>
                <p className="text-[11px]" style={{ color: "#7a8fa8" }}>{api.provider}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                ● {api.status}
              </span>
              {api.verified && <CheckCircle className="size-3" style={{ color: "#34d399" }} />}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#94a3b8" }}>
            {api.description}
          </p>

          {/* Volume sparkline */}
          {volume.length > 0 && (
            <div>
              <p className="text-[10px] mb-1" style={{ color: "#7a8fa8" }}>7d volume</p>
              <VolumeSparkline data={volume} color={catColor} height={featured ? 44 : 32} />
            </div>
          )}

          {/* Uptime bar */}
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span style={{ color: "#7a8fa8" }}>Uptime</span>
              <span className="font-semibold" style={{ color: "#34d399" }}>{api.uptime}%</span>
            </div>
            <ArcProgress value={api.uptime} size="sm" variant="success" />
          </div>

          {/* Pricing */}
          <div className="rounded-xl px-3 py-2"
            style={{ background: "rgba(95,191,255,0.06)", border: "1px solid rgba(95,191,255,0.1)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px]" style={{ color: "#7a8fa8" }}>
                <Zap className="size-3" style={{ color: "#5FBFFF" }} />
                <span>x402 · USDC · {api.network}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: "#5FBFFF" }}>
                {formatPrice(api.price, api.unit)}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1" style={{ color: "#7a8fa8" }}>
                <TrendingUp className="size-3" /><span>{formatCount(api.totalRequests)}</span>
              </div>
              <div className="flex items-center gap-1" style={{ color: "#7a8fa8" }}>
                <Clock className="size-3" /><span>{api.latencyMs}ms</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="size-3" style={{ color: "#facc15" }} />
              <span className="font-bold text-white">{api.rating}</span>
              <span style={{ color: "#7a8fa8" }}>({api.ratingCount})</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-1.5 flex-wrap">
            {api.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md"
                style={{ background: "rgba(255,255,255,0.04)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.06)" }}>
                {t}
              </span>
            ))}
            {api.x402 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                style={{ background: "rgba(95,191,255,0.1)", color: "#5FBFFF", border: "1px solid rgba(95,191,255,0.18)" }}>
                x402
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 pb-4 space-y-2">
          <RequestAccessButton apiId={api.id} amountUsdc={api.price} compact />
          <Link
            className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 active:scale-95"
            href={`/apis/${api.id}`}
            style={{
              background: featured ? "linear-gradient(135deg, #4d8ee9 0%, #5FBFFF 100%)" : "rgba(255,255,255,0.04)",
              border: featured ? "none" : "1px solid rgba(255,255,255,0.1)",
              boxShadow: featured ? "0 0 16px rgba(77,142,233,0.35)" : "none",
              color: featured ? "#fff" : "#C7C5D1",
            }}
          >
            View & Integrate
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

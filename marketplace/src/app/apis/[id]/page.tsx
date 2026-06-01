import { notFound } from "next/navigation"
import Link from "next/link"
import { Star, Zap, CheckCircle, TrendingUp, Clock, ArrowLeft, Code, Copy, Globe, Activity, Shield } from "lucide-react"
import { ArcProgress } from "@/components/ui/ArcProgress"
import { ArcButton } from "@/components/ui/ArcButton"
import { APIS_ALL, REVIEWS } from "@/data/mock"
import { formatPrice, formatCount, statusColor } from "@/lib/utils"

export async function generateStaticParams() {
  return APIS_ALL.map(a => ({ id: a.id }))
}

const CAT_COLORS: Record<string, string> = {
  data: "#38bdf8", compute: "#a78bfa", finance: "#34d399",
  storage: "#f59e0b", ai: "#f87171", identity: "#5FBFFF",
  oracle: "#facc15", messaging: "#c084fc",
}

const PRICING_LABEL: Record<string, string> = {
  per_request: "per request",
  per_token:   "per token",
  per_byte:    "per MB",
  per_second:  "per second",
  flat:        "flat rate",
}

export default async function ApiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const api = APIS_ALL.find(a => a.id === id)
  if (!api) notFound()

  const reviews = REVIEWS.filter(r => r.apiId === api.id)
  const sc = statusColor(api.status)
  const catColor = CAT_COLORS[api.category] ?? "#5FBFFF"

  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg,#162436 0%,#0f1c2a 100%)" }}>

      {/* Hero */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "linear-gradient(180deg,#1e3247,#162436)" }}>
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link href="/" className="flex items-center gap-1.5 text-[11px] mb-4 w-fit"
            style={{ color: "#7a8fa8" }}>
            <ArrowLeft className="size-3" />
            <span>Back to marketplace</span>
          </Link>

          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="size-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: `${catColor}18`, border: `1px solid ${catColor}30`, boxShadow: `0 0 20px ${catColor}12` }}>
                <Zap className="size-6" style={{ color: catColor }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-white">{api.name}</h1>
                  {api.verified && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}>
                      <CheckCircle className="size-3" />Verified
                    </div>
                  )}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                    ● {api.status}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "#7a8fa8" }}>{api.provider}</p>
                <p className="text-xs font-mono mt-0.5" style={{ color: "#3d5a74" }}>{api.providerAddress}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ArcButton variant="outline" size="sm" icon={Copy}>Copy endpoint</ArcButton>
              <ArcButton variant="primary" size="sm" icon={Zap}>Integrate now</ArcButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Description */}
          <div className="rounded-2xl p-5"
            style={{ background: "linear-gradient(160deg,#1e3247,#162436)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-sm font-semibold text-white mb-2">About this API</p>
            <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{api.longDescription}</p>
            <div className="flex gap-1.5 mt-4 flex-wrap">
              {api.tags.map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-md"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {t}
                </span>
              ))}
              <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                style={{ background: `${catColor}12`, color: catColor, border: `1px solid ${catColor}25` }}>
                {api.category}
              </span>
            </div>
          </div>

          {/* Code example */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "#0d1b2a", border: "1px solid rgba(95,191,255,0.15)" }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(95,191,255,0.04)" }}>
              <div className="flex items-center gap-2">
                <Code className="size-3.5" style={{ color: "#5FBFFF" }} />
                <span className="text-[11px] font-mono font-medium" style={{ color: "#5FBFFF" }}>
                  Agent integration · TypeScript
                </span>
              </div>
              <ArcButton variant="ghost" size="icon"><Copy className="size-3.5" /></ArcButton>
            </div>
            <pre className="px-5 py-4 text-xs leading-relaxed overflow-x-auto"
              style={{ color: "#94a3b8", fontFamily: "'Space Mono', monospace" }}>
{`import { createWalletClient } from "@circle-fin/arc-sdk"

const wallet = await createWalletClient({ network: "arc" })

// x402 handles payment automatically
const res = await fetch("${api.endpoint}", {
  headers: {
    "x-payment-token": await wallet.signPayment({
      amount: "${api.price}",
      recipient: "${api.providerAddress}"
    })
  }
})

const data = await res.json()
// Agent now has the data — ${formatPrice(api.price, api.unit)} deducted`}
            </pre>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(160deg,#1e3247,#162436)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <Star className="size-4" style={{ color: "#facc15" }} />
                <p className="text-sm font-semibold text-white">Reviews</p>
                <span className="ml-auto text-xs font-bold text-white">{api.rating}</span>
                <span className="text-[11px]" style={{ color: "#7a8fa8" }}>({api.ratingCount} total)</span>
              </div>
              <div>
                {reviews.map((r, i) => (
                  <div key={r.id} className="px-5 py-4"
                    style={{ borderBottom: i < reviews.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-white">{r.author}</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} className="size-3" style={{ color: n <= r.rating ? "#facc15" : "#3d5a74", fill: n <= r.rating ? "#facc15" : "none" }} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Pricing */}
          <div className="rounded-2xl p-4"
            style={{ background: "linear-gradient(160deg,#1e3247,#162436)", border: `1px solid ${catColor}22`, boxShadow: `0 0 30px ${catColor}08` }}>
            <div className="h-0.5 mb-4 rounded-full" style={{ background: `linear-gradient(90deg,${catColor},${catColor}44)` }} />
            <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: "#7a8fa8" }}>Price</p>
            <p className="text-2xl font-bold mb-0.5" style={{ color: catColor }}>
              ${api.price < 0.001 ? api.price.toFixed(6) : api.price < 0.01 ? api.price.toFixed(4) : api.price.toFixed(3)}
            </p>
            <p className="text-xs mb-3" style={{ color: "#7a8fa8" }}>{PRICING_LABEL[api.pricingModel]} · USDC · x402</p>
            <ArcButton variant="primary" size="md" icon={Zap} className="w-full justify-center">
              Start integrating
            </ArcButton>
          </div>

          {/* SLA stats */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ background: "linear-gradient(160deg,#1e3247,#162436)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-sm font-semibold text-white">SLA & Performance</p>
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span style={{ color: "#7a8fa8" }}>Uptime (30d)</span>
                <span className="font-semibold" style={{ color: "#34d399" }}>{api.uptime}%</span>
              </div>
              <ArcProgress value={api.uptime} variant="success" />
            </div>
            {[
              { label: "Avg latency",      value: `${api.latencyMs}ms`,               icon: Clock },
              { label: "Total requests",   value: formatCount(api.totalRequests),       icon: Activity },
              { label: "Network",          value: api.network,                          icon: Globe },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className="size-3" style={{ color: "#7a8fa8" }} />
                  <span className="text-[11px]" style={{ color: "#7a8fa8" }}>{label}</span>
                </div>
                <span className="text-xs font-semibold text-white">{value}</span>
              </div>
            ))}
          </div>

          {/* Security */}
          <div className="rounded-2xl p-4"
            style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="size-4" style={{ color: "#34d399" }} />
              <p className="text-sm font-semibold text-white">Security</p>
            </div>
            {[
              "x402 payment verification",
              "USDC-only settlement",
              api.verified ? "Provider identity verified" : "Provider unverified",
              "On-chain payment receipts",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 mb-1.5 last:mb-0">
                <CheckCircle className="size-3 shrink-0" style={{ color: "#34d399" }} />
                <span className="text-[11px]" style={{ color: "#94a3b8" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

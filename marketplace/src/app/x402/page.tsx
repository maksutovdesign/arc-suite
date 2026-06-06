import { Zap, ArrowRight, Code, Shield, Globe, CheckCircle, DollarSign, Bot, Server } from "lucide-react"
import { ArcButton } from "@/components/ui/ArcButton"
import Link from "next/link"
import { APIS_ALL } from "@/data/mock"

const FLOW_STEPS = [
  {
    n: "01", icon: Bot, color: "#a78bfa",
    title: "Agent sends request",
    desc: "AI agent calls an x402-enabled API endpoint — same as any HTTP request.",
    code: `GET https://api.weather.io/v1/current?lat=48.8&lng=2.3
// No auth headers needed`,
  },
  {
    n: "02", icon: Server, color: "#f59e0b",
    title: "Server returns 402",
    desc: "The API responds with HTTP 402, specifying the price and payment address.",
    code: `HTTP/1.1 402 Payment Required
X-Payment-Price: 0.001
X-Payment-Network: arc
X-Payment-Address: 0xWeather...`,
  },
  {
    n: "03", icon: DollarSign, color: "#34d399",
    title: "Agent pays with USDC",
    desc: "The agent's wallet signs a USDC micro-payment on Arc — no gas fees.",
    code: `// Agent SDK handles this automatically
const token = await wallet.signPayment({
  amount: "0.001",
  recipient: "0xWeather...",
  network: "arc"
})`,
  },
  {
    n: "04", icon: CheckCircle, color: "#5FBFFF",
    title: "Access granted",
    desc: "API verifies the payment token and returns the response. Done.",
    code: `HTTP/1.1 200 OK
{ "temp": 18.4, "condition": "cloudy",
  "humidity": 72 }
// Agent paid $0.001 — total cost`,
  },
]

const BENEFITS = [
  { icon: Zap, color: "#5FBFFF", title: "Zero friction", desc: "No API keys, no accounts, no billing. Agents pay and go." },
  { icon: Shield, color: "#34d399", title: "No protocol fees", desc: "Only the Arc network fee applies — x402 itself is free." },
  { icon: Globe, color: "#a78bfa", title: "Native on Arc", desc: "x402 is gasless on Arc — zero-fee USDC micropayments, built for agentic AI." },
  { icon: DollarSign, color: "#facc15", title: "Instant settlement", desc: "USDC settles directly in the provider's wallet. No intermediary." },
]

const SDKS = [
  { lang: "TypeScript / Node.js", pkg: "x402-next",  color: "#5FBFFF" },
  { lang: "Python",               pkg: "x402-python", color: "#facc15" },
  { lang: "Go",                   pkg: "x402-go",     color: "#38bdf8" },
  { lang: "Rust",                 pkg: "x402-rs",     color: "#f59e0b" },
]

export default function X402Page() {
  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg,#162436 0%,#0f1c2a 100%)" }}>

      {/* Hero */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "linear-gradient(180deg,#1e3247,#0f1c2a)" }}>
        <div className="max-w-4xl mx-auto px-6 py-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold mb-6"
            style={{ background: "rgba(95,191,255,0.1)", border: "1px solid rgba(95,191,255,0.2)", color: "#5FBFFF" }}>
            <Zap className="size-3" />
            HTTP 402 Payment Required
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight" style={{ letterSpacing: "-0.04em" }}>
            The x402 Protocol
          </h1>
          <p className="text-base leading-relaxed max-w-2xl mx-auto mb-8" style={{ color: "#94a3b8" }}>
            x402 turns any HTTP endpoint into a pay-per-use API. AI agents detect a 402 response, pay instantly with USDC, and get access — all in one round trip, no accounts needed.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/">
              <ArcButton variant="primary" size="md" icon={Zap}>Browse x402 APIs</ArcButton>
            </Link>
            <Link href="/submit">
              <ArcButton variant="outline" size="md" iconRight={ArrowRight}>List your API</ArcButton>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">

        {/* Benefits */}
        <section>
          <h2 className="text-lg font-bold text-white text-center mb-6">Why x402?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {BENEFITS.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="rounded-2xl p-4 text-center"
                style={{ background: "linear-gradient(160deg,#1e3247,#162436)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="size-9 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
                  <Icon className="size-4" style={{ color }} />
                </div>
                <p className="text-sm font-semibold text-white mb-1">{title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: "#7a8fa8" }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works — flow */}
        <section>
          <h2 className="text-lg font-bold text-white text-center mb-8">How it works</h2>
          <div className="space-y-4">
            {FLOW_STEPS.map(({ n, icon: Icon, color, title, desc, code }, i) => (
              <div key={n} className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}>

                {/* Left: explanation */}
                <div className="p-5 flex items-start gap-4"
                  style={{ background: "linear-gradient(160deg,#1e3247,#162436)" }}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="size-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
                      <Icon className="size-4" style={{ color }} />
                    </div>
                    {i < FLOW_STEPS.length - 1 && (
                      <div className="w-px flex-1 min-h-6" style={{ background: "rgba(255,255,255,0.08)" }} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold" style={{ color }}>{n}</span>
                      <p className="text-sm font-semibold text-white">{title}</p>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{desc}</p>
                  </div>
                </div>

                {/* Right: code */}
                <div className="p-4 font-mono text-[11px] leading-relaxed"
                  style={{ background: "#0d1b2a", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                  <pre style={{ color: "#94a3b8" }}>{code}</pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SDK support */}
        <section>
          <h2 className="text-lg font-bold text-white text-center mb-6">Supported SDKs</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SDKS.map(({ lang, pkg, color }) => (
              <div key={lang} className="rounded-2xl p-4 text-center"
                style={{ background: "linear-gradient(160deg,#1e3247,#162436)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-sm font-semibold text-white mb-2">{lang}</p>
                <code className="text-[11px] px-2 py-0.5 rounded-md"
                  style={{ background: `${color}12`, color, border: `1px solid ${color}20` }}>
                  {pkg}
                </code>
              </div>
            ))}
          </div>
        </section>

        {/* Integration snippet */}
        <section>
          <h2 className="text-lg font-bold text-white text-center mb-4">Add x402 to your API in 2 lines</h2>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "#0d1b2a", border: "1px solid rgba(95,191,255,0.15)" }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(95,191,255,0.04)" }}>
              <div className="flex items-center gap-2">
                <Code className="size-3.5" style={{ color: "#5FBFFF" }} />
                <span className="text-[11px] font-mono font-medium" style={{ color: "#5FBFFF" }}>
                  server.ts · Next.js App Router
                </span>
              </div>
              <div className="flex gap-1.5">
                {["#f87171","#f59e0b","#34d399"].map(c => (
                  <div key={c} className="size-2.5 rounded-full" style={{ background: c }} />
                ))}
              </div>
            </div>
            <pre className="px-6 py-5 text-sm leading-loose overflow-x-auto" style={{ color: "#94a3b8", fontFamily: "'Space Mono', monospace" }}>
{`import { paymentMiddleware } from "x402-next"

// That's it. Two lines.
export const middleware = paymentMiddleware({
  "/api/weather":   { price: "$0.001", network: "arc" },
  "/api/data/*":    { price: "$0.005", network: "arc" },
  "/api/premium/*": { price: "$0.020", network: "arc" },
})

// Payments land directly in your Arc wallet.
// No accounts. No subscriptions. No billing.`}
            </pre>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-6">
          <h2 className="text-xl font-bold text-white mb-3">Ready to build?</h2>
          <p className="text-sm mb-6" style={{ color: "#7a8fa8" }}>
            Browse {APIS_ALL.length} x402-enabled APIs or list your own in minutes.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/">
              <ArcButton variant="primary" size="md" icon={Zap}>Browse APIs</ArcButton>
            </Link>
            <Link href="/submit">
              <ArcButton variant="outline" size="md">List your API</ArcButton>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

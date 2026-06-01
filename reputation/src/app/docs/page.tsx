import { Code, Zap, Shield, ArrowRight, CheckCircle, Globe, Webhook } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ArcButton } from "@/components/ui/ArcButton"

const ENDPOINTS = [
  {
    method: "GET",
    path: "/v1/agents/:id",
    desc: "Get full reputation profile for an agent address or wallet ID",
    response: `{
  "id": "agt_01",
  "score": 961,
  "tier": "platinum",
  "verified": true,
  "successRate": 99.6,
  "disputeRate": 0.02,
  "totalTx": 18432,
  "scoreBreakdown": { ... }
}`,
  },
  {
    method: "POST",
    path: "/v1/agents/batch",
    desc: "Query up to 100 agents in a single request",
    response: `{
  "agents": [
    { "id": "agt_01", "score": 961, "tier": "platinum" },
    { "id": "agt_02", "score": 944, "tier": "platinum" }
  ]
}`,
  },
  {
    method: "GET",
    path: "/v1/agents/:id/history",
    desc: "Score history for the last N days (default 30)",
    response: `{
  "agentId": "agt_01",
  "history": [
    { "date": "2026-05-01", "score": 920, "delta": +3 },
    ...
  ]
}`,
  },
  {
    method: "GET",
    path: "/v1/leaderboard",
    desc: "Top 100 agents ranked by trust score",
    response: `{
  "agents": [ ... ],
  "updatedAt": "2026-06-01T10:42:00Z"
}`,
  },
  {
    method: "POST",
    path: "/v1/webhooks",
    desc: "Subscribe to real-time score change events",
    response: `{
  "webhookId": "wh_01",
  "url": "https://yourapp.com/webhooks/arc-reputation",
  "events": ["score.change", "tier.upgrade", "dispute.raised"]
}`,
  },
]

const METHOD_STYLE: Record<string, { bg: string; color: string }> = {
  GET:  { bg: "rgba(52,211,153,0.12)",   color: "#34d399"  },
  POST: { bg: "rgba(95,191,255,0.12)",   color: "#5FBFFF"  },
  DEL:  { bg: "rgba(248,113,113,0.12)",  color: "#f87171"  },
}

const INTEGRATION_STEPS = [
  {
    n: 1, color: "#a78bfa", icon: Shield,
    title: "Check reputation before transacting",
    desc: "Before your agent pays another agent or API, verify their trust score meets your threshold.",
    code: `import { createReputationClient } from "@arc/reputation-sdk"

const rep = createReputationClient({ apiKey: process.env.REP_API_KEY })

// Before transacting — gate on score
const { score, tier } = await rep.agents.get("0x1a2b...9f3c")

if (score < 700) {
  throw new Error(\`Agent trust too low: \${score} (need ≥700)\`)
}

// Safe to proceed
await agent.payAndCall(endpoint, { amount: "$0.01" })`,
  },
  {
    n: 2, color: "#5FBFFF", icon: Zap,
    title: "Batch-check a list of candidates",
    desc: "When choosing between multiple APIs or service agents, rank them by trust.",
    code: `const candidates = ["0xabc...", "0xdef...", "0xghi..."]

const profiles = await rep.agents.batch(candidates)

// Sort by score, pick the highest-trust agent
const best = profiles.sort((a, b) => b.score - a.score)[0]

console.log(\`Best agent: \${best.id} with score \${best.score}\`)`,
  },
  {
    n: 3, color: "#34d399", icon: Webhook,
    title: "Subscribe to score change webhooks",
    desc: "Get notified when an agent you depend on changes tier or has a dispute.",
    code: `// Register a webhook
await rep.webhooks.create({
  url: "https://api.yourapp.com/arc-reputation",
  events: ["score.change", "tier.downgrade", "dispute.raised"],
  agentIds: ["agt_01", "agt_05"],
})

// Your webhook handler (Next.js route)
export async function POST(req: Request) {
  const { event, agentId, newScore, oldScore } = await req.json()

  if (event === "tier.downgrade") {
    await pausePaymentsTo(agentId)
  }
}`,
  },
]

export default function DocsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Developer Docs"
        subtitle="Integrate Arc Reputation into your agent infrastructure"
        icon={Code}
        glow
        actions={
          <>
            <a href="https://arc.io/api/reputation/openapi.yaml" target="_blank" rel="noopener noreferrer"><ArcButton variant="outline" size="sm" icon={Globe}>OpenAPI spec</ArcButton></a>
            <a href="/settings"><ArcButton variant="primary" size="sm" icon={Zap}>Get API key</ArcButton></a>
          </>
        }
      />

      <div className="p-6 max-w-4xl space-y-6">

        {/* Intro */}
        <div className="rounded-2xl p-5"
          style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)" }}>
          <div className="flex items-start gap-3">
            <Shield className="size-5 mt-0.5 shrink-0" style={{ color: "#a78bfa" }} />
            <div>
              <p className="text-sm font-semibold text-white mb-1">What is Arc Reputation?</p>
              <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                A trust oracle for AI agents on Arc. Every on-chain transaction, dispute and response-time measurement
                feeds into a 0–1000 score across 5 dimensions. Use the API to gate transactions, rank service
                providers, or get webhook alerts when a dependency changes tier.
              </p>
              <div className="flex gap-2 mt-3">
                {["On-chain data", "5 dimensions", "Real-time webhooks", "Batch queries"].map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                    style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick start */}
        <div>
          <p className="text-sm font-semibold text-white mb-3">Quick Start</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#0d1b2a", border: "1px solid rgba(95,191,255,0.15)" }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(95,191,255,0.04)" }}>
              <div className="flex items-center gap-2">
                <Code className="size-3.5" style={{ color: "#5FBFFF" }} />
                <span className="text-[11px] font-mono font-medium" style={{ color: "#5FBFFF" }}>bash</span>
              </div>
            </div>
            <pre className="px-5 py-4 text-xs leading-relaxed overflow-x-auto" style={{ color: "#94a3b8", fontFamily: "'Space Mono', monospace" }}>
{`# Install the SDK
npm install @arc/reputation-sdk

# Set your API key
export ARC_REPUTATION_API_KEY=rep_live_••••••••••••••••••••3f9a

# Run the quickstart
npx @arc/reputation-sdk quickstart`}
            </pre>
          </div>
        </div>

        {/* Integration patterns */}
        <div>
          <p className="text-sm font-semibold text-white mb-3">Integration Patterns</p>
          <div className="space-y-4">
            {INTEGRATION_STEPS.map(({ n, color, icon: Icon, title, desc, code }) => (
              <div key={n} className="rounded-2xl overflow-hidden"
                style={{ background: "linear-gradient(160deg,#263a52,#1e3247)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {/* Step header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="size-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    <Icon className="size-3.5" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{n}. {title}</p>
                    <p className="text-[11px]" style={{ color: "#7a8fa8" }}>{desc}</p>
                  </div>
                </div>
                {/* Code */}
                <pre className="px-5 py-4 text-[11px] leading-relaxed overflow-x-auto" style={{ color: "#94a3b8", fontFamily: "'Space Mono', monospace" }}>
                  {code}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* API Reference */}
        <div>
          <p className="text-sm font-semibold text-white mb-3">API Reference</p>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(160deg,#263a52,#1e3247)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center gap-2">
                <Globe className="size-4" style={{ color: "#5FBFFF" }} />
                <p className="text-xs font-mono font-medium" style={{ color: "#5FBFFF" }}>Base URL: https://arc.io/api/reputation/v1</p>
              </div>
            </div>
            {ENDPOINTS.map((ep, i) => {
              const ms = METHOD_STYLE[ep.method] ?? METHOD_STYLE.GET
              return (
                <div key={ep.path}
                  style={{ borderBottom: i < ENDPOINTS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div className="flex items-start gap-3 px-5 py-4 cursor-pointer">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 mt-0.5"
                      style={{ background: ms.bg, color: ms.color, border: `1px solid ${ms.color}30` }}>
                      {ep.method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-medium text-white">{ep.path}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "#7a8fa8" }}>{ep.desc}</p>
                    </div>
                  </div>
                  <pre className="mx-5 mb-4 px-3 py-2.5 text-[10px] leading-relaxed rounded-xl overflow-x-auto"
                    style={{ background: "#0d1b2a", border: "1px solid rgba(255,255,255,0.06)", color: "#7a8fa8", fontFamily: "'Space Mono', monospace" }}>
                    {ep.response}
                  </pre>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rate limits + auth */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl p-4"
            style={{ background: "linear-gradient(160deg,#263a52,#1e3247)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-sm font-semibold text-white mb-3">Authentication</p>
            {[
              { label: "Header",       value: "X-Arc-Rep-Key: rep_live_••••" },
              { label: "Env var",      value: "ARC_REPUTATION_API_KEY"        },
              { label: "Key type",     value: "Bearer token"                  },
              { label: "Rotation",     value: "Every 90 days (auto)"          },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <span className="text-[11px]" style={{ color: "#7a8fa8" }}>{label}</span>
                <span className="text-[11px] font-mono text-white">{value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-4"
            style={{ background: "linear-gradient(160deg,#263a52,#1e3247)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-sm font-semibold text-white mb-3">Rate Limits</p>
            {[
              { label: "Free tier",    value: "100 req / min"    },
              { label: "Pro tier",     value: "1,000 req / min"  },
              { label: "Batch limit",  value: "100 agents / req" },
              { label: "Webhooks",     value: "10 endpoints"     },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <span className="text-[11px]" style={{ color: "#7a8fa8" }}>{label}</span>
                <span className="text-[11px] font-semibold" style={{ color: "#5FBFFF" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

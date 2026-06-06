"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Bot, Zap, CheckCircle2 } from "lucide-react"
import { ArcButton } from "@/components/ui/ArcButton"

interface Props {
  onClose: () => void
}

const NETWORKS = ["Arc Testnet", "Ethereum Sepolia"] as const
const TEMPLATES = [
  { id: "data",    label: "Data Harvester",  desc: "API calls & data feeds",  icon: "📡", budget: 500 },
  { id: "trade",   label: "Trading Bot",     desc: "Swaps & market data",     icon: "📈", budget: 1000 },
  { id: "content", label: "Content Agent",   desc: "LLM inference & compute", icon: "✍️", budget: 300 },
  { id: "custom",  label: "Custom",          desc: "Configure manually",      icon: "⚙️", budget: 200 },
]

export function NewAgentModal({ onClose }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<"template" | "config" | "success">("template")
  const [selected, setSelected] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [budget, setBudget] = useState("500")
  const [network, setNetwork] = useState<string>(NETWORKS[0])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdAgentAddress, setCreatedAgentAddress] = useState("0xpilot...agent")

  const template = TEMPLATES.find(t => t.id === selected)

  function handleSelectTemplate(id: string) {
    const t = TEMPLATES.find(t => t.id === id)!
    setSelected(id)
    setName(`${t.label}-Pilot`)
    setBudget(String(t.budget))
    setStep("config")
  }

  async function handleCreate() {
    setIsCreating(true)
    setError(null)
    try {
      const response = await fetch("/api/arc/agents", {
        body: JSON.stringify({
          dailyLimitUsdc: Math.max(10, Number(budget) / 20),
          monthlyBudgetUsdc: Number(budget),
          name,
          network: network === "Arc Testnet" ? "Arc" : "Ethereum",
          tags: selected ? [selected, "pilot"] : ["pilot"],
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      if (!response.ok) throw new Error("Create failed")
      const payload = (await response.json()) as { agent?: { address?: string } }
      setCreatedAgentAddress(payload.agent?.address ?? "0xpilot...agent")
      setStep("success")
      router.refresh()
    } catch {
      setError("Could not create agent")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(10,18,28,0.8)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #1e3247 0%, #162436 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 40px rgba(77,142,233,0.12)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="size-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(77,142,233,0.15)", border: "1px solid rgba(77,142,233,0.25)" }}
            >
              <Bot className="size-3.5" style={{ color: "#5FBFFF" }} />
            </div>
            <span className="text-sm font-semibold text-white">
              {step === "success" ? "Agent Created" : "New Agent"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
            style={{ color: "#7a8fa8" }}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Step: Template */}
        {step === "template" && (
          <div className="p-5 space-y-3">
            <p className="text-xs mb-4" style={{ color: "#7a8fa8" }}>
              Choose a template to pre-configure your agent&apos;s spending categories and budget.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t.id)}
                  className="p-3 rounded-xl text-left transition-all hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(77,142,233,0.4)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                >
                  <div className="text-xl mb-2">{t.icon}</div>
                  <p className="text-sm font-semibold text-white">{t.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#7a8fa8" }}>{t.desc}</p>
                  <p className="text-[11px] mt-1.5 font-medium" style={{ color: "#4d8ee9" }}>
                    ${t.budget}/mo budget
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Config */}
        {step === "config" && template && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{template.icon}</span>
              <span className="text-sm font-medium" style={{ color: "#7a8fa8" }}>
                {template.label} template
              </span>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "#7a8fa8" }}>Agent name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm text-white bg-transparent outline-none"
                style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
              />
            </div>

            {/* Network */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "#7a8fa8" }}>Network</label>
              <div className="flex gap-2">
                {NETWORKS.map(n => (
                  <button
                    key={n}
                    onClick={() => setNetwork(n)}
                    className="flex-1 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={
                      network === n
                        ? { background: "rgba(77,142,233,0.2)", color: "#5FBFFF", border: "1px solid rgba(77,142,233,0.35)" }
                        : { background: "rgba(255,255,255,0.03)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.08)" }
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "#7a8fa8" }}>Monthly budget (USDC)</label>
              <div
                className="flex items-center px-3 rounded-xl"
                style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
              >
                <span className="text-sm font-bold" style={{ color: "#5FBFFF" }}>$</span>
                <input
                  type="number"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  className="flex-1 px-2 py-2 text-sm text-white bg-transparent outline-none"
                />
                <span className="text-xs" style={{ color: "#7a8fa8" }}>USDC</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep("template")}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                style={{ color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Back
              </button>
              <ArcButton variant="primary" size="md" icon={Zap} className="flex-1 justify-center" onClick={handleCreate}>
                {isCreating ? "Creating..." : `Create Agent on ${network}`}
              </ArcButton>
            </div>
            {error && <p className="text-[11px]" style={{ color: "#f87171" }}>{error}</p>}
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div
              className="size-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", boxShadow: "0 0 24px rgba(52,211,153,0.15)" }}
            >
              <CheckCircle2 className="size-7" style={{ color: "#34d399" }} />
            </div>
            <div>
              <p className="text-base font-bold text-white">{name}</p>
              <p className="text-sm mt-1" style={{ color: "#7a8fa8" }}>
                Agent wallet created on {network}
              </p>
              <p className="text-xs mt-1" style={{ color: "#34d399" }}>
                Monthly budget: ${budget} USDC · Testnet funded
              </p>
            </div>
            <div
              className="w-full px-3 py-2 rounded-xl text-[11px] font-mono text-left"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#7a8fa8" }}
            >
              {createdAgentAddress} · Arc Testnet
            </div>
            <ArcButton variant="primary" size="md" className="w-full justify-center" onClick={onClose}>
              Done
            </ArcButton>
          </div>
        )}
      </div>
    </div>
  )
}

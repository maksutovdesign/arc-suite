"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { CheckCircle2, Play, XCircle } from "lucide-react"
import { ArcButton } from "@/components/ui/ArcButton"
import type { Agent } from "@/data/mock"
import type { AccessDecision, ApiListing } from "@/lib/arc-api"
import { trackTreasuryEvent } from "@/lib/analytics"
import { formatUSDC } from "@/lib/utils"

type Props = {
  agent: Agent
  apiListings: ApiListing[]
}

export function AccessCheckSimulator({ agent, apiListings }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [apiId, setApiId] = useState(apiListings[0]?.id ?? "")
  const activeApi = useMemo(() => apiListings.find((api) => api.id === apiId) ?? apiListings[0], [apiId, apiListings])
  const [amount, setAmount] = useState(activeApi ? String(activeApi.priceUsdc) : "0.003")
  const [decision, setDecision] = useState<AccessDecision | null>(null)
  const [error, setError] = useState<string | null>(null)

  function selectApi(nextApiId: string) {
    const nextApi = apiListings.find((api) => api.id === nextApiId)
    setApiId(nextApiId)
    if (nextApi) setAmount(String(nextApi.priceUsdc))
  }

  function runCheck() {
    setError(null)
    setDecision(null)
    trackTreasuryEvent({
      eventName: "access_check_run",
      placement: "agent_detail",
      surface: "access_check_simulator",
      properties: {
        agentId: agent.id,
        apiId,
        amountUsdc: Number(amount),
      },
    })
    startTransition(async () => {
      try {
        const response = await fetch("/api/arc/access/check", {
          body: JSON.stringify({
            agentId: agent.id,
            apiId,
            amountUsdc: Number(amount),
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        })
        if (!response.ok) throw new Error("Check failed")
        const payload = (await response.json()) as { decision: AccessDecision }
        setDecision(payload.decision)
        trackTreasuryEvent({
          eventName: "access_check_result",
          placement: "agent_detail",
          surface: "access_check_simulator",
          properties: {
            agentId: agent.id,
            allowed: payload.decision.allowed,
            apiId,
            requiredScore: payload.decision.requiredScore,
            score: payload.decision.score,
          },
        })
        router.refresh()
      } catch {
        trackTreasuryEvent({
          eventName: "access_check_result",
          placement: "agent_detail",
          surface: "access_check_simulator",
          properties: {
            agentId: agent.id,
            allowed: false,
            apiId,
            error: true,
          },
        })
        setError("Access check failed")
      }
    })
  }

  if (apiListings.length === 0) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-sm font-semibold text-white">Access Check Simulator</p>
        <p className="mt-2 text-xs" style={{ color: "#7a8fa8" }}>API catalog is unavailable.</p>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-2xl space-y-3" style={cardStyle}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Access Check Simulator</p>
          <p className="mt-1 text-[11px]" style={{ color: "#7a8fa8" }}>
            Run a live policy check against reputation and budget state.
          </p>
        </div>
        {decision && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: decision.allowed ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
              border: `1px solid ${decision.allowed ? "rgba(52,211,153,0.28)" : "rgba(248,113,113,0.28)"}`,
              color: decision.allowed ? "#34d399" : "#f87171",
            }}
          >
            {decision.allowed ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
            {decision.allowed ? "Allowed" : "Denied"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_120px]">
        <label className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#7a8fa8" }}>API</span>
          <select
            className="h-9 w-full rounded-lg px-2 text-xs text-white outline-none"
            onChange={(event) => selectApi(event.target.value)}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            value={apiId}
          >
            {apiListings.map((api) => (
              <option key={api.id} value={api.id}>
                {api.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#7a8fa8" }}>Amount</span>
          <input
            className="h-9 w-full rounded-lg px-2 text-xs text-white outline-none"
            min="0"
            onChange={(event) => setAmount(event.target.value)}
            step="0.001"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            type="number"
            value={amount}
          />
        </label>
      </div>

      {activeApi && (
        <div className="grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-3">
          <Metric label="Provider" value={activeApi.providerName} />
          <Metric label="Price" value={`${formatUSDC(activeApi.priceUsdc)} / ${activeApi.pricingUnit}`} />
          <Metric label="Min score" value={String(activeApi.minReputationScore)} />
        </div>
      )}

      <ArcButton className="w-full justify-center" disabled={isPending} icon={Play} onClick={runCheck} size="sm" variant="primary">
        {isPending ? "Running check..." : "Run Access Check"}
      </ArcButton>

      {decision && (
        <div className="rounded-xl p-3 text-[11px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-semibold text-white">{decision.reason}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Score" value={String(decision.score)} />
            <Metric label="Required" value={String(decision.requiredScore)} />
            <Metric label="Monthly" value={`${decision.monthlyBudgetUsedPct}%`} />
            <Metric label="Daily" value={`${decision.dailyBudgetUsedPct}%`} />
          </div>
        </div>
      )}

      {error && <p className="text-[11px]" style={{ color: "#f87171" }}>{error}</p>}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <p className="truncate text-[9px] uppercase tracking-widest" style={{ color: "#7a8fa8" }}>{label}</p>
      <p className="truncate font-semibold text-white">{value}</p>
    </div>
  )
}

const cardStyle = {
  background: "linear-gradient(160deg, #263a52 0%, #1e3247 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
}

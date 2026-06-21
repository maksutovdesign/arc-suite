"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Database, ExternalLink, Send, Sparkles, XCircle, type LucideIcon } from "lucide-react"
import { ArcButton } from "@/components/ui/ArcButton"
import type { Agent } from "@/data/mock"
import type { ApiListing, ArcSettlementConfiguration, ArcSettlementOutcome } from "@/lib/arc-api"
import { formatUSDC } from "@/lib/utils"

type Props = {
  agent: Agent
  apiListings: ApiListing[]
  isDemo?: boolean
}

export function ArcSettlementPanel({ agent, apiListings, isDemo = false }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [config, setConfig] = useState<ArcSettlementConfiguration | null>(null)
  const [apiId, setApiId] = useState(apiListings[0]?.id ?? "")
  const activeApi = useMemo(() => apiListings.find((api) => api.id === apiId) ?? apiListings[0], [apiId, apiListings])
  const [amount, setAmount] = useState(activeApi ? String(activeApi.priceUsdc) : "0.003")
  const [recipient, setRecipient] = useState("")
  const [outcome, setOutcome] = useState<ArcSettlementOutcome | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/arc/settlements", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Settlement configuration is unavailable")
        return response.json() as Promise<ArcSettlementConfiguration>
      })
      .then((payload) => {
        if (!active) return
        setConfig(payload)
        setRecipient(payload.defaultRecipient ?? payload.allowedRecipients[0] ?? "")
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Settlement configuration is unavailable")
      })
    return () => {
      active = false
    }
  }, [])

  function selectApi(nextApiId: string) {
    const nextApi = apiListings.find((api) => api.id === nextApiId)
    setApiId(nextApiId)
    if (nextApi) setAmount(String(nextApi.priceUsdc))
  }

  function executeSettlement() {
    setError(null)
    setOutcome(null)
    startTransition(async () => {
      try {
        const response = await fetch("/api/arc/settlements", {
          body: JSON.stringify({
            agentId: agent.id,
            apiId,
            amountUsdc: Number(amount),
            recipientAddress: recipient,
            idempotencyKey: `treasury:${agent.id}:${crypto.randomUUID()}`,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        })
        const payload = await response.json() as ArcSettlementOutcome & { message?: string }
        if (!response.ok && response.status !== 403) throw new Error(payload.message ?? "Arc settlement failed")
        setOutcome(payload)
        router.refresh()
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Arc settlement failed")
      }
    })
  }

  const disabled = isDemo || isPending || !config?.configured || !apiId || !recipient || Number(amount) <= 0
  const result = outcome?.result

  return (
    <div className="space-y-4 rounded-2xl p-4" style={cardStyle}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Send className="size-4" style={{ color: "#5FBFFF" }} />
            <p className="text-sm font-semibold text-white">Arc Testnet Settlement</p>
          </div>
          <p className="mt-1 text-[11px]" style={{ color: "#7a8fa8" }}>
            Policy check, real USDC transfer, Supabase record, and reputation update.
          </p>
        </div>
        <span
          className="rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-widest"
          style={{
            background: config?.configured ? "rgba(52,211,153,0.1)" : "rgba(245,158,11,0.1)",
            border: `1px solid ${config?.configured ? "rgba(52,211,153,0.25)" : "rgba(245,158,11,0.25)"}`,
            color: config?.configured ? "#34d399" : "#f59e0b",
          }}
        >
          {config?.configured ? "Ready" : "Setup required"}
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
        <label className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#7a8fa8" }}>API policy</span>
          <select className="h-9 w-full rounded-lg px-2 text-xs text-white outline-none" onChange={(event) => selectApi(event.target.value)} style={fieldStyle} value={apiId}>
            {apiListings.map((api) => <option key={api.id} value={api.id}>{api.name}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#7a8fa8" }}>USDC</span>
          <input
            className="h-9 w-full rounded-lg px-2 text-xs text-white outline-none"
            max={config?.maxAmountUsdc}
            min="0.000001"
            onChange={(event) => setAmount(event.target.value)}
            step="0.001"
            style={fieldStyle}
            type="number"
            value={amount}
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#7a8fa8" }}>Allowlisted recipient</span>
        <select className="h-9 w-full rounded-lg px-2 font-mono text-[10px] text-white outline-none" onChange={(event) => setRecipient(event.target.value)} style={fieldStyle} value={recipient}>
          {config?.allowedRecipients.map((address) => <option key={address} value={address}>{address}</option>)}
        </select>
      </label>

      <div className="grid grid-cols-3 gap-2">
        <Metric label="Chain" value={`Arc ${config?.chainId ?? 5042002}`} />
        <Metric label="Min score" value={String(activeApi?.minReputationScore ?? "—")} />
        <Metric label="Maximum" value={config ? formatUSDC(config.maxAmountUsdc) : "—"} />
      </div>

      <ArcButton className="w-full justify-center" disabled={disabled} icon={Send} onClick={executeSettlement} size="sm" variant="primary">
        {isPending ? "Settling on Arc..." : "Run Policy + Send USDC"}
      </ArcButton>

      {isDemo && <p className="text-[11px]" style={{ color: "#7a8fa8" }}>Real transfers require an admin session. Demo remains read-only.</p>}
      {!config?.configured && config && <p className="text-[11px]" style={{ color: "#f59e0b" }}>Missing server configuration: {config.missing.join(", ")}</p>}
      {error && <p className="text-[11px]" style={{ color: "#f87171" }}>{error}</p>}

      {outcome && (
        <div className="space-y-2 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Step icon={outcome.decision.allowed ? CheckCircle2 : XCircle} ok={outcome.decision.allowed} label={`Policy ${outcome.decision.allowed ? "approved" : "denied"}`} />
          <Step icon={Send} ok={Boolean(result)} label={result ? `${formatUSDC(result.transaction.amountUsdc)} settled on Arc` : "Transfer not executed"} />
          <Step icon={Database} ok={Boolean(result)} label={result ? "Transaction recorded in Supabase" : "No transaction record created"} />
          <Step icon={Sparkles} ok={Boolean(result)} label={result ? `Reputation +${result.scoreDelta}` : "Reputation unchanged"} />
          {result?.settlement.explorerUrl && result.settlement.txHash && (
            <a
              className="mt-2 flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-[11px] font-semibold"
              href={result.settlement.explorerUrl}
              rel="noreferrer"
              style={{ background: "rgba(95,191,255,0.08)", border: "1px solid rgba(95,191,255,0.18)", color: "#5FBFFF" }}
              target="_blank"
            >
              <span className="min-w-0 truncate font-mono">{result.settlement.txHash}</span>
              <ExternalLink className="size-3.5 shrink-0" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function Step({ icon: Icon, label, ok }: { icon: LucideIcon; label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[11px]" style={{ color: ok ? "#C7C5D1" : "#7a8fa8" }}>
      <Icon className="size-3.5 shrink-0" style={{ color: ok ? "#34d399" : "#7a8fa8" }} />
      <span>{label}</span>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <p className="truncate text-[9px] uppercase tracking-widest" style={{ color: "#7a8fa8" }}>{label}</p>
      <p className="truncate text-[11px] font-semibold text-white">{value}</p>
    </div>
  )
}

const cardStyle = {
  background: "linear-gradient(160deg, #263a52 0%, #1e3247 100%)",
  border: "1px solid rgba(95,191,255,0.16)",
}

const fieldStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
}

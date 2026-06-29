"use client"

import { useState, useTransition } from "react"
import type { MouseEvent } from "react"
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react"
import { ArcButton } from "@/components/ui/ArcButton"
import { RunPaidWorkflowButton } from "@/components/browse/RunPaidWorkflowButton"
import type { AccessDecision } from "@/lib/arc-api"

type Props = {
  apiId: string
  amountUsdc: number
  compact?: boolean
}

const DEMO_AGENT_ID = "agt_02"

export function RequestAccessButton({ apiId, amountUsdc, compact = false }: Props) {
  const [isPending, startTransition] = useTransition()
  const [decision, setDecision] = useState<AccessDecision | null>(null)
  const [error, setError] = useState<string | null>(null)

  function requestAccess(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    setError(null)
    setDecision(null)

    startTransition(async () => {
      try {
        const response = await fetch("/api/arc/access/check", {
          body: JSON.stringify({
            agentId: DEMO_AGENT_ID,
            amountUsdc,
            apiId,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        })
        if (!response.ok) throw new Error("Request failed")
        const payload = (await response.json()) as { decision: AccessDecision }
        setDecision(payload.decision)
      } catch {
        setError("Access check failed")
      }
    })
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <ArcButton
        className="w-full justify-center"
        disabled={isPending}
        icon={ShieldCheck}
        onClick={requestAccess}
        size={compact ? "sm" : "md"}
        variant="primary"
      >
        {isPending ? "Checking..." : "Request API access"}
      </ArcButton>

      {decision && (
        <div
          className="rounded-xl px-3 py-2 text-[11px]"
          style={{
            background: decision.allowed ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
            border: `1px solid ${decision.allowed ? "rgba(52,211,153,0.22)" : "rgba(248,113,113,0.22)"}`,
          }}
        >
          <div className="flex items-center gap-1.5 font-semibold" style={{ color: decision.allowed ? "#34d399" : "#f87171" }}>
            {decision.allowed ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
            {decision.allowed ? "Access allowed" : "Access denied"}
          </div>
          <p className="mt-1" style={{ color: "#94a3b8" }}>{decision.reason}</p>
          {!compact && (
            <p className="mt-1 font-mono" style={{ color: "#7a8fa8" }}>
              score {decision.score}/{decision.requiredScore} · daily {decision.dailyBudgetUsedPct}% · monthly {decision.monthlyBudgetUsedPct}%
            </p>
          )}
        </div>
      )}

      {decision?.allowed && <RunPaidWorkflowButton apiId={apiId} compact={compact} />}

      {error && <p className="text-[11px]" style={{ color: "#f87171" }}>{error}</p>}
    </div>
  )
}

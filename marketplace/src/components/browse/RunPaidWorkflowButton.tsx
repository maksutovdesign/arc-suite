"use client"

import { useState, useTransition } from "react"
import type { MouseEvent } from "react"
import { CheckCircle2, ExternalLink, PlayCircle, ReceiptText, ShieldCheck, X } from "lucide-react"
import { ArcButton } from "@/components/ui/ArcButton"

type Props = {
  apiId: string
  compact?: boolean
}

type WorkflowResponse = {
  liveSettlement?: { status?: string; txHash?: string | null; explorerUrl?: string | null }
  proofUrl?: string | null
  runId?: string
  stored?: boolean
}

export function RunPaidWorkflowButton({ apiId, compact = false }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<WorkflowResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  function requestConfirmation(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    setError(null)
    setResult(null)
    setIsConfirming(true)
  }

  function cancelWorkflow(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    setIsConfirming(false)
  }

  function runWorkflow(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    setError(null)
    setResult(null)
    setIsConfirming(false)

    startTransition(async () => {
      try {
        const response = await fetch("/api/arc/agentic/workflows", {
          body: JSON.stringify({
            apiId,
            sessionId: `marketplace:${apiId}:${Date.now()}`,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        })
        const payload = (await response.json()) as WorkflowResponse & { message?: string; error?: string }
        if (!response.ok) throw new Error(payload.message ?? payload.error ?? "Workflow failed")
        setResult(payload)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Workflow failed")
      }
    })
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <ArcButton
        className="w-full justify-center"
        disabled={isPending || isConfirming}
        icon={PlayCircle}
        onClick={requestConfirmation}
        size={compact ? "sm" : "md"}
        variant="outline"
      >
        {isPending ? "Running x402..." : "Run paid workflow"}
      </ArcButton>

      {isConfirming && (
        <div
          className="rounded-xl px-3 py-2 text-[11px]"
          style={{
            background: "rgba(95,191,255,0.08)",
            border: "1px solid rgba(95,191,255,0.22)",
            color: "#94a3b8",
          }}
        >
          <div className="flex items-center gap-1.5 font-semibold" style={{ color: "#5FBFFF" }}>
            <ShieldCheck className="size-3.5" />
            Confirm paid workflow
          </div>
          <p className="mt-1 leading-relaxed">
            This will run policy checks, create an x402-style offer, settle a small Arc Testnet USDC payment, and write a proof record for {apiId}.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 font-semibold"
              onClick={runWorkflow}
              style={{ background: "rgba(52,211,153,0.16)", color: "#34d399" }}
              type="button"
            >
              <CheckCircle2 className="size-3" /> Confirm run
            </button>
            <button
              className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 font-semibold"
              onClick={cancelWorkflow}
              style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}
              type="button"
            >
              <X className="size-3" /> Cancel
            </button>
          </div>
        </div>
      )}

      {result && (
        <div
          className="rounded-xl px-3 py-2 text-[11px]"
          style={{
            background: "rgba(52,211,153,0.08)",
            border: "1px solid rgba(52,211,153,0.22)",
            color: "#94a3b8",
          }}
        >
          <div className="flex items-center gap-1.5 font-semibold" style={{ color: "#34d399" }}>
            <ReceiptText className="size-3.5" />
            {result.liveSettlement?.status === "confirmed" ? "Paid workflow completed" : "Workflow receipt created"}
          </div>
          {result.runId && <p className="mt-1 font-mono" style={{ color: "#7a8fa8" }}>{result.runId}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {result.proofUrl && (
              <a className="inline-flex items-center gap-1 font-semibold" href={result.proofUrl} target="_blank" rel="noreferrer" style={{ color: "#5FBFFF" }}>
                View latest proof <ExternalLink className="size-3" />
              </a>
            )}
            {result.liveSettlement?.explorerUrl && (
              <a className="inline-flex items-center gap-1 font-semibold" href={result.liveSettlement.explorerUrl} target="_blank" rel="noreferrer" style={{ color: "#34d399" }}>
                Arcscan <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-[11px]" style={{ color: "#f87171" }}>{error}</p>}
    </div>
  )
}

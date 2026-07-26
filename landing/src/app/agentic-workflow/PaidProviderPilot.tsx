"use client"

import { BadgeDollarSign, CircleCheck, DatabaseZap, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"

type ReadinessPayload = {
  configuration: {
    batchSize: number
    enabled: boolean
    feeBps: number
    maxBatchSpendUsdc: number
    maxUnitPriceUsdc: number
    missing: string[]
    network: string
    product: string
    provider: string
    resource: string
  }
  evidence: {
    batches: number
    latestBatchId: string | null
    metrics: {
      accruedFeeUsdc: number
      paidOperations: number
      proofCompleteOperations: number
      proofCompletenessPct: number
      providerSpendUsdc: number
      settledFeeUsdc: number
    }
    persisted: boolean
  }
  provider: {
    available: boolean
    batching?: boolean
    inspectedAt?: string
    latencyMs?: number
    network?: string
    priceUsdc?: number | null
    status?: number
  }
}

export function PaidProviderPilot() {
  const [payload, setPayload] = useState<ReadinessPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadReadiness() {
    setLoading(true)
    setError(null)
    try {
      const next = await fetchReadiness()
      setPayload(next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Provider readiness is unavailable")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    fetchReadiness()
      .then((next) => {
        if (active) setPayload(next)
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Provider readiness is unavailable")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const metrics = payload?.evidence.metrics
  const targetReached = Boolean(metrics && metrics.paidOperations >= 25 && metrics.proofCompletenessPct === 100)

  return (
    <section className="paid-provider-pilot" aria-label="Paid provider pilot">
      <div className="paid-provider-head">
        <div>
          <span>Real provider pilot</span>
          <h2>AIsa paid market data · 25-operation evidence gate</h2>
          <p>
            A fixed, allowlisted x402 resource with a $0.01 unit cap, a{" "}
            {(payload?.configuration.maxBatchSpendUsdc ?? 0.2).toFixed(2)} USDC batch cap,
            sequential execution, Circle Gateway authorization and hashed delivery evidence.
          </p>
        </div>
        <div className={`paid-provider-state ${targetReached ? "is-complete" : ""}`}>
          {targetReached ? <CircleCheck size={18} /> : <ShieldCheck size={18} />}
          <strong>{targetReached ? "Sprint evidence complete" : "Controlled pilot"}</strong>
          <span>{metrics?.paidOperations ?? 0} / 25 paid operations</span>
        </div>
      </div>

      <div className="paid-provider-metrics">
        <Metric
          label="Live x402 price"
          value={payload?.provider.priceUsdc != null ? `$${payload.provider.priceUsdc.toFixed(3)}` : "—"}
          detail={payload?.provider.available ? `HTTP 402 verified · ${payload.provider.latencyMs ?? 0} ms` : "Provider inspection pending"}
        />
        <Metric
          label="Real provider spend"
          value={`${(metrics?.providerSpendUsdc ?? 0).toFixed(3)} USDC`}
          detail={`${metrics?.paidOperations ?? 0} delivered responses`}
        />
        <Metric
          label="Proof completeness"
          value={`${(metrics?.proofCompletenessPct ?? 0).toFixed(0)}%`}
          detail={`${metrics?.proofCompleteOperations ?? 0} complete evidence envelopes`}
        />
        <Metric
          label="Kestrel fee"
          value={`${(metrics?.accruedFeeUsdc ?? 0).toFixed(6)} USDC`}
          detail={`${(metrics?.settledFeeUsdc ?? 0).toFixed(6)} settled · ${payload?.configuration.feeBps ?? 75} bps`}
        />
      </div>

      <div className="paid-provider-controls">
        <div>
          <DatabaseZap size={17} />
          <span>
            {payload?.evidence.persisted
              ? `${payload.evidence.batches} persisted batch${payload.evidence.batches === 1 ? "" : "es"}`
              : "Supabase evidence storage unavailable"}
          </span>
        </div>
        <div>
          <BadgeDollarSign size={17} />
          <span>
            Fee is shown as accrued until a separate settlement receipt exists.
          </span>
        </div>
        <button disabled={loading} onClick={() => void loadReadiness()} type="button">
          <RefreshCw className={loading ? "is-spinning" : ""} size={15} />
          {loading ? "Inspecting..." : "Refresh evidence"}
        </button>
        <a href="https://aisa.one/docs/api-reference" target="_blank" rel="noreferrer">
          Provider docs <ExternalLink size={14} />
        </a>
      </div>

      {payload && !payload.configuration.enabled && (
        <p className="paid-provider-notice">
          Payment execution remains operator-locked. Missing: {payload.configuration.missing.join("; ")}.
        </p>
      )}
      {error && <p className="paid-provider-notice is-error">{error}</p>}
    </section>
  )
}

async function fetchReadiness() {
  const response = await fetch("/api/procurement/readiness", { cache: "no-store" })
  const next = await response.json() as ReadinessPayload
  if (!next.configuration || !next.evidence || !next.provider) throw new Error("Readiness payload is incomplete")
  return next
}

function Metric({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Loader2, Play, ReceiptText } from "lucide-react"

type DemoRunState = "idle" | "running" | "failed"

export function ProviderDemoRunButton() {
  const [state, setState] = useState<DemoRunState>("idle")
  const [message, setMessage] = useState<string | null>(null)

  async function runProviderDemo() {
    setState("running")
    setMessage("Creating provider receipt...")

    try {
      const response = await fetch("/api/provider/demo-run", {
        body: JSON.stringify({ sessionId: getSessionId() }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const payload = (await response.json()) as { proofUrl?: string; error?: string }
      if (!response.ok || !payload.proofUrl) {
        throw new Error(payload.error ?? "Provider demo run failed")
      }

      setMessage("Receipt created. Opening proof...")
      window.location.href = payload.proofUrl
    } catch (error) {
      setState("failed")
      setMessage(error instanceof Error ? error.message : "Provider demo run failed")
    }
  }

  return (
    <div className="provider-demo-run">
      <button className="button primary" disabled={state === "running"} onClick={runProviderDemo} type="button">
        {state === "running" ? <Loader2 className="spin-icon" size={16} /> : <Play size={16} />}
        Create provider receipt
      </button>
      <span>
        <ReceiptText size={14} />
        {message ?? "Creates a signed x402 receipt and opens its proof."}
      </span>
    </div>
  )
}

function getSessionId() {
  const key = "arc-provider-demo-session"
  const existing = window.localStorage.getItem(key)
  if (existing) return existing
  const created = crypto.randomUUID()
  window.localStorage.setItem(key, created)
  return created
}

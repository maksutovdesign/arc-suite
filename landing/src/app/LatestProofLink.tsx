"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, FileCheck2 } from "lucide-react"

type LatestProof = {
  amount: string
  apiId: string
  apiName: string
  explorerUrl: string | null
  generatedAt: string
  proofSource: "demo" | "supabase"
  proofUrl: string
  provider: string
  settlementId: string
  stored: boolean
  txHash: string | null
  workflowId: string
}

type LatestProofLinkProps = {
  fallbackHref: string
  label?: string
  mode?: "button" | "card" | "inline"
}

export function LatestProofLink({
  fallbackHref,
  label = "Latest proof",
  mode = "button",
}: LatestProofLinkProps) {
  const [proof, setProof] = useState<LatestProof | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/agentic/latest-proof", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data?.proofUrl) setProof(data as LatestProof)
      })
      .catch(() => {
        if (active) setProof(null)
      })
    return () => {
      active = false
    }
  }, [])

  const href = proof?.proofUrl ?? fallbackHref
  const detail = proof
    ? `${proof.apiId} · ${proof.amount} · ${proof.proofSource === "supabase" ? "live" : "demo"}`
    : "Loading latest workflow..."

  if (mode === "card") {
    return (
      <a className="latest-proof-card" href={href}>
        <span><FileCheck2 size={16} /> {label}</span>
        <strong>{proof?.workflowId ?? "Resolving latest proof"}</strong>
        <small>{detail}</small>
        <em>{proof?.txHash ? shortHash(proof.txHash) : "tx pending"}</em>
      </a>
    )
  }

  if (mode === "inline") {
    return (
      <a className="latest-proof-inline" href={href}>
        <FileCheck2 size={16} /> {label} <ArrowUpRight size={14} />
      </a>
    )
  }

  return (
    <a className="button secondary" href={href}>
      <FileCheck2 size={17} /> {label}
    </a>
  )
}

function shortHash(value: string) {
  return value.length > 16 ? `${value.slice(0, 8)}...${value.slice(-5)}` : value
}

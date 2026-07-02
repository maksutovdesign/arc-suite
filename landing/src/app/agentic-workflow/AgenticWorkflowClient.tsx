"use client"

import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  CircleDollarSign,
  Database,
  FileCheck2,
  LockKeyhole,
  Play,
  Shield,
  ReceiptText,
  ShieldCheck,
  Store,
  WalletCards,
  Workflow,
} from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"

import {
  buildAgenticDemoProof,
  shortAddress,
  shortHash,
  type AgenticWorkflowProof,
} from "@/lib/agentic-demo-proof"

const workflowStages = [
  { key: "intent", label: "Agent intent", detail: "DataHarvester-Pro asks for paid market data.", icon: Workflow },
  { key: "offer", label: "x402 offer", detail: "Marketplace returns exact USDC price and receipt terms.", icon: Store },
  { key: "budget", label: "Treasury budget", detail: "Prepaid balance and daily spend policy are checked.", icon: WalletCards },
  { key: "shield", label: "Shield screening", detail: "Circle compliance signal clears the recipient wallet.", icon: ShieldCheck },
  { key: "meter", label: "Usage metering", detail: "Billing writes the request as a metered usage event.", icon: ReceiptText },
  { key: "settlement", label: "Arc settlement", detail: "Settlement evidence is attached to the proof trail.", icon: CircleDollarSign },
  { key: "reputation", label: "Reputation update", detail: "Successful payment raises the agent trust score.", icon: BadgeCheck },
] as const

type LiveSettlementStatus =
  | { enabled: false; status: "disabled" }
  | { enabled: true; status: "confirmed"; explorerUrl: string | null; settlementId: string; txHash: string | null }
  | { enabled: true; status: "policy_denied"; settlementId: string; reason: string }
  | { enabled: true; status: "failed"; code: string; message: string }

export function AgenticWorkflowClient() {
  const [activeStage, setActiveStage] = useState(workflowStages.length - 1)
  const [isRunning, setIsRunning] = useState(false)
  const [isPersisting, setIsPersisting] = useState(false)
  const [proof, setProof] = useState<AgenticWorkflowProof>(() => buildAgenticDemoProof())
  const [proofUrl, setProofUrl] = useState(`/proof?id=${encodeURIComponent(proof.workflowId)}`)
  const [liveSettlement, setLiveSettlement] = useState<LiveSettlementStatus>({ enabled: false, status: "disabled" })
  const [runError, setRunError] = useState<string | null>(null)

  useEffect(() => {
    if (!isRunning) return
    const timers = workflowStages.map((_, index) =>
      window.setTimeout(() => {
        setActiveStage(index)
        if (index === workflowStages.length - 1) {
          setIsRunning(false)
        }
      }, index * 520),
    )
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [isRunning])

  async function runWorkflow() {
    if (isRunning || isPersisting) return
    setRunError(null)
    setActiveStage(0)
    setIsRunning(true)
    setIsPersisting(true)

    try {
      const response = await fetch("/api/agentic/workflows", {
        body: JSON.stringify({ sessionId: getSessionId() }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const payload = await response.json() as {
        liveSettlement?: LiveSettlementStatus
        proof?: AgenticWorkflowProof
        proofUrl?: string
        stored?: boolean
      }

      if (!response.ok || !payload.proof) {
        throw new Error("Workflow endpoint did not return a proof")
      }

      setProof(payload.proof)
      setProofUrl(payload.proofUrl ?? `/proof?id=${encodeURIComponent(payload.proof.workflowId)}`)
      setLiveSettlement(payload.liveSettlement ?? { enabled: false, status: "disabled" })
    } catch (error) {
      const fallback = buildAgenticDemoProof({ nonce: crypto.randomUUID().slice(0, 8) })
      setProof(fallback)
      setProofUrl(`/proof?id=${encodeURIComponent(fallback.workflowId)}`)
      setLiveSettlement({ enabled: false, status: "disabled" })
      setRunError(error instanceof Error ? error.message : "Workflow endpoint unavailable")
    } finally {
      setIsPersisting(false)
    }
  }

  return (
    <section className="analytics-shell agentic-shell">
      <div className="agentic-hero">
        <div>
          <p className="kicker">Agentic workflow demo</p>
          <h1>One autonomous API purchase, from policy to settlement proof.</h1>
          <p>
            This demo connects the suite into a single operator story: an AI agent requests a paid API,
            receives an x402 offer, passes Treasury and Shield policy, creates a settlement-ready Arc
            proof trail and writes a reputation event back into the workspace.
          </p>
          <div className="agentic-actions">
            <button className="button primary" disabled={isRunning || isPersisting} onClick={runWorkflow} type="button">
              <Play size={17} /> {isRunning || isPersisting ? "Running live workflow..." : "Run agentic workflow"}
            </button>
            <a className="button secondary" href={proofUrl}>Open proof page</a>
            <a className="button secondary" href="/flow">Open Flow console</a>
          </div>
          {runError && <p className="agentic-status-note">Demo fallback is active: {runError}</p>}
        </div>

        <div className="agentic-outcome" aria-label="Workflow outcome">
          <span><Database size={16} /> Audit trail</span>
          <strong>{proof.stored ? "Supabase run + x402 receipt" : "Demo receipt fallback"}</strong>
          <small>{proof.workflowId} · {proof.receipt.receiptId}</small>
          <small>{liveSettlementLabel(liveSettlement)}</small>
        </div>
      </div>

      <div className="agentic-grid">
        <section className="agentic-runner" aria-label="Agentic payment pipeline">
          {workflowStages.map((stage, index) => {
            const Icon = stage.icon
            const isDone = index < activeStage || (!isRunning && activeStage === workflowStages.length - 1)
            const isActive = index === activeStage && isRunning
            return (
              <div className={`agentic-stage ${isDone ? "is-done" : ""} ${isActive ? "is-active" : ""}`} key={stage.key}>
                <div className="agentic-stage-icon">
                  {isDone ? <Check size={16} /> : <Icon size={17} />}
                </div>
                <div>
                  <strong>{stage.label}</strong>
                  <span>{stage.detail}</span>
                </div>
                <code>{String(index + 1).padStart(2, "0")}</code>
              </div>
            )
          })}
        </section>

        <section className="agentic-receipt">
          <div className="flow-panel-title">
            <div>
              <span>Signed receipt</span>
              <h2>x402 + Arc proof</h2>
            </div>
            <FileCheck2 size={21} />
          </div>
          <div className="agentic-proof-grid">
            <ProofItem label="Agent" value={proof.agentName} />
            <ProofItem label="API" value={proof.apiName} />
            <ProofItem label="Provider" value={proof.provider} />
            <ProofItem label="Price" value={proof.price} />
            <ProofItem label="Payer" value={proof.payer} />
            <ProofItem label="Recipient" value={proof.recipient} />
            <ProofItem label="Policy" value={proof.policy} tone="success" />
            <ProofItem label="Screening" value={proof.screening} tone="success" />
            <ProofItem label="Budget" value={proof.budget} />
            <ProofItem label="Billing event" value={proof.billingEvent} />
            <ProofItem label="Amount settled" value={proof.amount} tone="success" />
            <ProofItem label="Reputation" value={proof.reputation} tone="success" />
          </div>
          <div className="agentic-x402-chain" aria-label="x402 signed offer and demo provider receipt">
            <ProtocolCard
              eyebrow="01 / Marketplace"
              title="Signed offer"
              icon={<Store size={18} />}
              rows={[
                ["offer id", proof.offer.offerId],
                ["scheme", proof.offer.scheme],
                ["amount", `${proof.offer.amountUsdc} USDC`],
                ["valid until", proof.offer.expiresAt],
                ["signature", proof.offer.signature],
              ]}
            />
            <ProtocolCard
              eyebrow="02 / Agent wallet"
              title="Authorization"
              icon={<Shield size={18} />}
              rows={[
                ["payer", proof.authorization.payer],
                ["budget lock", proof.authorization.budgetLockId],
                ["nonce", proof.authorization.nonce],
                ["digest", proof.authorization.digest],
                ["signature", proof.authorization.signature],
              ]}
            />
            <ProtocolCard
              eyebrow="03 / Provider"
              title="Signed receipt"
              icon={<FileCheck2 size={18} />}
              rows={[
                ["receipt id", proof.receipt.receiptId],
                ["settlement", proof.receipt.settlementId],
                ["tx hash", shortHash(proof.receipt.txHash)],
                ["provider key", proof.receipt.providerKeyId],
                ["algorithm", proof.receipt.signatureAlgorithm],
                ["verified", proof.receipt.verified ? "true" : "false"],
                ["signature", proof.receipt.signature],
              ]}
            />
          </div>
          <div className="agentic-terminal" aria-label="Receipt payload">
            <span>{`{`}</span>
            <span>{`  "workflowId": "${proof.workflowId}",`}</span>
            <span>{`  "x402Offer": "${proof.offer.offerId}",`}</span>
            <span>{`  "offerSignature": "${proof.offer.signature}",`}</span>
            <span>{`  "paymentAuthorization": "${proof.authorization.signature}",`}</span>
            <span>{`  "receiptId": "${proof.receipt.receiptId}",`}</span>
            <span>{`  "providerKeyId": "${proof.receipt.providerKeyId}",`}</span>
            <span>{`  "providerPayload": "${proof.receipt.verificationPayloadHash}",`}</span>
            <span>{`  "receiptSignature": "${proof.receipt.signature}",`}</span>
            <span>{`  "settlementId": "${proof.settlementId}",`}</span>
            <span>{`  "requestId": "${proof.requestId}",`}</span>
            <span>{`  "generatedAt": "${proof.generatedAt}"`}</span>
            <span>{`}`}</span>
          </div>
          {proof.flowRun.explorerUrl && (
            <a className="agentic-explorer" href={proof.flowRun.explorerUrl} target="_blank" rel="noreferrer">
              View Arc Testnet transaction <ArrowUpRight size={15} />
            </a>
          )}
        </section>
      </div>

      <section className="agentic-proof-strip" aria-label="Why this matters">
        <div>
          <LockKeyhole size={18} />
          <strong>Policy-safe commerce</strong>
          <span>The API can be paid only after budget, reputation and compliance gates pass.</span>
        </div>
        <div>
          <ReceiptText size={18} />
          <strong>x402-ready metering</strong>
          <span>Each request has price, usage, invoice and receipt fields ready for provider settlement.</span>
        </div>
        <div>
          <BadgeCheck size={18} />
          <strong>Trust feedback loop</strong>
          <span>The successful payment becomes a new reputation signal for future access checks.</span>
        </div>
      </section>

      <section className="agentic-model" aria-label="Arc Agent and Job model">
        <div className="flow-panel-title">
          <div>
            <span>Agent / Job model</span>
            <h2>ERC-8004 identity + ERC-8183 job envelope</h2>
          </div>
          <Workflow size={21} />
        </div>
        <div className="agentic-model-grid">
          <ModelCard
            eyebrow="Agent identity"
            title={proof.agentName}
            rows={[
              ["standard", proof.agentIdentity.standard],
              ["registry", shortAddress(proof.agentIdentity.registryAddress)],
              ["agent uri", proof.agentIdentity.agentUri],
              ["wallet", shortAddress(proof.agentIdentity.walletAddress)],
              ["status", proof.agentIdentity.status],
            ]}
          />
          <ModelCard
            eyebrow="Job envelope"
            title={proof.agentJob.id}
            rows={[
              ["standard", proof.agentJob.standard],
              ["capability", proof.agentJob.requestedCapability],
              ["status", proof.agentJob.status],
              ["input hash", shortHash(proof.agentJob.inputHash)],
              ["policy hash", shortHash(proof.agentJob.policyHash)],
            ]}
          />
          <ModelCard
            eyebrow="Validation registry"
            title={proof.agentValidation.id}
            rows={[
              ["result", proof.agentValidation.result],
              ["score", String(proof.agentValidation.score)],
              ["evidence", proof.agentValidation.evidenceUri],
              ["evidence hash", shortHash(proof.agentValidation.evidenceHash)],
              ["signature", proof.agentValidation.signature],
            ]}
          />
        </div>
        <div className="agentic-artifacts">
          {proof.artifacts.map((artifact) => (
            <div key={artifact.id}>
              <span>{artifact.type}</span>
              <strong>{shortHash(artifact.digest)}</strong>
              <code>{artifact.signature ?? "unsigned"}</code>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}

function liveSettlementLabel(status: LiveSettlementStatus) {
  if (!status.enabled) return "Arc settlement path: disabled by env"
  if (status.status === "confirmed") return `Arc settlement proof: ${shortHash(status.txHash)}`
  if (status.status === "policy_denied") return `Arc settlement path: policy denied ${status.settlementId}`
  return `Arc settlement path: fallback (${status.code})`
}

function getSessionId() {
  if (typeof window === "undefined") return "server"
  const key = "arc_suite_demo_session"
  const existing = window.localStorage.getItem(key)
  if (existing) return existing
  const next = crypto.randomUUID()
  window.localStorage.setItem(key, next)
  return next
}

function ProofItem({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" }) {
  return (
    <div className={`agentic-proof-item is-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ProtocolCard({
  eyebrow,
  icon,
  rows,
  title,
}: {
  eyebrow: string
  icon: ReactNode
  rows: Array<[string, string]>
  title: string
}) {
  return (
    <div className="agentic-protocol-card">
      <div className="agentic-protocol-head">
        <span>{eyebrow}</span>
        {icon}
      </div>
      <strong>{title}</strong>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function ModelCard({ eyebrow, rows, title }: { eyebrow: string; rows: Array<[string, string]>; title: string }) {
  return (
    <div className="agentic-model-card">
      <span>{eyebrow}</span>
      <strong>{title}</strong>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

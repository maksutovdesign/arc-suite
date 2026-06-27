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
import { useEffect, useMemo, useState } from "react"

import {
  demoAgents,
  demoArcAgentModel,
  demoApis,
  demoBillingOverview,
  demoFlowPayload,
  demoSettlementConfig,
  demoShieldPayload,
} from "../demoWorkspace"

const workflowStages = [
  { key: "intent", label: "Agent intent", detail: "DataHarvester-Pro asks for paid market data.", icon: Workflow },
  { key: "offer", label: "x402 offer", detail: "Marketplace returns exact USDC price and receipt terms.", icon: Store },
  { key: "budget", label: "Treasury budget", detail: "Prepaid balance and daily spend policy are checked.", icon: WalletCards },
  { key: "shield", label: "Shield screening", detail: "Circle compliance signal clears the recipient wallet.", icon: ShieldCheck },
  { key: "meter", label: "Usage metering", detail: "Billing writes the request as a metered usage event.", icon: ReceiptText },
  { key: "settlement", label: "Arc settlement", detail: "USDC transfer is confirmed on Arc Testnet.", icon: CircleDollarSign },
  { key: "reputation", label: "Reputation update", detail: "Successful payment raises the agent trust score.", icon: BadgeCheck },
] as const

const run = demoFlowPayload.runs[0]
const agent = demoAgents.find((item) => item.id === run.agentId) ?? demoAgents[0]
const api = demoApis.find((item) => item.id === run.apiId) ?? demoApis[0]
const usage = demoBillingOverview.usage.find((item) => item.id === "use_demo_001") ?? demoBillingOverview.usage[0]
const screening = demoShieldPayload.screenings.find((item) => item.id === run.screeningId) ?? demoShieldPayload.screenings[0]
const agentIdentity = demoArcAgentModel.identities[0]
const agentJob = demoArcAgentModel.jobs[0]
const agentValidation = demoArcAgentModel.validations[0]

export function AgenticWorkflowClient() {
  const [activeStage, setActiveStage] = useState(workflowStages.length - 1)
  const [isRunning, setIsRunning] = useState(false)
  const [runNonce, setRunNonce] = useState("demo_001")

  const proof = useMemo(() => {
    const now = new Date().toISOString()
    const offer = createSignedOffer(runNonce)
    const authorization = createPaymentAuthorization(offer)
    const receipt = createSignedReceipt(offer, authorization, now)
    return {
      amount: `${run.amountUsdc.toFixed(3)} USDC`,
      apiName: api.name,
      agentName: agent.name,
      authorization,
      billingEvent: usage.id,
      budget: `${agent.dailySpentUsdc.toFixed(2)} / ${agent.dailyLimitUsdc.toFixed(2)} USDC daily`,
      generatedAt: now,
      offer,
      payer: shortAddress(agent.address),
      policy: screening.decision.toUpperCase(),
      price: `${api.priceUsdc.toFixed(3)} USDC / ${api.pricingUnit}`,
      provider: api.providerName,
      recipient: shortAddress(run.recipientAddress || demoSettlementConfig.defaultRecipient),
      reputation: `${run.reputationScoreBefore} -> ${run.reputationScoreAfter}`,
      requestId: run.requestId ?? "req_demo_flow_001",
      receipt,
      screening: screening.providerResult ?? "APPROVED",
      settlementId: run.settlementId ?? "set_demo_001",
      txHash: run.txHash ?? "",
      workflowId: run.id,
    }
  }, [runNonce])

  useEffect(() => {
    if (!isRunning) return
    setActiveStage(0)
    const timers = workflowStages.map((_, index) =>
      window.setTimeout(() => {
        setActiveStage(index)
        if (index === workflowStages.length - 1) {
          setIsRunning(false)
          setRunNonce(crypto.randomUUID().slice(0, 8))
        }
      }, index * 520),
    )
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [isRunning])

  return (
    <section className="analytics-shell agentic-shell">
      <div className="agentic-hero">
        <div>
          <p className="kicker">Agentic workflow demo</p>
          <h1>One autonomous API purchase, from policy to settlement proof.</h1>
          <p>
            This demo connects the suite into a single operator story: an AI agent requests a paid API,
            receives an x402 offer, passes Treasury and Shield policy, settles USDC on Arc Testnet and
            writes a reputation event back into the workspace.
          </p>
          <div className="agentic-actions">
            <button className="button primary" disabled={isRunning} onClick={() => setIsRunning(true)} type="button">
              <Play size={17} /> {isRunning ? "Running workflow..." : "Run agentic workflow"}
            </button>
            <a className="button secondary" href="/flow">Open Flow console</a>
          </div>
        </div>

        <div className="agentic-outcome" aria-label="Workflow outcome">
          <span><Database size={16} /> Audit trail</span>
          <strong>Supabase run + x402 receipt</strong>
          <small>{proof.workflowId} · {proof.receipt.receiptId}</small>
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
          <div className="agentic-x402-chain" aria-label="x402 signed offer and receipt simulation">
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
            <span>{`  "receiptSignature": "${proof.receipt.signature}",`}</span>
            <span>{`  "settlementId": "${proof.settlementId}",`}</span>
            <span>{`  "requestId": "${proof.requestId}",`}</span>
            <span>{`  "generatedAt": "${proof.generatedAt}"`}</span>
            <span>{`}`}</span>
          </div>
          {run.explorerUrl && (
            <a className="agentic-explorer" href={run.explorerUrl} target="_blank" rel="noreferrer">
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
              ["standard", agentIdentity.standard],
              ["registry", shortAddress(agentIdentity.registryAddress)],
              ["agent uri", agentIdentity.agentUri],
              ["wallet", shortAddress(agentIdentity.walletAddress)],
              ["status", agentIdentity.status],
            ]}
          />
          <ModelCard
            eyebrow="Job envelope"
            title={agentJob.id}
            rows={[
              ["standard", agentJob.standard],
              ["capability", agentJob.requestedCapability],
              ["status", agentJob.status],
              ["input hash", shortHash(agentJob.inputHash)],
              ["policy hash", shortHash(agentJob.policyHash)],
            ]}
          />
          <ModelCard
            eyebrow="Validation registry"
            title={agentValidation.id}
            rows={[
              ["result", agentValidation.result],
              ["score", String(agentValidation.score)],
              ["evidence", agentValidation.evidenceUri],
              ["evidence hash", shortHash(agentValidation.evidenceHash)],
              ["signature", agentValidation.signature],
            ]}
          />
        </div>
        <div className="agentic-artifacts">
          {demoArcAgentModel.artifacts.map((artifact) => (
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

function shortAddress(value: string | null) {
  if (!value) return "not configured"
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function shortHash(value: string) {
  return value ? `${value.slice(0, 8)}...${value.slice(-5)}` : "pending"
}

function createSignedOffer(nonce: string) {
  const offerId = `offer_x402_${stableDigest(`offer:${run.id}:${api.id}:${nonce}`).slice(0, 10)}`
  const payload = [
    "x402",
    "exact",
    "ARC-TESTNET",
    api.id,
    agent.id,
    run.amountUsdc.toFixed(6),
    run.recipientAddress,
    nonce,
  ].join(":")

  return {
    amountUsdc: run.amountUsdc.toFixed(3),
    apiId: api.id,
    expiresAt: "2026-06-27T23:59:59Z",
    offerId,
    payloadHash: stableDigest(payload),
    scheme: "x402/exact-usdc-arc-testnet",
    signature: `sig_marketplace_${stableDigest(`marketplace:${payload}`).slice(0, 24)}`,
  }
}

function createPaymentAuthorization(offer: ReturnType<typeof createSignedOffer>) {
  const nonce = `auth_${stableDigest(`auth:${offer.offerId}:${agent.address}`).slice(0, 12)}`
  const digest = stableDigest(`${offer.payloadHash}:${agent.address}:${usage.id}:${nonce}`)

  return {
    budgetLockId: `lock_${stableDigest(`budget:${offer.offerId}:${usage.id}`).slice(0, 10)}`,
    digest,
    nonce,
    payer: shortAddress(agent.address),
    signature: `sig_agent_${digest.slice(0, 24)}`,
  }
}

function createSignedReceipt(
  offer: ReturnType<typeof createSignedOffer>,
  authorization: ReturnType<typeof createPaymentAuthorization>,
  generatedAt: string,
) {
  const receiptId = `rcpt_arc_${stableDigest(`receipt:${offer.offerId}:${authorization.digest}:${run.txHash}`).slice(0, 10)}`
  const digest = stableDigest(`${receiptId}:${run.settlementId}:${run.txHash}:${generatedAt}`)

  return {
    digest,
    receiptId,
    settlementId: run.settlementId ?? "set_demo_001",
    signature: `sig_provider_${digest.slice(0, 24)}`,
    txHash: run.txHash ?? "",
    verified: Boolean(run.txHash && authorization.signature && offer.signature),
  }
}

function stableDigest(value: string) {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return Math.abs(hash >>> 0).toString(16).padStart(8, "0") + Math.abs((hash ^ value.length) >>> 0).toString(16).padStart(8, "0")
}

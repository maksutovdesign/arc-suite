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
  ReceiptText,
  ShieldCheck,
  Store,
  WalletCards,
  Workflow,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import {
  demoAgents,
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

export function AgenticWorkflowClient() {
  const [activeStage, setActiveStage] = useState(workflowStages.length - 1)
  const [isRunning, setIsRunning] = useState(false)
  const [receiptId, setReceiptId] = useState("rcpt_arc_flow_demo_001")

  const proof = useMemo(() => {
    const now = new Date().toISOString()
    return {
      amount: `${run.amountUsdc.toFixed(3)} USDC`,
      apiName: api.name,
      agentName: agent.name,
      billingEvent: usage.id,
      budget: `${agent.dailySpentUsdc.toFixed(2)} / ${agent.dailyLimitUsdc.toFixed(2)} USDC daily`,
      generatedAt: now,
      invoice: "x402-invoice-flow-demo-001",
      payer: shortAddress(agent.address),
      policy: screening.decision.toUpperCase(),
      price: `${api.priceUsdc.toFixed(3)} USDC / ${api.pricingUnit}`,
      provider: api.providerName,
      recipient: shortAddress(run.recipientAddress || demoSettlementConfig.defaultRecipient),
      reputation: `${run.reputationScoreBefore} -> ${run.reputationScoreAfter}`,
      requestId: run.requestId ?? "req_demo_flow_001",
      receiptId,
      screening: screening.providerResult ?? "APPROVED",
      settlementId: run.settlementId ?? "set_demo_001",
      txHash: run.txHash ?? "",
      workflowId: run.id,
    }
  }, [receiptId])

  useEffect(() => {
    if (!isRunning) return
    setActiveStage(0)
    const timers = workflowStages.map((_, index) =>
      window.setTimeout(() => {
        setActiveStage(index)
        if (index === workflowStages.length - 1) {
          setIsRunning(false)
          setReceiptId(`rcpt_arc_${crypto.randomUUID().slice(0, 8)}`)
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
          <small>{proof.workflowId} · {proof.receiptId}</small>
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
          <div className="agentic-terminal" aria-label="Receipt payload">
            <span>{`{`}</span>
            <span>{`  "workflowId": "${proof.workflowId}",`}</span>
            <span>{`  "x402Invoice": "${proof.invoice}",`}</span>
            <span>{`  "receiptId": "${proof.receiptId}",`}</span>
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

function shortAddress(value: string | null) {
  if (!value) return "not configured"
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

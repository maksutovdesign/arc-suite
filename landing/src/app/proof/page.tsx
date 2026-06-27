import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  CircleDollarSign,
  FileCheck2,
  ReceiptText,
  ShieldCheck,
  WalletCards,
  Workflow,
} from "lucide-react"

import {
  demoAgents,
  demoArcAgentModel,
  demoApis,
  demoBillingOverview,
  demoFlowPayload,
  demoShieldPayload,
} from "../demoWorkspace"
import { SiteHeader } from "../SiteHeader"

export const metadata = {
  title: "Proof - Arc Suite",
  description: "Arc Suite proof page with transaction hash, x402 receipt and policy chain.",
}

const flowRun = demoFlowPayload.runs[0]
const agent = demoAgents.find((item) => item.id === flowRun.agentId) ?? demoAgents[0]
const api = demoApis.find((item) => item.id === flowRun.apiId) ?? demoApis[0]
const screening = demoShieldPayload.screenings.find((item) => item.id === flowRun.screeningId) ?? demoShieldPayload.screenings[0]
const usage = demoBillingOverview.usage.find((item) => item.id === "use_demo_001") ?? demoBillingOverview.usage[0]
const agentJob = demoArcAgentModel.jobs[0]
const validation = demoArcAgentModel.validations[0]
const artifacts = demoArcAgentModel.artifacts

const receipt = {
  workflowId: flowRun.id,
  agentJobId: agentJob.id,
  agentIdentity: demoArcAgentModel.identities[0].id,
  x402OfferDigest: artifacts.find((item) => item.type === "x402_offer")?.digest ?? "pending",
  paymentAuthorizationDigest: artifacts.find((item) => item.type === "payment_authorization")?.digest ?? "pending",
  receiptDigest: agentJob.receiptHash ?? artifacts.find((item) => item.type === "receipt")?.digest ?? "pending",
  settlementId: flowRun.settlementId ?? "pending",
  txHash: flowRun.txHash ?? "pending",
  explorerUrl: flowRun.explorerUrl ?? "",
  policyDecision: flowRun.accessAllowed ? "allow" : "deny",
  validationResult: validation.result,
  reputationDelta: `${flowRun.reputationScoreBefore} -> ${flowRun.reputationScoreAfter}`,
}

const policyChain = [
  {
    label: "Treasury budget",
    detail: `${agent.dailySpentUsdc.toFixed(2)} / ${agent.dailyLimitUsdc.toFixed(2)} USDC daily spend`,
    result: "passed",
    icon: WalletCards,
  },
  {
    label: "Reputation access",
    detail: `Score ${flowRun.reputationScoreAfter ?? flowRun.reputationScoreBefore} >= API threshold ${api.minReputationScore}`,
    result: "passed",
    icon: BadgeCheck,
  },
  {
    label: "Shield screening",
    detail: `${screening.providerResult ?? "APPROVED"} by Circle Compliance Engine simulation`,
    result: screening.decision,
    icon: ShieldCheck,
  },
  {
    label: "x402 signed offer",
    detail: `${api.priceUsdc.toFixed(3)} USDC per ${api.pricingUnit} from ${api.providerName}`,
    result: "signed",
    icon: ReceiptText,
  },
  {
    label: "Billing metering",
    detail: `${usage.units} ${usage.pricingUnit} recorded as ${usage.id}`,
    result: "recorded",
    icon: FileCheck2,
  },
  {
    label: "Arc settlement",
    detail: `${flowRun.amountUsdc.toFixed(3)} USDC confirmed on Arc Testnet`,
    result: "confirmed",
    icon: CircleDollarSign,
  },
  {
    label: "Validation registry",
    detail: `Evidence ${shortHash(validation.evidenceHash)} scored ${validation.score}`,
    result: validation.result,
    icon: Workflow,
  },
]

export default function ProofPage() {
  return (
    <main>
      <SiteHeader idPrefix="proof-brand" />
      <section className="proof-shell">
        <div className="proof-hero">
          <div>
            <p className="kicker">Transaction proof</p>
            <h1>Tx hash, receipt and policy chain in one audit view.</h1>
            <p>
              This page turns the Agentic Workflow Demo into a reviewer-ready proof artifact:
              the x402 receipt, policy decisions, Arc Testnet transaction hash and validation evidence
              are tied to the same workflow and agent job IDs.
            </p>
          </div>
          <div className="proof-verdict">
            <span><Check size={16} /> Verified demo proof</span>
            <strong>{receipt.policyDecision.toUpperCase()} · {receipt.validationResult.toUpperCase()}</strong>
            <small>{receipt.workflowId} · {receipt.agentJobId}</small>
          </div>
        </div>

        <div className="proof-grid">
          <section className="proof-panel proof-transaction">
            <div className="flow-panel-title">
              <div>
                <span>Arc Testnet</span>
                <h2>Transaction hash</h2>
              </div>
              <CircleDollarSign size={21} />
            </div>
            <code>{receipt.txHash}</code>
            {receipt.explorerUrl && (
              <a href={receipt.explorerUrl} target="_blank" rel="noreferrer">
                Open in Arcscan <ArrowUpRight size={15} />
              </a>
            )}
          </section>

          <section className="proof-panel">
            <div className="flow-panel-title">
              <div>
                <span>x402 receipt</span>
                <h2>Signed payment evidence</h2>
              </div>
              <ReceiptText size={21} />
            </div>
            <div className="proof-receipt-json" aria-label="Receipt JSON">
              <span>{`{`}</span>
              <span>{`  "workflowId": "${receipt.workflowId}",`}</span>
              <span>{`  "agentJobId": "${receipt.agentJobId}",`}</span>
              <span>{`  "x402OfferDigest": "${receipt.x402OfferDigest}",`}</span>
              <span>{`  "paymentAuthorizationDigest": "${receipt.paymentAuthorizationDigest}",`}</span>
              <span>{`  "receiptDigest": "${receipt.receiptDigest}",`}</span>
              <span>{`  "settlementId": "${receipt.settlementId}",`}</span>
              <span>{`  "txHash": "${receipt.txHash}",`}</span>
              <span>{`  "validationResult": "${receipt.validationResult}"`}</span>
              <span>{`}`}</span>
            </div>
          </section>
        </div>

        <section className="proof-panel proof-chain">
          <div className="flow-panel-title">
            <div>
              <span>Policy chain</span>
              <h2>Every gate before value moved</h2>
            </div>
            <ShieldCheck size={21} />
          </div>
          <div className="proof-chain-list">
            {policyChain.map((item, index) => {
              const Icon = item.icon
              return (
                <div className="proof-chain-step" key={item.label}>
                  <div className="proof-chain-icon"><Icon size={17} /></div>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.detail}</span>
                  </div>
                  <code>{String(index + 1).padStart(2, "0")}</code>
                  <em>{item.result}</em>
                </div>
              )
            })}
          </div>
        </section>

        <section className="proof-panel proof-artifacts">
          <div className="flow-panel-title">
            <div>
              <span>Artifacts</span>
              <h2>Offer, authorization, receipt and validation signatures</h2>
            </div>
            <FileCheck2 size={21} />
          </div>
          <div className="proof-artifact-grid">
            {artifacts.map((artifact) => (
              <div key={artifact.id}>
                <span>{artifact.type}</span>
                <strong>{shortHash(artifact.digest)}</strong>
                <code>{artifact.signature ?? "unsigned"}</code>
              </div>
            ))}
            <div>
              <span>validation</span>
              <strong>{shortHash(validation.evidenceHash)}</strong>
              <code>{validation.signature}</code>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

function shortHash(value: string) {
  return value.length > 16 ? `${value.slice(0, 8)}...${value.slice(-5)}` : value
}

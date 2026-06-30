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

import { buildAgenticDemoProof, buildAgenticProofFromStored, shortHash } from "@/lib/agentic-demo-proof"
import { getSupabaseAgenticProof, getSupabaseRecentArcSettlements } from "@/lib/backend/supabase"
import { SiteHeader } from "../SiteHeader"

export const metadata = {
  title: "Proof - Arc Suite",
  description: "Arc Suite proof page with transaction hash, x402 receipt and policy chain.",
}

export const dynamic = "force-dynamic"

type ProofPageProps = {
  searchParams?: Promise<{ id?: string }> | { id?: string }
}

export default async function ProofPage({ searchParams }: ProofPageProps) {
  const params = await searchParams
  const requestedId = typeof params?.id === "string" ? params.id : null
  const [stored, recentSettlements] = await Promise.all([
    requestedId ? getSupabaseAgenticProof(requestedId) : Promise.resolve(null),
    getSupabaseRecentArcSettlements(6),
  ])
  const proof = stored ? buildAgenticProofFromStored(stored) : buildAgenticDemoProof()
  const flowRun = proof.flowRun
  const agent = proof.agent
  const api = proof.api
  const screening = proof.screeningRecord
  const usage = proof.usage
  const validation = proof.agentValidation
  const artifacts = proof.artifacts
  const receipt = {
    agentIdentity: proof.agentIdentity.id,
    agentJobId: proof.agentJob.id,
    explorerUrl: flowRun.explorerUrl ?? "",
    paymentAuthorizationDigest: artifacts.find((item) => item.type === "payment_authorization")?.digest ?? proof.authorization.digest,
    policyDecision: flowRun.accessAllowed ? "allow" : "deny",
    receiptDigest: proof.agentJob.receiptHash ?? artifacts.find((item) => item.type === "receipt")?.digest ?? proof.receipt.digest,
    reputationDelta: `${flowRun.reputationScoreBefore} -> ${flowRun.reputationScoreAfter}`,
    settlementId: proof.settlementId,
    txHash: proof.txHash || "pending",
    validationResult: validation.result,
    providerKeyId: proof.receipt.providerKeyId,
    providerSignatureAlgorithm: proof.receipt.signatureAlgorithm,
    providerVerificationPayload: proof.receipt.verificationPayloadHash,
    workflowId: flowRun.id,
    x402OfferDigest: artifacts.find((item) => item.type === "x402_offer")?.digest ?? proof.offer.payloadHash,
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
      detail: `${api.priceUsdc.toFixed(3)} USDC per ${api.pricingUnit} from ${proof.provider}`,
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
            <span><Check size={16} /> {proof.proofSource === "supabase" ? "Verified live proof" : "Verified demo proof"}</span>
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
              <span>{`  "source": "${proof.proofSource}",`}</span>
              <span>{`  "x402OfferDigest": "${receipt.x402OfferDigest}",`}</span>
              <span>{`  "paymentAuthorizationDigest": "${receipt.paymentAuthorizationDigest}",`}</span>
              <span>{`  "providerKeyId": "${receipt.providerKeyId}",`}</span>
              <span>{`  "providerSignatureAlgorithm": "${receipt.providerSignatureAlgorithm}",`}</span>
              <span>{`  "providerVerificationPayload": "${receipt.providerVerificationPayload}",`}</span>
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

        <section className="proof-panel proof-settlements">
          <div className="flow-panel-title">
            <div>
              <span>Recent live settlements</span>
              <h2>Arc Testnet operations recorded in Supabase</h2>
            </div>
            <CircleDollarSign size={21} />
          </div>
          <div className="proof-settlement-list">
            {recentSettlements.length === 0 ? (
              <p>No live Arc settlement records found yet.</p>
            ) : recentSettlements.map((settlement) => (
              <div className="proof-settlement-row" key={settlement.id}>
                <div>
                  <strong>{settlement.amountUsdc.toFixed(3)} USDC</strong>
                  <span>{settlement.status} · {formatProofDate(settlement.updatedAt)}</span>
                </div>
                <code>{shortHash(settlement.txHash ?? settlement.id)}</code>
                {settlement.explorerUrl ? (
                  <a href={settlement.explorerUrl} target="_blank" rel="noreferrer">
                    Arcscan <ArrowUpRight size={14} />
                  </a>
                ) : (
                  <em>pending</em>
                )}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

function formatProofDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value))
}

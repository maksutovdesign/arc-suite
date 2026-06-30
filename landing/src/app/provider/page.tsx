import Link from "next/link"
import {
  ArrowUpRight,
  BadgeCheck,
  FileCheck2,
  KeyRound,
  ReceiptText,
  ShieldCheck,
  Store,
  Workflow,
} from "lucide-react"

import { buildAgenticDemoProof, buildAgenticProofFromStored, shortHash } from "@/lib/agentic-demo-proof"
import { getSupabaseRecentAgenticProofs } from "@/lib/backend/supabase"
import { EcosystemNav } from "../EcosystemNav"

export const metadata = {
  title: "Arc Provider — Receipt Trust Center",
  description: "Provider-facing x402 receipt registry, signing key status and fulfillment proof for Arc Suite.",
}

export const dynamic = "force-dynamic"

const integrations = [
  {
    icon: Store,
    text: "Providers can publish APIs and prove each paid request without a separate account system.",
    title: "Marketplace",
  },
  {
    icon: ReceiptText,
    text: "Usage, receipts and invoices can share the same receipt digest and settlement id.",
    title: "Billing",
  },
  {
    icon: FileCheck2,
    text: "External reviewers can verify the receipt, policy chain and transaction hash from one URL.",
    title: "Proof",
  },
]

export default async function ProviderPage() {
  const storedProofs = await getSupabaseRecentAgenticProofs(12)
  const proofs = storedProofs.length > 0
    ? storedProofs.map(buildAgenticProofFromStored)
    : [buildAgenticDemoProof()]
  const latest = proofs[0]
  const providerNames = new Set(proofs.map((proof) => proof.provider))
  const signedReceipts = proofs.filter((proof) => proof.receipt.signature).length
  const liveSettlements = proofs.filter((proof) => proof.txHash).length
  const totalUsdc = proofs.reduce((sum, proof) => sum + proof.flowRun.amountUsdc, 0)
  const providerKeys = Array.from(new Set(proofs.map((proof) => proof.receipt.providerKeyId)))

  return (
    <main>
      <EcosystemNav current="provider" />
      <section className="provider-shell">
        <div className="provider-hero">
          <div>
            <p className="kicker">Provider trust center</p>
            <h1>Prove that agent API calls were paid, signed and ready to fulfill.</h1>
            <p>
              Arc Provider closes the loop between Marketplace and Proof: API providers get
              a live receipt registry, signing-key surface, fulfillment evidence and direct
              links to every policy chain and Arc Testnet settlement.
            </p>
            <div className="radar-actions">
              <Link className="button primary" href="/proofs"><ReceiptText size={16} /> Open proof archive</Link>
              <Link className="button secondary" href="/agentic-workflow"><Workflow size={16} /> Run workflow</Link>
            </div>
          </div>

          <aside className="provider-verification-card" aria-label="Provider receipt verification">
            <div className="provider-card-top">
              <span>x402 provider receipt</span>
              <strong>{latest.receipt.verified ? "VERIFIED" : "PENDING"}</strong>
            </div>
            <div className="provider-receipt-main">
              <span>Latest paid API</span>
              <strong>{latest.apiName}</strong>
              <small>{latest.provider} · {latest.amount}</small>
            </div>
            <div className="provider-receipt-grid">
              <div><span>Provider key</span><strong>{latest.receipt.providerKeyId}</strong></div>
              <div><span>Algorithm</span><strong>{latest.receipt.signatureAlgorithm}</strong></div>
              <div><span>Receipt</span><strong>{shortHash(latest.agentJob.receiptHash ?? latest.receipt.digest)}</strong></div>
              <div><span>Tx hash</span><strong>{shortHash(latest.txHash)}</strong></div>
            </div>
            <Link href={`/proof?id=${encodeURIComponent(latest.workflowId)}`}>
              Open latest proof <ArrowUpRight size={15} />
            </Link>
          </aside>
        </div>

        <div className="provider-metrics" aria-label="Provider trust metrics">
          <article>
            <span>Providers paid</span>
            <strong>{providerNames.size}</strong>
            <small>Across recent agentic workflows</small>
          </article>
          <article>
            <span>Signed receipts</span>
            <strong>{signedReceipts}</strong>
            <small>x402-style provider receipts</small>
          </article>
          <article>
            <span>Live settlements</span>
            <strong>{liveSettlements}</strong>
            <small>With Arc Testnet tx hash</small>
          </article>
          <article>
            <span>Recorded value</span>
            <strong>{totalUsdc.toFixed(3)} USDC</strong>
            <small>In recent proof history</small>
          </article>
        </div>

        <section className="provider-section provider-split">
          <article className="provider-panel">
            <div className="private-panel-title">
              <div>
                <span>Signing keys</span>
                <h2>Provider keys visible before fulfillment.</h2>
              </div>
              <KeyRound size={22} />
            </div>
            <div className="provider-key-list">
              {providerKeys.map((keyId, index) => (
                <div key={keyId}>
                  <KeyRound size={17} />
                  <span>
                    <strong>{keyId}</strong>
                    <small>ed25519-provider-sim · rotation slot {String(index + 1).padStart(2, "0")}</small>
                  </span>
                  <em>active</em>
                </div>
              ))}
            </div>
          </article>

          <article className="provider-panel">
            <div className="private-panel-title">
              <div>
                <span>Fulfillment policy</span>
                <h2>Serve only after receipt verification.</h2>
              </div>
              <ShieldCheck size={22} />
            </div>
            <div className="provider-policy-list">
              {[
                ["Offer signed", "Marketplace price and terms are hashed before authorization."],
                ["Budget locked", "Treasury confirms that the agent can spend before fulfillment."],
                ["Receipt signed", "Provider signs the receipt payload and settlement reference."],
                ["Proof linked", "Provider can attach proof URL to logs, invoices and disputes."],
              ].map(([title, text]) => (
                <div key={title}>
                  <BadgeCheck size={17} />
                  <span><strong>{title}</strong><small>{text}</small></span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="provider-section provider-panel">
          <div className="private-panel-title">
            <div>
              <span>Receipt registry</span>
              <h2>Recent paid jobs providers can reconcile.</h2>
            </div>
            <FileCheck2 size={22} />
          </div>
          <div className="provider-receipt-table">
            <div className="provider-receipt-head">
              <span>API</span>
              <span>Provider</span>
              <span>Receipt</span>
              <span>Settlement</span>
              <span>Proof</span>
            </div>
            {proofs.map((proof) => (
              <div className="provider-receipt-row" key={proof.workflowId}>
                <div>
                  <strong>{proof.apiName}</strong>
                  <small>{proof.workflowId}</small>
                </div>
                <div>
                  <strong>{proof.provider}</strong>
                  <small>{proof.receipt.providerKeyId}</small>
                </div>
                <code>{shortHash(proof.agentJob.receiptHash ?? proof.receipt.digest)}</code>
                <div>
                  <strong>{proof.amount}</strong>
                  <small>{shortHash(proof.txHash)}</small>
                </div>
                <Link href={`/proof?id=${encodeURIComponent(proof.workflowId)}`}>
                  View <ArrowUpRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="provider-section provider-integration-grid">
          {integrations.map(({ icon: IconComponent, text, title }) => {
            return (
              <article key={title}>
                <IconComponent size={20} />
                <h3>Arc {title}</h3>
                <p>{text}</p>
              </article>
            )
          })}
        </section>
      </section>
    </main>
  )
}

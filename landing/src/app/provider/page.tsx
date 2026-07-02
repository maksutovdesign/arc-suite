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

import { getProviderTrustOverview } from "@/lib/backend/provider-service"
import { EcosystemNav } from "../EcosystemNav"
import { ProviderDemoRunButton } from "./ProviderDemoRunButton"

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
    text: "External reviewers can verify the receipt, policy chain and settlement reference from one URL.",
    title: "Proof",
  },
]

export default async function ProviderPage() {
  const overview = await getProviderTrustOverview(12)
  const latest = overview.receipts[0]

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
              links to every policy chain and Arc settlement reference.
            </p>
            <div className="radar-actions">
              <ProviderDemoRunButton />
              <Link className="button primary" href="/proofs"><ReceiptText size={16} /> Open proof archive</Link>
              <Link className="button secondary" href="/agentic-workflow"><Workflow size={16} /> Run workflow</Link>
            </div>
          </div>

          <aside className="provider-verification-card" aria-label="Provider receipt verification">
            <div className="provider-card-top">
              <span>x402 provider receipt</span>
              <strong>{latest.verified ? "VERIFIED" : "PENDING"}</strong>
            </div>
            <div className="provider-receipt-main">
              <span>Latest paid API</span>
              <strong>{latest.apiName}</strong>
              <small>{latest.provider} · {latest.amount}</small>
            </div>
            <div className="provider-receipt-grid">
              <div><span>Provider key</span><strong>{latest.providerKeyId}</strong></div>
              <div><span>Algorithm</span><strong>{latest.signatureAlgorithm}</strong></div>
              <div><span>Receipt</span><strong>{latest.shortReceiptDigest}</strong></div>
              <div><span>Settlement ref</span><strong>{latest.shortTxHash}</strong></div>
            </div>
            <Link href={latest.proofUrl}>
              Open latest proof <ArrowUpRight size={15} />
            </Link>
          </aside>
        </div>

        <div className="provider-metrics" aria-label="Provider trust metrics">
          <article>
            <span>Providers paid</span>
            <strong>{overview.metrics.providersPaid}</strong>
            <small>Across recent agentic workflows</small>
          </article>
          <article>
            <span>Signed receipts</span>
            <strong>{overview.metrics.signedReceipts}</strong>
            <small>x402-style provider receipts</small>
          </article>
          <article>
            <span>Settlement proofs</span>
            <strong>{overview.metrics.verifiedSettlements}</strong>
            <small>With Arcscan tx when configured</small>
          </article>
          <article>
            <span>Recorded value</span>
            <strong>{overview.metrics.recordedValueUsdc.toFixed(3)} USDC</strong>
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
              {overview.keys.map((key) => (
                <div key={key.keyId}>
                  <KeyRound size={17} />
                  <span>
                    <strong>{key.keyId}</strong>
                    <small>{key.algorithm} · rotation slot {key.rotationSlot} · {key.receipts} receipts</small>
                  </span>
                  <em>{key.status}</em>
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
              {overview.policies.map((policy) => (
                <div key={policy.key}>
                  <BadgeCheck size={17} />
                  <span><strong>{policy.title}</strong><small>{policy.description}</small></span>
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
            {overview.receipts.map((receipt) => (
              <div className="provider-receipt-row" key={receipt.workflowId}>
                <div>
                  <strong>{receipt.apiName}</strong>
                  <small>{receipt.workflowId}</small>
                </div>
                <div>
                  <strong>{receipt.provider}</strong>
                  <small>{receipt.providerKeyId}</small>
                </div>
                <code>{receipt.shortReceiptDigest}</code>
                <div>
                  <strong>{receipt.amount}</strong>
                  <small>{receipt.shortTxHash}</small>
                </div>
                <Link href={receipt.proofUrl}>
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

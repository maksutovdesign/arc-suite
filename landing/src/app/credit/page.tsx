import Link from "next/link"
import {
  ArrowUpRight,
  BadgeCheck,
  FileCheck2,
  Handshake,
  Landmark,
  ReceiptText,
  Scale,
  ShieldCheck,
  Workflow,
} from "lucide-react"
import { EcosystemNav } from "../EcosystemNav"

export const metadata = {
  title: "Arc Credit - Private Credit Lifecycle",
  description: "Private credit and RWA lifecycle controls for Arc-native agent finance.",
}

const lifecycle = [
  ["01", "Deal intake", "Borrower, lender, facility size and repayment intent are normalized into one Arc Suite envelope."],
  ["02", "KYB/KYT gates", "Shield records risk checks before funds or repayment schedules can move forward."],
  ["03", "Escrow schedule", "Escrow models milestone funding, repayment windows, release and dispute outcomes."],
  ["04", "Memo-backed payment", "Transaction memo references keep invoice, borrower and repayment context attached to settlement evidence."],
  ["05", "Proof trail", "Proof links policy, receipt, validation and execution state for reviewer and operator audit."],
] as const

const integrations = [
  { title: "Shield", body: "Risk gates and continuous monitoring for borrower, lender and collateral addresses.", icon: ShieldCheck },
  { title: "Escrow", body: "Milestone and repayment state machine for release, refund and dispute flows.", icon: Handshake },
  { title: "Proof", body: "Receipt, validation, memo reference and transaction evidence in one trail.", icon: FileCheck2 },
  { title: "Treasury", body: "Budget caps, wallet balances and settlement readiness for credit operations.", icon: Landmark },
  { title: "Flow", body: "Policy orchestration before execution and review if artifacts are missing.", icon: Workflow },
  { title: "Billing", body: "Servicing fees, invoices and recurring repayment references.", icon: ReceiptText },
] as const

const riskGates = [
  ["Borrower KYB", "Entity, wallet and repayment context are captured before offer approval."],
  ["KYT monitoring", "Address risk changes can move a credit job from approved to review."],
  ["Artifact gating", "Missing receipt or validation evidence blocks settlement and opens review."],
] as const

export default function CreditPage() {
  return (
    <main>
      <EcosystemNav current="credit" />
      <section className="provider-shell">
        <div className="provider-hero">
          <div>
            <p className="kicker">Private credit & RWA lifecycle</p>
            <h1>Policy-gated credit workflows for Arc-native settlement.</h1>
            <p>
              Arc Credit turns private-credit operations into auditable Arc Suite workflows:
              intake, KYB/KYT review, escrowed milestones, memo-backed repayment references
              and proof-linked reporting before value moves.
            </p>
            <div className="radar-actions">
              <Link className="button primary" href="/escrow">
                <Handshake size={16} /> Open escrow layer
              </Link>
              <Link className="button secondary" href="/proof">
                <FileCheck2 size={16} /> View proof trail
              </Link>
            </div>
          </div>
          <aside className="provider-verification-card" aria-label="Arc Credit deal envelope">
            <div className="provider-card-top">
              <span>Arc Credit / deal envelope</span>
              <strong>REVIEW-GATED</strong>
            </div>
            <div className="provider-receipt-main">
              <span>Credit facility</span>
              <strong>RWA-ARC-2048</strong>
              <small>
                Borrower, lender, repayment schedule and policy state stay attached to one proof envelope.
              </small>
            </div>
            <div className="provider-receipt-grid">
              <div><span>KYB/KYT</span><strong>Pass</strong></div>
              <div><span>Escrow</span><strong>Funded</strong></div>
              <div><span>Memo ref</span><strong>INV-2048</strong></div>
              <div><span>Status</span><strong>Review</strong></div>
            </div>
            <Link href="/shield">
              Inspect risk policy <ArrowUpRight size={15} />
            </Link>
          </aside>
        </div>

        <div className="provider-metrics" aria-label="Arc Credit metrics">
          <article><span>Lifecycle stages</span><strong>5</strong><small>Intake to proof trail</small></article>
          <article><span>Risk gates</span><strong>3</strong><small>KYB, KYT and artifact checks</small></article>
          <article><span>Settlement mode</span><strong>Review</strong><small>Fail closed until evidence is complete</small></article>
          <article><span>Memo references</span><strong>1:1</strong><small>Repayment context maps to proof</small></article>
        </div>

        <section className="provider-section provider-panel">
          <div className="private-panel-title">
            <div>
              <span>Credit lifecycle</span>
              <h2>Private credit work becomes structured agent jobs.</h2>
            </div>
            <Scale size={22} />
          </div>
          <div className="grant-reviewer-grid">
            {lifecycle.map(([index, title, detail]) => (
              <div key={title}>
                <i>{index}</i>
                <strong>{title}</strong>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="provider-section provider-split">
          <article className="provider-panel">
            <div className="private-panel-title">
              <div>
                <span>Controls</span>
                <h2>Fail closed when risk or artifacts change.</h2>
              </div>
              <ShieldCheck size={22} />
            </div>
            <div className="provider-policy-list">
              {riskGates.map(([title, detail]) => (
                <div key={title}>
                  <BadgeCheck size={17} />
                  <span><strong>{title}</strong><small>{detail}</small></span>
                </div>
              ))}
            </div>
          </article>

          <article className="provider-panel">
            <div className="private-panel-title">
              <div>
                <span>Reconciliation</span>
                <h2>Every repayment can carry business context.</h2>
              </div>
              <ReceiptText size={22} />
            </div>
            <div className="provider-key-list">
              <div><ReceiptText size={17} /><span><strong>Transaction memo</strong><small>Invoice, borrower, facility and repayment window are attached as structured context.</small></span><em>ready</em></div>
              <div><FileCheck2 size={17} /><span><strong>Proof trail</strong><small>Policy, receipt and validation references stay reviewable after execution.</small></span><em>linked</em></div>
              <div><Workflow size={17} /><span><strong>Review queue</strong><small>Missing artifacts pause the job instead of settling silently.</small></span><em>gated</em></div>
            </div>
          </article>
        </section>

        <section className="provider-section provider-integration-grid">
          {integrations.map(({ icon: IconComponent, body, title }) => (
            <article key={title}>
              <IconComponent size={20} />
              <h3>Arc {title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  )
}

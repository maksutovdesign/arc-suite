"use client"

import { ArrowUpRight, BadgeCheck, CircleDollarSign, FileCheck2, ReceiptText, Route, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"

type LatestAgenticProof = {
  apiName: string
  generatedAt: string
  explorerUrl: string | null
  proofSource: string
  proofUrl: string
  provider: string
  receiptDigest: string
  txHash: string | null
  workflowId: string
}

type MoneyProof = {
  id?: string
  operation: string
  state: string
  traceId: string
  recordedAt: string
  txHashes: string[]
  explorerUrls: string[]
  policy?: { decision?: string; provider?: string; reason?: string }
  feeBreakdown?: { kestrelRevenueUsdc: number; totalFeeUsdc: number; destinationAmountUsdc: number }
}

export function ProofCenterClient() {
  const [moneyProof, setMoneyProof] = useState<MoneyProof | null>(null)
  const [agenticProof, setAgenticProof] = useState<LatestAgenticProof | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem("kestrel:last-money-proof")
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as MoneyProof
        queueMicrotask(() => setMoneyProof(parsed))
      } catch { /* Ignore invalid local proof. */ }
    }
    void fetch("/api/agentic/latest-proof", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<LatestAgenticProof> : null)
      .then((proof) => { if (proof) setAgenticProof(proof) })
  }, [])

  return (
    <section className="control-shell proof-center-shell">
      <header className="control-hero">
        <div>
          <p className="kicker">Unified proof center</p>
          <h1>One operation. One evidence envelope.</h1>
          <p>Every Kestrel execution can be reviewed as a chain of intent, policy, fees, provider receipt and final settlement instead of a disconnected transaction hash.</p>
        </div>
        <div className="control-readiness">
          <FileCheck2 size={20} />
          <span><strong>{moneyProof || agenticProof ? "Evidence available" : "Waiting for first operation"}</strong><small>Fail-closed: no settlement claim without recorded evidence</small></span>
        </div>
      </header>

      <section className="proof-chain" aria-label="Proof envelope stages">
        <ProofStage icon={BadgeCheck} label="Intent" state={moneyProof ? "recorded" : "waiting"} detail={moneyProof ? `${moneyProof.operation} · ${short(moneyProof.traceId)}` : "Wallet-signed operation"} />
        <ProofStage icon={ShieldCheck} label="Policy" state={moneyProof?.policy?.decision ?? "waiting"} detail={moneyProof?.policy?.provider ?? "Treasury + compliance"} />
        <ProofStage icon={CircleDollarSign} label="Fees" state={moneyProof?.feeBreakdown ? "disclosed" : "waiting"} detail={moneyProof?.feeBreakdown ? `${moneyProof.feeBreakdown.totalFeeUsdc} USDC total` : "Kestrel + Arc + provider"} />
        <ProofStage icon={ReceiptText} label="Receipt" state={agenticProof ? "signed" : "waiting"} detail={agenticProof ? short(agenticProof.receiptDigest) : "Provider response digest"} />
        <ProofStage icon={Route} label="Settlement" state={moneyProof?.txHashes.length || agenticProof?.txHash ? "recorded" : "pending"} detail={moneyProof?.txHashes[0] ? short(moneyProof.txHashes[0]) : agenticProof?.txHash ? short(agenticProof.txHash) : "No transaction claim"} />
      </section>

      <div className="proof-center-grid">
        <section className="control-panel">
          <div className="control-panel-head"><div><span>Latest money proof</span><h2>App Kit execution</h2></div><CircleDollarSign size={20} /></div>
          {moneyProof ? (
            <div className="proof-envelope">
              <div><span>Operation</span><strong>{moneyProof.operation}</strong></div>
              <div><span>State</span><strong>{moneyProof.state}</strong></div>
              <div><span>Trace</span><strong>{short(moneyProof.traceId)}</strong></div>
              <div><span>Kestrel revenue</span><strong>{moneyProof.feeBreakdown?.kestrelRevenueUsdc ?? 0} USDC</strong></div>
              <div><span>Destination amount</span><strong>{moneyProof.feeBreakdown?.destinationAmountUsdc ?? "pending"}</strong></div>
              <div><span>Transactions</span><strong>{moneyProof.txHashes.length}</strong></div>
              {moneyProof.explorerUrls.map((url) => <a href={url} key={url} rel="noreferrer" target="_blank">Open explorer <ArrowUpRight size={13} /></a>)}
            </div>
          ) : (
            <EmptyProof body="Complete a Money Movement operation to store its signed policy, fee ledger and App Kit result in this browser." href="/money" label="Open Money Movement" />
          )}
        </section>

        <section className="control-panel">
          <div className="control-panel-head"><div><span>Latest workflow proof</span><h2>x402 provider execution</h2></div><ReceiptText size={20} /></div>
          {agenticProof ? (
            <div className="proof-envelope">
              <div><span>Workflow</span><strong>{agenticProof.workflowId}</strong></div>
              <div><span>API</span><strong>{agenticProof.apiName}</strong></div>
              <div><span>Provider</span><strong>{agenticProof.provider}</strong></div>
              <div><span>Receipt</span><strong>{short(agenticProof.receiptDigest)}</strong></div>
              <div><span>Source</span><strong>{agenticProof.proofSource}</strong></div>
              <div><span>Transaction</span><strong>{agenticProof.txHash ? short(agenticProof.txHash) : "pending"}</strong></div>
              <a href={agenticProof.proofUrl}>Open full proof <ArrowUpRight size={13} /></a>
              {agenticProof.explorerUrl && <a href={agenticProof.explorerUrl} rel="noreferrer" target="_blank">Open Arcscan <ArrowUpRight size={13} /></a>}
            </div>
          ) : (
            <EmptyProof body="Run the agentic workflow to create an x402 offer, policy decision, provider receipt and settlement record." href="/agentic-workflow" label="Run workflow" />
          )}
        </section>
      </div>

      <section className="control-panel proof-integrity">
        <div className="control-panel-head"><div><span>Integrity rules</span><h2>What Kestrel refuses to overstate</h2></div><ShieldCheck size={20} /></div>
        <div>
          <p><strong>No hash, no settlement claim.</strong><span>Submitted and confirmed remain separate terminal states.</span></p>
          <p><strong>No policy grant, no server execution.</strong><span>The signer accepts only an unexpired HMAC-bound authorization.</span></p>
          <p><strong>No hidden fee.</strong><span>Kestrel, Arc, Gateway, provider, forwarding and gas deductions stay distinct.</span></p>
        </div>
      </section>
    </section>
  )
}

function ProofStage({ icon: Icon, label, state, detail }: { icon: typeof BadgeCheck; label: string; state: string; detail: string }) {
  return <article><Icon size={18} /><span>{label}</span><strong>{state}</strong><small>{detail}</small></article>
}

function EmptyProof({ body, href, label }: { body: string; href: string; label: string }) {
  return <div className="proof-center-empty"><FileCheck2 size={26} /><p>{body}</p><a href={href}>{label} <ArrowUpRight size={13} /></a></div>
}

function short(value: string) {
  return value.length > 18 ? `${value.slice(0, 9)}…${value.slice(-7)}` : value
}

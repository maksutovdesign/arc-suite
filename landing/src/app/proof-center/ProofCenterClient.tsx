"use client"

import { ArrowUpRight, BadgeCheck, CircleDollarSign, FileCheck2, ReceiptText, Route, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { downloadMoneyProof, type ExportableMoneyProof } from "@/lib/money-proof-export"

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

type MoneyProof = ExportableMoneyProof

export function ProofCenterClient() {
  const [moneyProof, setMoneyProof] = useState<MoneyProof | null>(null)
  const [agenticProof, setAgenticProof] = useState<LatestAgenticProof | null>(null)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("kestrel:last-money-proof")
      if (stored) {
        const parsed = JSON.parse(stored) as MoneyProof
        queueMicrotask(() => setMoneyProof(parsed))
      }
    } catch { /* Storage may be unavailable or the local record may be invalid. */ }
    void fetch("/api/agentic/latest-proof", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<LatestAgenticProof> : null)
      .then((proof) => { if (proof) setAgenticProof(proof) })
      .catch(() => undefined)
  }, [])

  return (
    <section className="control-shell proof-center-shell">
      <header className="control-hero">
        <div>
          <p className="kicker">Unified proof center</p>
          <h1>One operation. One evidence envelope.</h1>
          <p>Review money movement and provider workflows separately. A receipt from the latest workflow does not establish fulfillment for a different payment.</p>
        </div>
        <div className="control-readiness">
          <FileCheck2 size={20} />
          <span><strong>{moneyProof || agenticProof?.proofSource === "supabase" ? "Recorded evidence available" : agenticProof ? "Demo evidence only" : "Waiting for first operation"}</strong><small>Verify recorded transactions on their network</small></span>
        </div>
      </header>

      <section className="proof-chain" aria-label="Latest money movement evidence stages">
        <ProofStage icon={BadgeCheck} label="Intent" state={moneyProof ? "recorded" : "waiting"} detail={moneyProof ? `${moneyProof.operation} · ${short(moneyProof.traceId)}` : "Wallet-signed operation"} />
        <ProofStage icon={ShieldCheck} label="Policy" state={moneyProof?.policy?.decision ?? "waiting"} detail={moneyProof?.policy?.provider ?? "Treasury + compliance"} />
        <ProofStage icon={CircleDollarSign} label="Fees" state={moneyProof?.feeBreakdown ? "disclosed" : "waiting"} detail={moneyProof?.feeBreakdown ? `${moneyProof.feeBreakdown.totalFeeUsdc} USDC total` : "Kestrel + Arc + provider"} />
        <ProofStage icon={ReceiptText} label="Receipt" state="not linked" detail="No provider fulfillment receipt in this money record" />
        <ProofStage icon={Route} label="Settlement" state={moneyProof?.txHashes.length ? "recorded" : "pending"} detail={moneyProof?.txHashes[0] ? short(moneyProof.txHashes[0]) : "No transaction claim"} />
      </section>

      <div className="proof-center-grid">
        <section className="control-panel">
          <div className="control-panel-head"><div><span>Latest money proof</span><h2>App Kit execution</h2></div><CircleDollarSign size={20} /></div>
          {moneyProof ? (
            <div className="proof-envelope">
              <div><span>Operation</span><strong>{moneyProof.operation}</strong></div>
              <div><span>State</span><strong>{moneyProof.state}</strong></div>
              <div><span>Trace</span><strong>{short(moneyProof.traceId)}</strong></div>
              <div><span>Source network</span><strong>{moneyProof.networks ? `${moneyProof.networks.source.chain} · ${moneyProof.networks.source.chainId}` : "Not recorded in this proof"}</strong></div>
              <div><span>Destination network</span><strong>{moneyProof.networks ? `${moneyProof.networks.destination.chain} · ${moneyProof.networks.destination.chainId}` : "Not recorded in this proof"}</strong></div>
              <div><span>Estimated Kestrel fee</span><strong>{moneyProof.feeBreakdown?.kestrelRevenueUsdc ?? 0} USDC</strong></div>
              <div><span>Destination amount</span><strong>{moneyProof.feeBreakdown?.destinationAmountUsdc ?? "pending"}</strong></div>
              <div><span>Transactions</span><strong>{moneyProof.txHashes.length}</strong></div>
              {moneyProof.explorerUrls.map((url) => <a href={url} key={url} rel="noreferrer" target="_blank">Open explorer <ArrowUpRight size={13} /></a>)}
              <button className="button secondary" type="button" onClick={() => downloadMoneyProof(moneyProof)}>Download proof JSON</button>
              <p>Stored in this browser only. The JSON export includes public addresses; verify its transaction on the recorded network before sharing it as settlement evidence.</p>
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
              <div><span>Transaction</span><strong>{agenticProof.proofSource === "demo" ? "Demo reference — not a verified transaction" : agenticProof.txHash ? short(agenticProof.txHash) : "pending"}</strong></div>
              <a href={agenticProof.proofUrl}>Open full proof <ArrowUpRight size={13} /></a>
              {agenticProof.proofSource !== "demo" && agenticProof.explorerUrl && <a href={agenticProof.explorerUrl} rel="noreferrer" target="_blank">Open explorer <ArrowUpRight size={13} /></a>}
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

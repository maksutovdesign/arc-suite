"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { ArrowUpRight, Download, Search } from "lucide-react"
import type { ArcTransactionInspection } from "../../../../scripts/arc-send-verification.mjs"
import styles from "./verifier.module.css"

const checkLabels: Record<string, string> = {
  transactionHash: "Same transaction hash",
  transactionChain: "Arc mainnet chain ID",
  receiptSucceeded: "Successful receipt",
  sender: "Matching sender",
  receiptTarget: "Matching receipt target",
  directSendRoute: "Direct USDC transfer",
  includedInCanonicalBlock: "Canonical block inclusion",
  exactUsdcTransfer: "Exact system transfer event",
}
const statusLabels = {
  confirmed_send: "Direct transfer confirmed",
  pending_or_not_found: "Pending or not found",
  unsupported_transfer: "Outside this verifier’s scope",
  verification_failed: "Transfer checks did not pass",
}

export function ArcVerifier({ exampleHash }: { exampleHash?: string }) {
  const [hash, setHash] = useState("")
  const [report, setReport] = useState<ArcTransactionInspection | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const currentRequest = useRef<AbortController | null>(null)
  useEffect(() => () => currentRequest.current?.abort(), [])

  function changeHash(value: string) {
    currentRequest.current?.abort()
    currentRequest.current = null
    setHash(value); setReport(null); setError(""); setBusy(false)
  }
  async function verify(value: string) {
    currentRequest.current?.abort()
    const controller = new AbortController()
    currentRequest.current = controller
    setReport(null); setError(""); setBusy(true)
    try {
      const response = await fetch(`/api/verify/arc?tx=${encodeURIComponent(value.trim())}`, { cache: "no-store", signal: controller.signal })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? "Verification is unavailable. Please try again later.")
      if (currentRequest.current === controller) setReport(data)
    } catch (e) {
      if (currentRequest.current === controller && !controller.signal.aborted) setError(e instanceof Error ? e.message : "Verification is unavailable.")
    } finally {
      if (currentRequest.current === controller) setBusy(false)
    }
  }
  function submit(event: FormEvent) { event.preventDefault(); void verify(hash) }
  function download() {
    if (!report) return
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2) + "\n"], { type: "application/json" }))
    const link = document.createElement("a")
    link.href = url; link.download = `arc-verification-${report.transactionHash}.json`; link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.formHeading}><span>01 / Inspect a transaction</span><Search size={19} aria-hidden="true" /></div>
        <label htmlFor="arc-tx-hash">Arc mainnet transaction hash</label>
        <div className={styles.inputRow}>
          <input id="arc-tx-hash" name="tx" value={hash} onChange={(event) => changeHash(event.target.value)} placeholder="0x…" maxLength={66} required pattern="0x[0-9a-fA-F]{64}" spellCheck={false} autoComplete="off" aria-describedby="arc-tx-help" />
          <button type="submit" disabled={busy}>{busy ? "Checking…" : "Verify transfer"}<ArrowUpRight size={17} aria-hidden="true" /></button>
        </div>
        <p id="arc-tx-help" className={styles.help}>Uses public chain data from the Arc RPC endpoints listed in its documentation. Your hash is sent to this verifier and the RPC; no wallet access is requested.</p>
        {exampleHash && <div className={styles.example}><button type="button" disabled={busy} onClick={() => { changeHash(exampleHash); void verify(exampleHash) }}>Verify public example <ArrowUpRight size={14} aria-hidden="true" /></button><span>An existing third-party transfer, not a Kestrel payment.</span></div>}
      </form>
      <div aria-live="polite" aria-atomic="true">
        {busy && <p className={styles.notice}>Reading the transaction, receipt and canonical block from Arc mainnet…</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
      {report && <section className={styles.result} aria-label="Verification result">
        <div className={styles.resultHeading}><div><p className={styles.kicker}>02 / RPC observation</p><h2>{statusLabels[report.status]}</h2><span>Checked {new Date(report.checkedAt).toLocaleString()} · Arc mainnet 5042</span></div><span className={report.verified ? styles.confirmed : styles.unconfirmed}>{report.verified ? "Confirmed" : "Unverified"}</span></div>
        <a className={styles.hashLink} href={report.explorerUrl} target="_blank" rel="noreferrer"><code>{report.transactionHash}</code><ArrowUpRight size={16} aria-hidden="true" /></a>
        {report.status === "pending_or_not_found" && <p className={styles.notice}>RPC did not return both a transaction and a receipt. It may be pending, unavailable or unknown on this network. No transfer is confirmed.</p>}
        {report.status === "unsupported_transfer" && <p className={styles.notice}>This tool supports direct native USDC sends and the USDC ERC-20 transfer method between distinct, nonzero addresses. Contract workflows, self-transfers and other tokens are outside its scope.</p>}
        {report.transfer && <>
          <dl className={styles.facts}>
            <div><dt>Transfer amount</dt><dd>{report.transfer.amountUsdc} <small>USDC</small></dd></div>
            <div><dt>Gas paid separately</dt><dd>{report.observation?.actualGasUsdc ?? "Unavailable"} <small>{report.observation?.actualGasUsdc ? "USDC" : ""}</small></dd></div>
            <div><dt>Sender</dt><dd><code>{report.transfer.sender}</code></dd></div>
            <div><dt>Recipient</dt><dd><code>{report.transfer.recipient}</code></dd></div>
            <div><dt>Route</dt><dd>{report.observation?.route === "native" ? "Native USDC" : report.observation?.route === "erc20" ? "ERC-20 USDC" : "Unsupported"}</dd></div>
            <div><dt>Block</dt><dd>{report.observation?.blockNumber ?? "Unavailable"}</dd></div>
          </dl>
          <div className={styles.checks}>{Object.entries(report.checks).map(([key, passed]) => <div key={key}><span>{checkLabels[key] ?? key}</span><strong className={passed ? styles.pass : styles.fail}>{passed ? "Passed" : "Failed"}</strong></div>)}</div>
        </>}
        <p className={styles.limit}>RPC source: <a href="https://docs.arc.io/arc/references/connect-to-arc" target="_blank" rel="noreferrer">{report.rpcUrl}</a><br />{report.limitations}</p>
        <button className={styles.download} type="button" onClick={download}><Download size={16} aria-hidden="true" />Download observation JSON</button>
      </section>}
    </div>
  )
}

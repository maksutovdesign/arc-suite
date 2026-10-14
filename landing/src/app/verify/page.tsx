import { SiteHeader } from "../SiteHeader"
import { ArcVerifier } from "./ArcVerifier"
import styles from "./verifier.module.css"

export const metadata = {
  title: "Arc Mainnet USDC Verifier — Kestrel",
  description: "Inspect a direct USDC transfer on Arc mainnet using its transaction, receipt and canonical block. No wallet or payment required.",
}

export default function VerifyPage() {
  return (
    <main>
      <SiteHeader idPrefix="verifier-brand" showDemo={false} links={[{ href: "/verify", label: "Verifier" }, { href: "/grant", label: "Project" }, { href: "https://github.com/maksutovdesign/arc-suite", label: "Source" }]} />
      <section className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.kicker}>Kestrel / developer tools</p>
          <h1>Check the transfer.<br /><span>Know what it proves.</span></h1>
          <p>Inspect a direct USDC transfer on Arc mainnet. Check the transaction, receipt and block against the same hash — without connecting a wallet.</p>
          <div className={styles.tags}><span><i />Arc mainnet · 5042</span><span>Read-only RPC</span><span>No payment required</span></div>
        </header>
        <ArcVerifier exampleHash="0x53d435334ec0422c11865e9e6bc4f413cfdcb03aefcb2ce718ebce2bb556349d" />
        <section className={styles.scope} aria-label="Verification scope">
          <div><p className={styles.kicker}>What we check</p><h2>Transfer facts, together.</h2><p>Direct native USDC or ERC-20 transfer, receipt success, sender, recipient, exact amount and inclusion in the canonical block returned by RPC. Gas is shown separately. The parallel USDC logs are never added twice.</p></div>
          <div><p className={styles.kicker}>What remains unverified</p><h2>A payment is one part.</h2><p>This does not prove wallet ownership, an independently supplied spending intent, Kestrel origin, policy approval, API fulfillment or revenue. A single RPC observation is not an independent consensus proof.</p></div>
        </section>
        <footer className={styles.footer}><span>Built on Arc. Open source.</span><a href="https://docs.arc.io/arc/references/usdc-system-events" target="_blank" rel="noreferrer">USDC system events ↗</a><a href="https://github.com/maksutovdesign/arc-suite/blob/main/docs/public-arc-verifier.md" target="_blank" rel="noreferrer">Method and limits ↗</a></footer>
      </section>
    </main>
  )
}

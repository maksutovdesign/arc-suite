import Link from "next/link"

import { BrandMark } from "../BrandMark"
import { EcosystemNav } from "../EcosystemNav"
import { RadarClient } from "./RadarClient"

export const metadata = {
  title: "Arc Radar - Builder Intelligence",
  description: "Ecosystem intelligence map for Arc builders, primitives, traction and opportunity gaps.",
}

export default function RadarPage() {
  return (
    <main>
      <EcosystemNav current="radar" />
      <nav className="nav">
        <Link className="brand" href="/" aria-label="Arc Suite home">
          <BrandMark idPrefix="radar-brand" />
          <span className="brand-name">Arc Suite</span>
        </Link>
        <div className="nav-cluster">
          <div className="nav-links" aria-label="Radar navigation">
            <Link href="/">Product</Link>
            <Link href="/flow">Flow</Link>
            <Link href="/shield">Shield</Link>
            <Link href="/billing">Billing</Link>
            <Link href="/escrow">Escrow</Link>
            <Link href="/wallets">Wallet OS</Link>
            <Link href="/executions">Executions</Link>
            <Link href="/investors">Investors</Link>
          </div>
        </div>
      </nav>
      <RadarClient />
    </main>
  )
}

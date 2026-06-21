import Link from "next/link"

import { BrandMark } from "../BrandMark"
import { OpsHealthClient } from "./OpsHealthClient"

export const metadata = {
  title: "Ops Health — Arc Suite",
}

export default function OpsHealthPage() {
  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/" aria-label="Arc Suite home">
          <BrandMark idPrefix="ops-brand" />
          <span className="brand-name">Arc Suite</span>
        </Link>
        <div className="nav-cluster">
          <div className="nav-links" aria-label="Ops navigation">
            <Link href="/">Product</Link>
            <Link href="/investors">Investors</Link>
            <Link href="/analytics">Analytics</Link>
            <Link href="/billing">Billing</Link>
            <Link href="/shield">Shield</Link>
            <Link href="/flow">Flow</Link>
            <a href="https://treasury-umber.vercel.app/demo">Demo</a>
          </div>
        </div>
      </nav>

      <OpsHealthClient />
    </main>
  )
}

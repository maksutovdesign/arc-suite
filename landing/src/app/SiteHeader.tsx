import Link from "next/link"

import { BrandMark } from "./BrandMark"

const liveDemoUrl = "https://treasury-umber.vercel.app/demo"

export function SiteHeader({ idPrefix = "site-header" }: { idPrefix?: string }) {
  return (
    <nav className="nav">
      <Link className="brand" href="/" aria-label="Arc Suite home">
        <BrandMark idPrefix={idPrefix} />
        <span className="brand-name">Arc Suite</span>
      </Link>
      <div className="nav-cluster">
        <div className="nav-links" aria-label="Primary navigation">
          <Link href="/">Product</Link>
          <Link href="/#loop">Loop</Link>
          <Link href="/proof">Proof</Link>
          <Link href="/investors">Investors</Link>
        </div>
        <a className="nav-demo" href={liveDemoUrl} target="_blank" rel="noreferrer">
          Demo
        </a>
      </div>
    </nav>
  )
}

"use client"

import Link from "next/link"

import { BrandMark } from "./BrandMark"

const liveDemoUrl = "https://treasury-umber.vercel.app/demo"

export type SiteHeaderVariant = "marketing" | "review" | "console"

export type SiteHeaderLink = {
  href: string
  label: string
  onClick?: () => void
}

const variantLinks: Record<SiteHeaderVariant, SiteHeaderLink[]> = {
  marketing: [
    { href: "#system", label: "Product" },
    { href: "#loop", label: "Loop" },
    { href: "/proofs", label: "Proof" },
    { href: "/grant", label: "Grant" },
    { href: "/investors", label: "Investors" },
  ],
  review: [
    { href: "/", label: "Product" },
    { href: "/grant", label: "Grant" },
    { href: "/investors#roadmap", label: "Roadmap" },
    { href: "/investors#ask", label: "Funding ask" },
    { href: "/analytics", label: "Analytics" },
    { href: "/ops", label: "Ops" },
  ],
  console: [
    { href: "/", label: "Product" },
    { href: "/wallets", label: "Wallet OS" },
    { href: "/gas", label: "Gas" },
    { href: "/escrow", label: "Escrow" },
    { href: "/billing", label: "Billing" },
    { href: "/ops", label: "Ops Health" },
  ],
}

type SiteHeaderProps = {
  ariaLabel?: string
  demoHref?: string
  idPrefix?: string
  links?: SiteHeaderLink[]
  onDemoClick?: () => void
  showDemo?: boolean
  variant?: SiteHeaderVariant
}

export function SiteHeader({
  ariaLabel = "Primary navigation",
  demoHref = liveDemoUrl,
  idPrefix = "site-header",
  links,
  onDemoClick,
  showDemo = true,
  variant = "review",
}: SiteHeaderProps) {
  const navLinks = links ?? variantLinks[variant]

  return (
    <nav className={`nav nav-${variant}`}>
      <Link className="brand" href="/" aria-label="Arc Suite home">
        <BrandMark idPrefix={idPrefix} />
        <span className="brand-name">Arc Suite</span>
      </Link>
      <div className="nav-cluster">
        <div className="nav-links" aria-label={ariaLabel}>
          {navLinks.map((link) => (
            <SiteHeaderLinkItem link={link} key={`${link.href}-${link.label}`} />
          ))}
        </div>
        <details className="nav-mobile-menu">
          <summary>Menu</summary>
          <div className="nav-menu-panel" aria-label={ariaLabel}>
            {navLinks.map((link) => (
              <SiteHeaderLinkItem link={link} key={`${link.href}-${link.label}`} />
            ))}
          </div>
        </details>
        {showDemo && (
          <a className="nav-demo" href={demoHref} onClick={onDemoClick} target="_blank" rel="noreferrer">
            Demo
          </a>
        )}
      </div>
    </nav>
  )
}

function SiteHeaderLinkItem({ link }: { link: SiteHeaderLink }) {
  const isAnchor = link.href.startsWith("#")
  const isExternal = link.href.startsWith("http")

  if (isAnchor || isExternal) {
    return (
      <a href={link.href} onClick={link.onClick} rel={isExternal ? "noreferrer" : undefined} target={isExternal ? "_blank" : undefined}>
        {link.label}
      </a>
    )
  }

  return (
    <Link href={link.href} onClick={link.onClick}>
      {link.label}
    </Link>
  )
}

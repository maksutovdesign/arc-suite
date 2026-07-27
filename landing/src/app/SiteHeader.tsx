"use client"

import Link from "next/link"

import { BrandMark } from "./BrandMark"

const liveDemoUrl = "/treasury"

export type SiteHeaderVariant = "marketing" | "review" | "console"

export type SiteHeaderLink = {
  href: string
  label: string
  onClick?: () => void
}

const variantLinks: Record<SiteHeaderVariant, SiteHeaderLink[]> = {
  marketing: [
    { href: "#system", label: "Product" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/proof-center", label: "Proof" },
    { href: "/pilots", label: "Pilots" },
    { href: "/grant", label: "Grant" },
  ],
  review: [
    { href: "/", label: "Product" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/proof-center", label: "Proof" },
    { href: "/grant-evidence", label: "Evidence" },
    { href: "/grant", label: "Grant" },
  ],
  console: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/money", label: "Money" },
    { href: "/proof-center", label: "Proof" },
    { href: "/pilots", label: "Pilots" },
    { href: "/grant-evidence", label: "Evidence" },
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
      <Link className="brand" href="/" aria-label="Kestrel home">
        <BrandMark idPrefix={idPrefix} />
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
          <a className="nav-demo" href={demoHref} onClick={onDemoClick}>
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

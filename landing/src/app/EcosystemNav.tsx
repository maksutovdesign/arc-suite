"use client"

import {
  BadgeCheck,
  Boxes,
  PanelLeftClose,
  PanelLeftOpen,
  Fuel,
  Handshake,
  Landmark,
  LockKeyhole,
  Radar,
  ReceiptText,
  ShieldCheck,
  Store,
  WalletCards,
  Workflow,
} from "lucide-react"
import { useState } from "react"
import type { CSSProperties } from "react"
import { BrandMark } from "./BrandMark"

export type ArcProductId =
  | "treasury"
  | "reputation"
  | "marketplace"
  | "flow"
  | "billing"
  | "escrow"
  | "shield"
  | "gas"
  | "wallets"
  | "radar"
  | "private"
  | "blueprints"

const isProduction = process.env.NODE_ENV === "production"
const suiteUrl = process.env.NEXT_PUBLIC_ARC_SUITE_URL ?? (
  isProduction ? "https://arcsuite-app.vercel.app" : "http://localhost:3100"
)

const products = [
  { id: "treasury", label: "Treasury", href: isProduction ? "https://treasury-umber.vercel.app" : "http://localhost:3001", color: "#5fbfff", icon: Landmark },
  { id: "reputation", label: "Reputation", href: isProduction ? "https://reputation-five.vercel.app" : "http://localhost:3002", color: "#a78bfa", icon: BadgeCheck },
  { id: "marketplace", label: "Marketplace", href: isProduction ? "https://marketplace-eosin-eight.vercel.app" : "http://localhost:3003", color: "#34d399", icon: Store },
  { id: "flow", label: "Flow", href: `${suiteUrl}/flow`, color: "#22d3ee", icon: Workflow },
  { id: "billing", label: "Billing", href: `${suiteUrl}/billing`, color: "#fbbf24", icon: ReceiptText },
  { id: "escrow", label: "Escrow", href: `${suiteUrl}/escrow`, color: "#fb7185", icon: Handshake },
  { id: "shield", label: "Shield", href: `${suiteUrl}/shield`, color: "#f59e0b", icon: ShieldCheck },
  { id: "gas", label: "Gas", href: `${suiteUrl}/gas`, color: "#38bdf8", icon: Fuel },
  { id: "wallets", label: "Wallet OS", href: `${suiteUrl}/wallets`, color: "#c084fc", icon: WalletCards },
  { id: "radar", label: "Radar", href: `${suiteUrl}/radar`, color: "#f472b6", icon: Radar },
  { id: "private", label: "Private", href: `${suiteUrl}/private`, color: "#2dd4bf", icon: LockKeyhole },
  { id: "blueprints", label: "Blueprints", href: `${suiteUrl}/blueprints`, color: "#60a5fa", icon: Boxes },
] satisfies Array<{
  id: ArcProductId
  label: string
  href: string
  color: string
  icon: typeof Landmark
}>

export function EcosystemNav({ current }: { current: ArcProductId }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside className={isCollapsed ? "ecosystem-nav is-collapsed" : "ecosystem-nav"} aria-label="Arc Suite products">
      <div className="ecosystem-nav-head">
        <a className="ecosystem-home" href={suiteUrl} title="Arc Suite">
          <BrandMark idPrefix="ecosystem-nav-brand" />
          <span>Arc Suite</span>
        </a>
        <button
          className="ecosystem-collapse"
          type="button"
          aria-label={isCollapsed ? "Expand services menu" : "Collapse services menu"}
          aria-pressed={isCollapsed}
          onClick={() => setIsCollapsed((value) => !value)}
        >
          {isCollapsed ? <PanelLeftOpen aria-hidden="true" size={17} /> : <PanelLeftClose aria-hidden="true" size={17} />}
        </button>
      </div>
      <div className="ecosystem-products">
        {products.map((product) => {
          const Icon = product.icon
          const isCurrent = current === product.id
          return (
            <a
              className={isCurrent ? "ecosystem-product is-current" : "ecosystem-product"}
              href={product.href}
              key={product.id}
              aria-current={isCurrent ? "page" : undefined}
              style={{ "--product-color": product.color } as CSSProperties}
              title={`Arc ${product.label}`}
            >
              <Icon aria-hidden="true" size={17} strokeWidth={1.9} />
              <span>{product.label}</span>
              {isCurrent && <i />}
            </a>
          )
        })}
      </div>
      <span className="ecosystem-network">Arc Testnet · USDC by Circle</span>
    </aside>
  )
}

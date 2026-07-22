"use client"

import {
  BadgeCheck,
  Boxes,
  Braces,
  CircleDollarSign,
  PanelLeftClose,
  PanelLeftOpen,
  Fuel,
  Handshake,
  Landmark,
  LockKeyhole,
  Network,
  Radar,
  ReceiptText,
  Scale,
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
  | "provider"
  | "flow"
  | "billing"
  | "escrow"
  | "credit"
  | "shield"
  | "gas"
  | "interop"
  | "wallets"
  | "radar"
  | "private"
  | "blueprints"
  | "money"

const isProduction = process.env.NODE_ENV === "production"
const suiteUrl = process.env.NEXT_PUBLIC_ARC_SUITE_URL ?? (
  isProduction ? "https://arcsuite-app.vercel.app" : "http://localhost:3000"
)

const products = [
  { id: "treasury", label: "Treasury", href: `${suiteUrl}/treasury`, color: "#5fbfff", icon: Landmark },
  { id: "reputation", label: "Reputation", href: `${suiteUrl}/reputation`, color: "#a78bfa", icon: BadgeCheck },
  { id: "marketplace", label: "Marketplace", href: `${suiteUrl}/marketplace`, color: "#34d399", icon: Store },
  { id: "money", label: "Money Movement", href: `${suiteUrl}/money`, color: "#7dd3fc", icon: CircleDollarSign },
  { id: "provider", label: "Provider", href: `${suiteUrl}/provider`, color: "#f472b6", icon: Braces },
  { id: "flow", label: "Flow", href: `${suiteUrl}/flow`, color: "#22d3ee", icon: Workflow },
  { id: "billing", label: "Billing", href: `${suiteUrl}/billing`, color: "#fbbf24", icon: ReceiptText },
  { id: "escrow", label: "Escrow", href: `${suiteUrl}/escrow`, color: "#fb7185", icon: Handshake },
  { id: "credit", label: "Credit", href: `${suiteUrl}/credit`, color: "#facc15", icon: Scale },
  { id: "shield", label: "Shield", href: `${suiteUrl}/shield`, color: "#f59e0b", icon: ShieldCheck },
  { id: "gas", label: "Gas", href: `${suiteUrl}/gas`, color: "#38bdf8", icon: Fuel },
  { id: "interop", label: "Interop", href: `${suiteUrl}/interop`, color: "#14b8a6", icon: Network },
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
    <aside className={isCollapsed ? "ecosystem-nav is-collapsed" : "ecosystem-nav"} aria-label="Kestrel products">
      <div className="ecosystem-nav-head">
        <a className="ecosystem-home" href={suiteUrl} title="Kestrel">
          <BrandMark idPrefix="ecosystem-nav-brand" />
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
              title={`Kestrel ${product.label}`}
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

import {
  BadgeCheck,
  Boxes,
  Braces,
  CircleDollarSign,
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
import { ArcSuiteLogo } from "./ArcSuiteLogo"

type ProductId =
  | "treasury"
  | "reputation"
  | "marketplace"
  | "money"
  | "provider"
  | "flow"
  | "billing"
  | "escrow"
  | "shield"
  | "gas"
  | "wallets"
  | "radar"
  | "private"
  | "blueprints"

export function EcosystemNav({ current }: { current: ProductId }) {
  const suiteUrl = process.env.NEXT_PUBLIC_ARC_SUITE_URL ?? (
    process.env.NODE_ENV === "production" ? "https://arcsuite-app.vercel.app" : "http://localhost:3100"
  )
  const urls = {
    treasury: `${suiteUrl}/treasury`,
    reputation: `${suiteUrl}/reputation`,
    marketplace: `${suiteUrl}/marketplace`,
    money: `${suiteUrl}/money`,
    provider: `${suiteUrl}/provider`,
    flow: `${suiteUrl}/flow`,
    billing: `${suiteUrl}/billing`,
    escrow: `${suiteUrl}/escrow`,
    shield: `${suiteUrl}/shield`,
    gas: `${suiteUrl}/gas`,
    wallets: `${suiteUrl}/wallets`,
    radar: `${suiteUrl}/radar`,
    private: `${suiteUrl}/private`,
    blueprints: `${suiteUrl}/blueprints`,
  }

  const products = [
    { id: "treasury", label: "Treasury", url: urls.treasury, color: "#5fbfff", icon: Landmark },
    { id: "reputation", label: "Reputation", url: urls.reputation, color: "#a78bfa", icon: BadgeCheck },
    { id: "marketplace", label: "Marketplace", url: urls.marketplace, color: "#34d399", icon: Store },
    { id: "money", label: "Money Movement", url: urls.money, color: "#7dd3fc", icon: CircleDollarSign },
    { id: "provider", label: "Provider", url: urls.provider, color: "#f472b6", icon: Braces },
    { id: "flow", label: "Flow", url: urls.flow, color: "#22d3ee", icon: Workflow },
    { id: "billing", label: "Billing", url: urls.billing, color: "#fbbf24", icon: ReceiptText },
    { id: "escrow", label: "Escrow", url: urls.escrow, color: "#fb7185", icon: Handshake },
    { id: "shield", label: "Shield", url: urls.shield, color: "#f59e0b", icon: ShieldCheck },
    { id: "gas", label: "Gas", url: urls.gas, color: "#38bdf8", icon: Fuel },
    { id: "wallets", label: "Wallet OS", url: urls.wallets, color: "#c084fc", icon: WalletCards },
    { id: "radar", label: "Radar", url: urls.radar, color: "#f472b6", icon: Radar },
    { id: "private", label: "Private", url: urls.private, color: "#2dd4bf", icon: LockKeyhole },
    { id: "blueprints", label: "Blueprints", url: urls.blueprints, color: "#60a5fa", icon: Boxes },
  ] satisfies Array<{ id: ProductId; label: string; url: string; color: string; icon: typeof Landmark }>

  return (
    <div
      className="flex shrink-0 items-center border-b border-white/[0.06] bg-white/[0.02] px-2 py-1.5 sm:px-4"
      aria-label="Kestrel products"
    >
      <a
        href={suiteUrl}
        className="mr-3 hidden shrink-0 items-center transition-opacity hover:opacity-80 lg:flex"
      >
        <ArcSuiteLogo compact />
      </a>
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => {
          const isCurrent = product.id === current
          const Icon = product.icon
          return (
            <a
              key={product.id}
              href={product.url}
              aria-current={isCurrent ? "page" : undefined}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium transition-colors sm:px-2.5"
              style={
                isCurrent
                  ? { background: `${product.color}16`, color: product.color, borderColor: `${product.color}38` }
                  : { color: "#7a8fa8", borderColor: "transparent" }
              }
              title={`Open Kestrel ${product.label}`}
            >
              <Icon aria-hidden="true" size={14} strokeWidth={1.8} />
              <span className="hidden sm:inline">{product.label}</span>
              {isCurrent && <span className="size-1.5 rounded-full" style={{ background: product.color }} />}
            </a>
          )
        })}
      </div>
      <span className="ml-3 hidden shrink-0 text-[10px] text-[#3d5468] 2xl:inline">
        Arc Testnet · USDC by Circle
      </span>
    </div>
  )
}

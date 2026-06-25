import {
  BadgeCheck,
  Fuel,
  Handshake,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Store,
  WalletCards,
  Workflow,
} from "lucide-react"

type ProductId =
  | "treasury"
  | "reputation"
  | "marketplace"
  | "flow"
  | "billing"
  | "escrow"
  | "shield"
  | "gas"
  | "wallets"

export function EcosystemNav({ current }: { current: ProductId }) {
  const suiteUrl = process.env.NEXT_PUBLIC_ARC_SUITE_URL ?? (
    process.env.NODE_ENV === "production" ? "https://arcsuite-app.vercel.app" : "http://localhost:3100"
  )
  const urls = {
    treasury: process.env.NEXT_PUBLIC_ARC_TREASURY_URL ?? (
      process.env.NODE_ENV === "production" ? "https://treasury-umber.vercel.app" : "http://localhost:3001"
    ),
    reputation: process.env.NEXT_PUBLIC_ARC_REPUTATION_URL ?? (
      process.env.NODE_ENV === "production" ? "https://reputation-five.vercel.app" : "http://localhost:3002"
    ),
    marketplace: process.env.NEXT_PUBLIC_ARC_MARKETPLACE_URL ?? (
      process.env.NODE_ENV === "production" ? "https://marketplace-eosin-eight.vercel.app" : "http://localhost:3003"
    ),
    flow: `${suiteUrl}/flow`,
    billing: `${suiteUrl}/billing`,
    escrow: `${suiteUrl}/escrow`,
    shield: `${suiteUrl}/shield`,
    gas: `${suiteUrl}/gas`,
    wallets: `${suiteUrl}/wallets`,
  }

  const products = [
    { id: "treasury", label: "Treasury", url: urls.treasury, color: "#5fbfff", icon: Landmark },
    { id: "reputation", label: "Reputation", url: urls.reputation, color: "#a78bfa", icon: BadgeCheck },
    { id: "marketplace", label: "Marketplace", url: urls.marketplace, color: "#34d399", icon: Store },
    { id: "flow", label: "Flow", url: urls.flow, color: "#22d3ee", icon: Workflow },
    { id: "billing", label: "Billing", url: urls.billing, color: "#fbbf24", icon: ReceiptText },
    { id: "escrow", label: "Escrow", url: urls.escrow, color: "#fb7185", icon: Handshake },
    { id: "shield", label: "Shield", url: urls.shield, color: "#f59e0b", icon: ShieldCheck },
    { id: "gas", label: "Gas", url: urls.gas, color: "#38bdf8", icon: Fuel },
    { id: "wallets", label: "Wallet OS", url: urls.wallets, color: "#c084fc", icon: WalletCards },
  ] satisfies Array<{ id: ProductId; label: string; url: string; color: string; icon: typeof Landmark }>

  return (
    <div
      className="flex shrink-0 items-center border-b border-white/[0.06] bg-white/[0.02] px-2 py-1.5 sm:px-4"
      aria-label="Arc Suite products"
    >
      <a
        href={suiteUrl}
        className="mr-2 hidden shrink-0 items-center gap-2 text-[10px] font-semibold tracking-wide text-[#7f94aa] transition-colors hover:text-white lg:flex"
      >
        <span className="grid size-6 place-items-center rounded-md bg-gradient-to-br from-[#7dd3fc] to-[#3b82f6] text-[22px] font-black leading-none text-white shadow-[0_0_18px_rgba(95,191,255,0.22)]">a</span>
        <span>Arc Suite</span>
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
              title={`Open Arc ${product.label}`}
            >
              <Icon aria-hidden="true" size={14} strokeWidth={1.8} />
              <span className="hidden sm:inline">Arc {product.label}</span>
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

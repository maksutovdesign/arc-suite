/**
 * EcosystemNav — thin top banner linking all Arc Suite products.
 * Shows in every app so presenters can navigate between them instantly.
 */
export function EcosystemNav({ current }: { current: "treasury" | "reputation" | "marketplace" | "shield" }) {
  const urls = process.env.NODE_ENV === "production"
    ? {
        treasury: process.env.NEXT_PUBLIC_ARC_TREASURY_URL ?? "https://treasury-umber.vercel.app",
        reputation: process.env.NEXT_PUBLIC_ARC_REPUTATION_URL ?? "https://reputation-five.vercel.app",
        marketplace: process.env.NEXT_PUBLIC_ARC_MARKETPLACE_URL ?? "https://marketplace-eosin-eight.vercel.app",
        shield: process.env.NEXT_PUBLIC_ARC_SHIELD_URL ?? "https://arcsuite-app.vercel.app/shield",
      }
    : {
        treasury: "http://localhost:3001",
        reputation: "http://localhost:3002",
        marketplace: "http://localhost:3003",
        shield: "http://localhost:3100/shield",
      }

  const APPS = [
    {
      id: "treasury",
      label: "Arc Treasury",
      sub: "Budget Manager",
      url: urls.treasury,
      color: "#4d8ee9",
      emoji: "💰",
    },
    {
      id: "reputation",
      label: "Arc Reputation",
      sub: "Trust Layer",
      url: urls.reputation,
      color: "#a78bfa",
      emoji: "🛡️",
    },
    {
      id: "marketplace",
      label: "Arc Marketplace",
      sub: "x402 APIs",
      url: urls.marketplace,
      color: "#34d399",
      emoji: "🛒",
    },
    {
      id: "shield",
      label: "Arc Shield",
      sub: "Compliance",
      url: urls.shield,
      color: "#f59e0b",
      emoji: "S",
    },
  ]

  return (
    <div
      className="flex shrink-0 items-center justify-between px-2 py-1.5 sm:px-4"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex min-w-0 items-center gap-1">
        <span className="mr-2 hidden text-[10px] font-medium lg:inline" style={{ color: "#3d5468" }}>
          Arc Suite
        </span>
        {APPS.map(app => {
          const isCurrent = app.id === current
          return (
            <a
              key={app.id}
              href={app.url}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-all sm:px-2.5"
              style={
                isCurrent
                  ? { background: `${app.color}18`, color: app.color, border: `1px solid ${app.color}30`, cursor: "pointer" }
                  : { color: "#7a8fa8", border: "1px solid transparent", cursor: "pointer" }
              }
              title={`Open ${app.label}`}
            >
              <span>{app.emoji}</span>
              <span className="hidden sm:inline">{app.label}</span>
              {isCurrent && (
                  <span className="size-1.5 rounded-full" style={{ background: app.color }} />
              )}
            </a>
          )
        })}
      </div>
      <span className="hidden text-[10px] xl:inline" style={{ color: "#3d5468" }}>
        Arc Testnet · USDC by Circle
      </span>
    </div>
  )
}

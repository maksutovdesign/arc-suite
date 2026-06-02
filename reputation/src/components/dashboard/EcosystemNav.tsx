/**
 * EcosystemNav — thin top banner linking all 3 Arc suite apps.
 * Shows in every app so presenters can navigate between them instantly.
 */
export function EcosystemNav({ current }: { current: "treasury" | "reputation" | "marketplace" }) {
  const urls = process.env.NODE_ENV === "production"
    ? {
        treasury: "https://treasury-umber.vercel.app",
        reputation: "https://reputation-five.vercel.app",
        marketplace: "https://marketplace-eosin-eight.vercel.app",
      }
    : {
        treasury: "http://localhost:3001",
        reputation: "http://localhost:3002",
        marketplace: "http://localhost:3003",
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
  ]

  return (
    <div
      className="flex items-center justify-between px-4 py-1.5 shrink-0"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-medium mr-2" style={{ color: "#3d5468" }}>
          Arc Suite
        </span>
        {APPS.map(app => {
          const isCurrent = app.id === current
          return (
            <a
              key={app.id}
              href={app.url}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
              style={
                isCurrent
                  ? { background: `${app.color}18`, color: app.color, border: `1px solid ${app.color}30`, cursor: "pointer" }
                  : { color: "#7a8fa8", border: "1px solid transparent", cursor: "pointer" }
              }
              title={`Open ${app.label}`}
            >
              <span>{app.emoji}</span>
              <span>{app.label}</span>
              {isCurrent && (
                  <span className="size-1.5 rounded-full" style={{ background: app.color }} />
              )}
            </a>
          )
        })}
      </div>
      <span className="text-[10px]" style={{ color: "#3d5468" }}>
        Arc Testnet · USDC by Circle
      </span>
    </div>
  )
}

interface ArcProgressProps {
  value: number          // 0–100
  size?: "sm" | "md"
  variant?: "default" | "warning" | "danger" | "success"
  inverted?: boolean     // high value = good (ratings, volume rankings)
  showLabel?: boolean
}

const VARIANT_COLORS = {
  default: { from: "#4d8ee9", to: "#5FBFFF", glow: "rgba(77,142,233,0.4)" },
  warning: { from: "#f59e0b", to: "#fbbf24", glow: "rgba(245,158,11,0.4)" },
  danger:  { from: "#f87171", to: "#ef4444", glow: "rgba(248,113,113,0.4)" },
  success: { from: "#34d399", to: "#10b981", glow: "rgba(52,211,153,0.4)" },
}

function getVariant(pct: number, inverted: boolean): ArcProgressProps["variant"] {
  if (inverted) {
    if (pct >= 70) return "success"
    if (pct >= 40) return "default"
    if (pct >= 20) return "warning"
    return "danger"
  }
  if (pct >= 90) return "danger"
  if (pct >= 70) return "warning"
  return "default"
}

export function ArcProgress({ value, size = "md", variant, inverted = false, showLabel }: ArcProgressProps) {
  const resolvedVariant: keyof typeof VARIANT_COLORS = variant ?? getVariant(value, inverted) ?? "default"
  const colors = VARIANT_COLORS[resolvedVariant]
  const h = size === "sm" ? 3 : 5

  return (
    <div className="flex items-center gap-2 w-full">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{
          height: h,
          background: "rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, value)}%`,
            background: `linear-gradient(90deg, ${colors.from} 0%, ${colors.to} 100%)`,
            boxShadow: value > 5 ? `0 0 6px ${colors.glow}` : "none",
          }}
        />
      </div>
      {showLabel && (
        <span
          className="text-[10px] font-semibold tabular-nums w-8 text-right shrink-0"
          style={{ color: colors.from }}
        >
          {value}%
        </span>
      )}
    </div>
  )
}

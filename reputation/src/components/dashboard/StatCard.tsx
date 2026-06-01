import { type LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  sub?: string
  icon: LucideIcon
  trend?: { value: string; up: boolean }
  accent?: "default" | "warning" | "danger" | "success"
}

const ACCENT_STYLES = {
  default: {
    icon: { background: "rgba(77,142,233,0.15)", color: "#5FBFFF" },
    glow: "rgba(77,142,233,0.08)",
  },
  warning: {
    icon: { background: "rgba(245,158,11,0.15)", color: "#f59e0b" },
    glow: "rgba(245,158,11,0.08)",
  },
  danger: {
    icon: { background: "rgba(248,113,113,0.15)", color: "#f87171" },
    glow: "rgba(248,113,113,0.08)",
  },
  success: {
    icon: { background: "rgba(52,211,153,0.15)", color: "#34d399" },
    glow: "rgba(52,211,153,0.08)",
  },
}

export function StatCard({ title, value, sub, icon: Icon, trend, accent = "default" }: StatCardProps) {
  const styles = ACCENT_STYLES[accent]

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: "linear-gradient(135deg, #263a52 0%, #1e3247 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: `0 0 20px ${styles.glow}`,
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "#7a8fa8" }}>
          {title}
        </p>
        <div
          className="size-8 rounded-xl flex items-center justify-center"
          style={styles.icon}
        >
          <Icon className="size-4" />
        </div>
      </div>

      <div>
        <p
          className="text-2xl font-bold tracking-tight text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.03em" }}
        >
          {value}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {sub && <p className="text-[11px]" style={{ color: "#7a8fa8" }}>{sub}</p>}
          {trend && (
            <span
              className="text-[11px] font-semibold"
              style={{ color: trend.up ? "#34d399" : "#f87171" }}
            >
              {trend.up ? "↑" : "↓"} {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

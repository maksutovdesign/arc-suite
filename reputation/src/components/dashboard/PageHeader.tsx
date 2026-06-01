import { type LucideIcon } from "lucide-react"
import { type ReactNode } from "react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  actions?: ReactNode
  /** If true, shows an ambient blue glow behind the title area */
  glow?: boolean
}

export function PageHeader({ title, subtitle, icon: Icon, actions, glow }: PageHeaderProps) {
  return (
    <div
      className="relative flex items-center justify-between px-6 py-4 overflow-hidden"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Subtle ambient glow */}
      {glow && (
        <div
          className="pointer-events-none absolute left-0 top-0 w-64 h-full opacity-30"
          style={{
            background: "radial-gradient(ellipse at 0% 50%, rgba(77,142,233,0.2) 0%, transparent 70%)",
          }}
        />
      )}

      <div className="relative flex items-center gap-3">
        {Icon && (
          <div
            className="size-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(77,142,233,0.2) 0%, rgba(95,191,255,0.15) 100%)",
              border: "1px solid rgba(77,142,233,0.25)",
            }}
          >
            <Icon className="size-4" style={{ color: "#5FBFFF" }} />
          </div>
        )}
        <div>
          <h1
            className="text-lg font-semibold tracking-tight text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: "#7a8fa8" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && <div className="relative flex items-center gap-2">{actions}</div>}
    </div>
  )
}

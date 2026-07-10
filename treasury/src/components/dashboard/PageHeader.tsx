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
      className="relative flex flex-col items-start justify-between gap-3 overflow-hidden px-4 py-4 sm:flex-row sm:items-center sm:px-6"
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

      <div className="relative flex min-w-0 items-center gap-3">
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
        <div className="min-w-0">
          <h1
            className="text-lg font-semibold tracking-tight text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 max-w-full text-xs leading-snug" style={{ color: "#7a8fa8" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && <div className="relative flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div>}
    </div>
  )
}

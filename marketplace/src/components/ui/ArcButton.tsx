import { type ReactNode, type ButtonHTMLAttributes } from "react"
import { type LucideIcon } from "lucide-react"

interface ArcButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "icon"
  icon?: LucideIcon
  iconRight?: LucideIcon
  children?: ReactNode
}

const STYLES = {
  primary: {
    background: "linear-gradient(135deg, #4d8ee9 0%, #5FBFFF 100%)",
    color: "#fff",
    border: "none",
    boxShadow: "0 0 16px rgba(77,142,233,0.35)",
  },
  outline: {
    background: "rgba(255,255,255,0.04)",
    color: "#C7C5D1",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "none",
  },
  ghost: {
    background: "transparent",
    color: "#7a8fa8",
    border: "none",
    boxShadow: "none",
  },
  danger: {
    background: "rgba(248,113,113,0.12)",
    color: "#f87171",
    border: "1px solid rgba(248,113,113,0.25)",
    boxShadow: "none",
  },
}

const SIZES = {
  sm: "h-7 px-3 text-xs rounded-lg gap-1.5",
  md: "h-8 px-3.5 text-sm rounded-xl gap-2",
  icon: "size-8 rounded-xl",
}

export function ArcButton({
  variant = "outline",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  children,
  className = "",
  ...props
}: ArcButtonProps) {
  const style = STYLES[variant]
  const sizeClass = SIZES[size]

  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none disabled:opacity-50 hover:opacity-80 active:scale-95 ${sizeClass} ${className}`}
      style={style}
      {...props}
    >
      {Icon && <Icon className={size === "icon" ? "size-4" : "size-3.5"} />}
      {children}
      {IconRight && <IconRight className="size-3.5" />}
    </button>
  )
}

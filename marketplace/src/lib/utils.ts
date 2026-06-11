import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, unit: string): string {
  const fmt = price < 0.001
    ? `$${price.toFixed(6)}`
    : price < 0.01
    ? `$${price.toFixed(4)}`
    : `$${price.toFixed(3)}`
  return `${fmt} / ${unit}`
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

// Shared category colours — single source of truth
export const CAT_COLORS: Record<string, string> = {
  data:      "#38bdf8",
  compute:   "#a78bfa",
  finance:   "#34d399",
  storage:   "#f59e0b",
  ai:        "#f87171",
  identity:  "#5FBFFF",
  oracle:    "#facc15",
  messaging: "#c084fc",
}

export function statusColor(status: string): { bg: string; color: string; border: string } {
  switch (status) {
    case "live":     return { bg: "rgba(52,211,153,0.1)", color: "#34d399", border: "rgba(52,211,153,0.25)" }
    case "beta":     return { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "rgba(245,158,11,0.25)" }
    case "degraded": return { bg: "rgba(248,113,113,0.1)", color: "#f87171", border: "rgba(248,113,113,0.3)" }
    case "down":     return { bg: "rgba(122,143,168,0.1)", color: "#7a8fa8", border: "rgba(122,143,168,0.2)" }
    default:         return { bg: "rgba(122,143,168,0.1)", color: "#7a8fa8", border: "rgba(122,143,168,0.2)" }
  }
}

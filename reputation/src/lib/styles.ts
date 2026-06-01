import type { CSSProperties } from "react"

/** Shared Arc brand style tokens */

export const ARC_CARD: CSSProperties = {
  background: "linear-gradient(160deg, #263a52 0%, #1e3247 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
}

/** Score tier colors */
export const TIER_COLORS: Record<string, string> = {
  platinum: "#38bdf8",
  gold:     "#facc15",
  silver:   "#94a3b8",
  bronze:   "#fb923c",
  new:      "#7a8fa8",
}

/** Event type badge styles */
export const EVENT_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  payment_completed: { bg: "rgba(52,211,153,0.12)",  color: "#34d399", border: "rgba(52,211,153,0.25)"  },
  payment_failed:    { bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.25)" },
  payment_denied:    { bg: "rgba(248,113,113,0.15)", color: "#f87171", border: "rgba(248,113,113,0.3)"  },
  dispute_raised:    { bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.25)" },
  dispute_resolved:  { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b", border: "rgba(245,158,11,0.25)"  },
  fast_response:     { bg: "rgba(95,191,255,0.12)",  color: "#5FBFFF", border: "rgba(95,191,255,0.25)"  },
  large_tx:          { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },
  new_service:       { bg: "rgba(56,189,248,0.12)",  color: "#38bdf8", border: "rgba(56,189,248,0.25)"  },
  unknown:           { bg: "rgba(122,143,168,0.1)",  color: "#7a8fa8", border: "rgba(122,143,168,0.2)"  },
}

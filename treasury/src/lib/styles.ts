import type { CSSProperties } from "react"

/** Shared Arc brand style tokens used across all pages */

export const ARC_CARD: CSSProperties = {
  background: "linear-gradient(160deg, #263a52 0%, #1e3247 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
}

/** Category badge styles — single source of truth */
export const CAT_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  api_call:  { bg: "rgba(77,142,233,0.12)",  color: "#5FBFFF", border: "rgba(77,142,233,0.25)"  },
  data_feed: { bg: "rgba(167,139,250,0.12)", color: "#c4b5fd", border: "rgba(167,139,250,0.25)" },
  compute:   { bg: "rgba(95,191,255,0.12)",  color: "#93c5fd", border: "rgba(95,191,255,0.25)"  },
  storage:   { bg: "rgba(52,211,153,0.12)",  color: "#34d399", border: "rgba(52,211,153,0.25)"  },
  bridge:    { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b", border: "rgba(245,158,11,0.25)"  },
  swap:      { bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.25)" },
  unknown:   { bg: "rgba(122,143,168,0.1)",  color: "#7a8fa8", border: "rgba(122,143,168,0.2)"  },
}

/** Per-agent gradient colours (cycled by index) */
export const AGENT_GRADIENTS = [
  { from: "#4d8ee9", to: "#5FBFFF" },
  { from: "#a78bfa", to: "#c4b5fd" },
  { from: "#34d399", to: "#6ee7b7" },
  { from: "#f59e0b", to: "#fbbf24" },
  { from: "#f87171", to: "#fca5a5" },
  { from: "#5FBFFF", to: "#93c5fd" },
] as const

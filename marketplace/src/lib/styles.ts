import type { CSSProperties } from "react"

/** Shared Arc brand style tokens */

export const ARC_CARD: CSSProperties = {
  background: "linear-gradient(160deg, #1e3247 0%, #162436 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
}

export const ARC_CARD_DARK: CSSProperties = {
  background: "linear-gradient(160deg, #263a52 0%, #1e3247 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
}

/** Category badge styles — single source of truth */
export const CAT_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  data:      { bg: "rgba(56,189,248,0.12)",  color: "#38bdf8", border: "rgba(56,189,248,0.25)"  },
  compute:   { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },
  finance:   { bg: "rgba(52,211,153,0.12)",  color: "#34d399", border: "rgba(52,211,153,0.25)"  },
  storage:   { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b", border: "rgba(245,158,11,0.25)"  },
  ai:        { bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.25)" },
  identity:  { bg: "rgba(95,191,255,0.12)",  color: "#5FBFFF", border: "rgba(95,191,255,0.25)"  },
  oracle:    { bg: "rgba(250,204,21,0.12)",  color: "#facc15", border: "rgba(250,204,21,0.25)"  },
  messaging: { bg: "rgba(192,132,252,0.12)", color: "#c084fc", border: "rgba(192,132,252,0.25)" },
  unknown:   { bg: "rgba(122,143,168,0.1)",  color: "#7a8fa8", border: "rgba(122,143,168,0.2)"  },
}

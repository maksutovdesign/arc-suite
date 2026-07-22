import { ImageResponse } from "next/og"

export const alt = "Kestrel — Agent Money Control Plane. Built on Arc."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ background: "#080d18", color: "#f8fafc", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", padding: "78px 88px", width: "100%" }}>
      <div style={{ alignItems: "center", display: "flex", gap: 24 }}>
        <svg height="72" viewBox="0 0 48 48" width="72">
          <rect x="1" y="1" width="46" height="46" rx="14" fill="#141d2f" />
          <path d="M15.5 11.5V36.5" fill="none" stroke="#F8FAFC" strokeWidth="6" strokeLinecap="round" />
          <path d="M18 24L32.5 11.5M18 24L33 36.5" fill="none" stroke="#7DD3FC" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <strong style={{ fontSize: 42, letterSpacing: "-1px" }}>Kestrel</strong>
          <span style={{ color: "#94a3b8", fontSize: 19, letterSpacing: "2px", textTransform: "uppercase" }}>Built on Arc</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 970 }}>
        <div style={{ fontSize: 74, fontWeight: 700, letterSpacing: "-4px", lineHeight: 1.02 }}>Move money. Apply policy. Keep proof.</div>
        <div style={{ color: "#aebbd0", fontSize: 30, lineHeight: 1.35 }}>Unified Balance, Swap, Bridge and Send for the agentic economy.</div>
      </div>
      <div style={{ color: "#7dd3fc", display: "flex", fontSize: 21, gap: 28 }}>
        <span>Circle App Kit</span><span>USDC</span><span>Policy controls</span><span>Transaction proof</span>
      </div>
    </div>,
    size,
  )
}

import { type AgentStatus } from "@/data/mock"

const STATUS_CONFIG: Record<AgentStatus, { label: string; bg: string; color: string; border: string; dot: string }> = {
  active: { label: "Active", bg: "rgba(52,211,153,0.1)", color: "#34d399", border: "rgba(52,211,153,0.25)", dot: "#34d399" },
  alert:  { label: "Alert",  bg: "rgba(248,113,113,0.1)", color: "#f87171", border: "rgba(248,113,113,0.3)", dot: "#f87171" },
  paused: { label: "Paused", bg: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "rgba(245,158,11,0.25)", dot: "#f59e0b" },
  idle:   { label: "Idle",   bg: "rgba(122,143,168,0.1)", color: "#7a8fa8", border: "rgba(122,143,168,0.2)", dot: "#7a8fa8" },
}

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      <span
        className={`size-1.5 rounded-full ${status === "active" ? "animate-pulse" : ""}`}
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  )
}

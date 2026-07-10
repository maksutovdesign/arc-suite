"use client"

import { useState } from "react"
import { AlertTriangle, X } from "lucide-react"
import { ALERTS } from "@/data/mock"

export function AlertBanner() {
  const [dismissed, setDismissed] = useState(false)
  const critical = ALERTS.filter((a) => !a.resolved && a.severity === "critical")

  if (dismissed || critical.length === 0) return null

  return (
    <div
      className="mx-4 mt-4 rounded-2xl px-4 py-3 sm:mx-6"
      style={{
        background: "rgba(248,113,113,0.08)",
        border: "1px solid rgba(248,113,113,0.25)",
        boxShadow: "0 0 20px rgba(248,113,113,0.06)",
      }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="size-4 mt-0.5 shrink-0" style={{ color: "#f87171" }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "#f87171" }}>
            {critical.length} critical alert{critical.length > 1 ? "s" : ""} require immediate attention
          </p>
          <ul className="mt-1 space-y-0.5">
            {critical.map((a) => (
              <li key={a.id} className="text-xs" style={{ color: "#7a8fa8" }}>
                <span className="font-medium text-white">{a.agentName}:</span> {a.message}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 size-6 rounded-lg flex items-center justify-center transition-colors hover:bg-white/8"
          style={{ color: "#7a8fa8" }}
          aria-label="Dismiss alerts"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

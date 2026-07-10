"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Pause, Play, Save, Settings2 } from "lucide-react"
import { ArcButton } from "@/components/ui/ArcButton"
import type { Agent } from "@/data/mock"

type Props = {
  agent: Agent
  isDemo?: boolean
}

export function AgentPolicyActions({ agent, isDemo = false }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [monthlyBudget, setMonthlyBudget] = useState(String(agent.monthlyBudget))
  const [dailyLimit, setDailyLimit] = useState(String(agent.dailyLimit))
  const [error, setError] = useState<string | null>(null)

  function runAction(action: () => Promise<void>) {
    setError(null)
    if (isDemo) {
      setError("Demo workspace is read-only. Run Access Check below to test live policy logic.")
      return
    }
    startTransition(async () => {
      try {
        await action()
        router.refresh()
      } catch {
        setError("Update failed")
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {agent.status === "paused" ? (
          <ArcButton
            disabled={isPending || isDemo}
            title={isDemo ? "Demo workspace is read-only" : "Resume agent"}
            icon={Play}
            onClick={() => runAction(() => post(`/api/arc/agents/${agent.id}/resume`))}
            size="sm"
            variant="primary"
          >
            Resume
          </ArcButton>
        ) : (
          <ArcButton
            disabled={isPending || isDemo}
            icon={Pause}
            title={isDemo ? "Demo workspace is read-only" : "Pause agent"}
            onClick={() => runAction(() => post(`/api/arc/agents/${agent.id}/pause`))}
            size="sm"
            variant="outline"
          >
            Pause
          </ArcButton>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#7a8fa8" }}>
            Monthly
          </span>
          <input
            className="h-8 w-full rounded-lg px-2 text-xs text-white outline-none"
            min="0"
            disabled={isDemo}
            onChange={(event) => setMonthlyBudget(event.target.value)}
            step="1"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            type="number"
            value={monthlyBudget}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#7a8fa8" }}>
            Daily
          </span>
          <input
            className="h-8 w-full rounded-lg px-2 text-xs text-white outline-none"
            min="0"
            disabled={isDemo}
            onChange={(event) => setDailyLimit(event.target.value)}
            step="0.01"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            type="number"
            value={dailyLimit}
          />
        </label>
      </div>

      <ArcButton
        className="w-full justify-center"
        disabled={isPending || isDemo}
        icon={isPending ? Settings2 : Save}
        title={isDemo ? "Demo workspace is read-only" : "Save limits"}
        onClick={() =>
          runAction(() =>
            patch(`/api/arc/agents/${agent.id}`, {
              dailyLimitUsdc: Number(dailyLimit),
              monthlyBudgetUsdc: Number(monthlyBudget),
            }),
          )
        }
        size="sm"
        variant="outline"
      >
        Save limits
      </ArcButton>

      {error && <p className="text-[11px]" style={{ color: "#f87171" }}>{error}</p>}
      {isDemo && !error && (
        <p className="text-[11px]" style={{ color: "#7a8fa8" }}>
          Demo mode keeps budget controls read-only.
        </p>
      )}
    </div>
  )
}

async function post(path: string) {
  const response = await fetch(path, { method: "POST" })
  if (!response.ok) throw new Error("Request failed")
}

async function patch(path: string, body: unknown) {
  const response = await fetch(path, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  })
  if (!response.ok) throw new Error("Request failed")
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Bot, ArrowLeftRight, PieChart,
  Wallet, Bell, Settings, ChevronRight, Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AGENTS, ALERTS } from "@/data/mock"

// Derived counts — single source of truth
const AGENT_COUNT   = AGENTS.length
const ALERT_COUNT   = ALERTS.filter(a => !a.resolved).length
const BUDGET_ALERTS = ALERTS.filter(a => !a.resolved && a.severity === "critical").length

const NAV = [
  { href: "/",             label: "Dashboard",    icon: LayoutDashboard },
  { href: "/agents",       label: "Agents",       icon: Bot,          badge: AGENT_COUNT },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets",      label: "Budgets",      icon: Wallet,       badge: BUDGET_ALERTS, badgeCritical: true },
  { href: "/reports",      label: "Reports",      icon: PieChart },
  { href: "/alerts",       label: "Alerts",       icon: Bell,         badge: ALERT_COUNT,   badgeCritical: true },
  { href: "/settings",     label: "Settings",     icon: Settings },
]

export function Sidebar() {
  const path = usePathname()

  return (
    <aside
      className="w-56 shrink-0 flex flex-col h-full border-r"
      style={{ background: "linear-gradient(180deg, #1a2d3e 0%, #162436 100%)", borderColor: "rgba(255,255,255,0.06)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div
          className="size-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #4d8ee9 0%, #5FBFFF 100%)", boxShadow: "0 0 16px rgba(77,142,233,0.4)" }}
        >
          <Zap className="size-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none text-white tracking-tight">Arc Treasury</p>
          <p className="text-[10px] mt-0.5" style={{ color: "#7a8fa8" }}>Agent Budget Manager</p>
        </div>
      </div>

      {/* Network pill */}
      <div className="px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: "#7a8fa8" }}>Network</span>
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}
          >
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-400">Arc Testnet</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, badge, badgeCritical }) => {
          // ✅ startsWith so /agents/[id] keeps Agents highlighted
          const active = href === "/" ? path === "/" : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-150",
                active ? "text-white" : "text-[#7a8fa8] hover:text-white hover:bg-white/5"
              )}
              style={
                active
                  ? {
                      background: "linear-gradient(135deg, rgba(77,142,233,0.25) 0%, rgba(95,191,255,0.15) 100%)",
                      border: "1px solid rgba(77,142,233,0.3)",
                      boxShadow: "0 0 12px rgba(77,142,233,0.1)",
                    }
                  : {}
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn("size-4 shrink-0", active ? "text-[#5FBFFF]" : "")} />
                <span className="font-medium">{label}</span>
              </div>
              {badge !== undefined && badge > 0 && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                  style={
                    badgeCritical
                      ? { background: "rgba(248,113,113,0.2)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }
                      : { background: "rgba(77,142,233,0.2)", color: "#5FBFFF", border: "1px solid rgba(77,142,233,0.3)" }
                  }
                >
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-medium" style={{ color: "#34d399" }}>Arc Testnet</span>
          <span style={{ color: "#3d5468" }}>·</span>
          <span className="text-[10px]" style={{ color: "#7a8fa8" }}>USDC by Circle</span>
        </div>
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-white/5">
          <div
            className="size-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #4d8ee9, #5FBFFF)" }}
          >
            AC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Arc Corp</p>
            <p className="text-[10px] truncate" style={{ color: "#7a8fa8" }}>Pro Plan · Testnet</p>
          </div>
          <ChevronRight className="size-3 shrink-0" style={{ color: "#7a8fa8" }} />
        </div>
      </div>
    </aside>
  )
}

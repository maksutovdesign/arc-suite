"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard, Bot, ArrowLeftRight, PieChart,
  Wallet, Bell, Settings, ChevronRight,
  Building2, CreditCard, KeyRound, LifeBuoy, LogOut, Menu, Users, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AGENTS, ALERTS } from "@/data/mock"
import { ArcSuiteLogo } from "@/components/ArcSuiteLogo"

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

export function Sidebar({ isDemo = false }: { isDemo?: boolean }) {
  const path = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false)

  return (
    <>
      <button
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        className="fixed left-3 top-12 z-50 flex size-10 items-center justify-center rounded-xl border shadow-lg md:hidden"
        onClick={() => setIsOpen((current) => !current)}
        style={{
          background: "linear-gradient(160deg,#263a52,#1e3247)",
          borderColor: "rgba(95,191,255,0.24)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.32), 0 0 16px rgba(77,142,233,0.14)",
          color: "#5FBFFF",
        }}
        type="button"
      >
        {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>

      {isOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 top-9 z-30 bg-black/45 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          type="button"
        />
      )}

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-9 z-40 flex h-auto w-64 shrink-0 flex-col border-r transition-transform duration-200 md:relative md:top-auto md:z-auto md:h-full md:w-56 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ background: "linear-gradient(180deg, #1a2d3e 0%, #162436 100%)", borderColor: "rgba(255,255,255,0.06)" }}
      >
      {/* Logo */}
      <div className="border-b px-4 py-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <ArcSuiteLogo />
        <div>
          <p className="mt-1.5 text-[10px]" style={{ color: "#7a8fa8" }}>Treasury · Agent Budget Manager</p>
        </div>
      </div>

      {/* Network pill */}
      <div className="px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: "#7a8fa8" }}>Network</span>
          <div className="flex items-center gap-1.5">
            {isDemo && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: "rgba(95,191,255,0.12)", border: "1px solid rgba(95,191,255,0.24)", color: "#5FBFFF" }}
              >
                Demo
              </span>
            )}
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}
            >
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-400">Arc Testnet</span>
            </div>
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
              onClick={() => setIsOpen(false)}
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
      <div className="relative p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-medium" style={{ color: "#34d399" }}>Arc Testnet</span>
          <span style={{ color: "#3d5468" }}>·</span>
          <span className="text-[10px]" style={{ color: "#7a8fa8" }}>USDC by Circle</span>
        </div>
        {isWorkspaceMenuOpen && (
          <div
            className="absolute bottom-[76px] left-3 right-3 z-40 overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              background: "linear-gradient(180deg, rgba(16,30,45,0.98), rgba(8,15,24,0.98))",
              borderColor: "rgba(95,191,255,0.22)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.46), 0 0 30px rgba(95,191,255,0.12)",
            }}
          >
            <div className="border-b px-3 py-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <p className="text-sm font-semibold text-white">Arc Corp</p>
              <p className="mt-1 text-[11px]" style={{ color: "#8fa3b8" }}>
                {isDemo ? "Demo workspace · Read-only" : "Pro Plan · Testnet"}
              </p>
            </div>
            {[
              { icon: Building2, label: "Workspace overview", meta: "Preview" },
              { icon: Users, label: "Members & roles", meta: "4 seats" },
              { icon: KeyRound, label: "API keys", meta: isDemo ? "Locked" : "Manage" },
              { icon: CreditCard, label: "Plan & billing", meta: "Pro" },
              { icon: LifeBuoy, label: "Support", meta: "Docs" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                  disabled
                  key={item.label}
                  type="button"
                >
                  <Icon className="size-4 shrink-0" style={{ color: "#5FBFFF" }} />
                  <span className="min-w-0 flex-1 text-xs font-semibold text-white">{item.label}</span>
                  <span className="text-[10px]" style={{ color: "#7a8fa8" }}>{item.meta}</span>
                </button>
              )
            })}
            <button
              className="flex w-full items-center gap-2.5 border-t px-3 py-2.5 text-left transition-colors hover:bg-white/5"
              disabled
              style={{ borderColor: "rgba(255,255,255,0.07)" }}
              type="button"
            >
              <LogOut className="size-4 shrink-0" style={{ color: "#f87171" }} />
              <span className="min-w-0 flex-1 text-xs font-semibold text-white">Sign out</span>
              <span className="text-[10px]" style={{ color: "#7a8fa8" }}>Soon</span>
            </button>
          </div>
        )}
        <button
          aria-expanded={isWorkspaceMenuOpen}
          className="flex w-full items-center gap-2.5 p-2.5 rounded-xl cursor-pointer text-left transition-all hover:bg-white/5"
          onClick={() => setIsWorkspaceMenuOpen((current) => !current)}
          type="button"
        >
          <div
            className="size-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #4d8ee9, #5FBFFF)" }}
          >
            AC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Arc Corp</p>
            <p className="text-[10px] truncate" style={{ color: "#7a8fa8" }}>
              {isDemo ? "Demo Workspace · Read-only" : "Pro Plan · Testnet"}
            </p>
          </div>
          <ChevronRight className={cn("size-3 shrink-0 transition-transform", isWorkspaceMenuOpen && "rotate-90")} style={{ color: "#7a8fa8" }} />
        </button>
      </div>
      </aside>
    </>
  )
}

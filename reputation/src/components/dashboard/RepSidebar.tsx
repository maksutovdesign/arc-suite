"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Activity,
  ArrowLeftRight,
  BarChart2,
  ChevronRight,
  ChevronUp,
  Code,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Trophy,
  UserRound,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ArcSuiteLogo } from "@/components/ArcSuiteLogo"

const NAV = [
  { href: "/",         label: "Leaderboard", icon: LayoutDashboard },
  { href: "/agents",   label: "Agents",      icon: ShieldCheck },
  { href: "/events",   label: "Events",      icon: Activity },
  { href: "/compare",  label: "Compare",     icon: ArrowLeftRight },
  { href: "/tiers",    label: "Trust Tiers", icon: Trophy },
  { href: "/reports",  label: "Reports",     icon: BarChart2 },
  { href: "/docs",     label: "Docs",        icon: Code },
  { href: "/settings", label: "Settings",    icon: Settings },
]

export function RepSidebar() {
  const path = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)

  return (
    <>
      <button
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        className="fixed left-3 top-12 z-50 flex size-10 items-center justify-center rounded-xl border shadow-lg md:hidden"
        onClick={() => setIsOpen((current) => !current)}
        style={{
          background: "linear-gradient(160deg,#263a52,#1e3247)",
          borderColor: "rgba(167,139,250,0.28)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.32), 0 0 16px rgba(167,139,250,0.14)",
          color: "#a78bfa",
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
        style={{ background: "linear-gradient(180deg,#1a2d3e 0%,#162436 100%)", borderColor: "rgba(255,255,255,0.06)" }}
      >
      {/* Logo */}
      <div className="border-b px-4 py-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <ArcSuiteLogo />
        <div>
          <p className="mt-1.5 text-[10px]" style={{ color: "#7a8fa8" }}>Reputation · Agent Trust Layer</p>
        </div>
      </div>

      {/* Network */}
      <div className="px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: "#7a8fa8" }}>Network</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-400">Arc Testnet</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/" && path.startsWith(href))
          return (
            <Link key={href} href={href}
              onClick={() => setIsOpen(false)}
              className={cn("flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all font-medium",
                active ? "text-white" : "text-[#7a8fa8] hover:text-white hover:bg-white/5")}
              style={active ? {
                background: "linear-gradient(135deg,rgba(167,139,250,0.2),rgba(56,189,248,0.1))",
                border: "1px solid rgba(167,139,250,0.25)",
                boxShadow: "0 0 12px rgba(167,139,250,0.1)"
              } : {}}>
              <Icon className={cn("size-4 shrink-0", active && "text-[#a78bfa]")} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Arc / Circle attribution */}
      <div className="relative px-3 py-2.5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {workspaceOpen && (
          <div
            className="absolute bottom-[76px] left-3 right-3 z-10 overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              background: "linear-gradient(180deg,rgba(26,45,62,0.98),rgba(14,23,35,0.98))",
              borderColor: "rgba(167,139,250,0.24)",
              boxShadow: "0 18px 50px rgba(0,0,0,0.42), 0 0 22px rgba(167,139,250,0.12)",
            }}
          >
            <div className="border-b px-3 py-2.5" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <p className="text-xs font-semibold text-white">Arc Corp workspace</p>
              <p className="mt-0.5 text-[10px]" style={{ color: "#7a8fa8" }}>Demo account · reputation operator</p>
            </div>
            {[
              { href: "/settings", label: "Workspace settings", detail: "Profile, members, keys", icon: UserRound },
              { href: "/docs", label: "API credentials", detail: "Reputation API docs", icon: KeyRound },
              { href: "/reports", label: "Usage and reports", detail: "Trust score exports", icon: CreditCard },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link
                  className="flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                  href={item.href}
                  key={item.label}
                  onClick={() => {
                    setWorkspaceOpen(false)
                    setIsOpen(false)
                  }}
                >
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-xl border"
                    style={{ background: "rgba(167,139,250,0.1)", borderColor: "rgba(167,139,250,0.18)", color: "#a78bfa" }}
                  >
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-white">{item.label}</span>
                    <span className="block truncate text-[10px]" style={{ color: "#7a8fa8" }}>{item.detail}</span>
                  </span>
                </Link>
              )
            })}
            <button
              className="flex w-full items-center gap-2.5 border-t px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}
              type="button"
            >
              <span
                className="grid size-8 shrink-0 place-items-center rounded-xl border"
                style={{ background: "rgba(56,189,248,0.08)", borderColor: "rgba(56,189,248,0.18)", color: "#38bdf8" }}
              >
                <LogOut size={15} />
              </span>
              <span>
                <span className="block text-xs font-semibold text-white">Demo session</span>
                <span className="block text-[10px]" style={{ color: "#7a8fa8" }}>Read-only mode</span>
              </span>
            </button>
          </div>
        )}
        <div className="flex items-center gap-1.5 mb-2.5 px-1">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-medium" style={{ color: "#34d399" }}>Arc Testnet</span>
          <span className="text-[10px]" style={{ color: "#3d5468" }}>·</span>
          <span className="text-[10px]" style={{ color: "#7a8fa8" }}>USDC by Circle</span>
        </div>
        <button
          aria-expanded={workspaceOpen}
          aria-label="Open workspace menu"
          className="flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition-all hover:bg-white/5"
          onClick={() => setWorkspaceOpen((current) => !current)}
          type="button"
        >
          <div className="size-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg,#a78bfa,#38bdf8)" }}>RC</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white">Arc Corp</p>
            <p className="text-[10px]" style={{ color: "#7a8fa8" }}>Trust Score: 961</p>
          </div>
          {workspaceOpen ? (
            <ChevronUp className="size-3 shrink-0" style={{ color: "#a78bfa" }} />
          ) : (
            <ChevronRight className="size-3 shrink-0" style={{ color: "#7a8fa8" }} />
          )}
        </button>
      </div>
      </aside>
    </>
  )
}

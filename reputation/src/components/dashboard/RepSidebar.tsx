"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Trophy, Activity, ShieldCheck, Settings, ChevronRight, BarChart2, ArrowLeftRight, Code } from "lucide-react"
import { cn } from "@/lib/utils"

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
  return (
    <aside
      className="w-56 shrink-0 flex flex-col h-full border-r"
      style={{ background: "linear-gradient(180deg,#1a2d3e 0%,#162436 100%)", borderColor: "rgba(255,255,255,0.06)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="size-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#a78bfa 0%,#38bdf8 100%)", boxShadow: "0 0 16px rgba(167,139,250,0.4)" }}>
          <ShieldCheck className="size-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none text-white">Arc Reputation</p>
          <p className="text-[10px] mt-0.5" style={{ color: "#7a8fa8" }}>Agent Trust Layer</p>
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
      <div className="px-3 py-2.5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-1.5 mb-2.5 px-1">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-medium" style={{ color: "#34d399" }}>Arc Testnet</span>
          <span className="text-[10px]" style={{ color: "#3d5468" }}>·</span>
          <span className="text-[10px]" style={{ color: "#7a8fa8" }}>USDC by Circle</span>
        </div>
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
          <div className="size-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg,#a78bfa,#38bdf8)" }}>RC</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white">Arc Corp</p>
            <p className="text-[10px]" style={{ color: "#7a8fa8" }}>Trust Score: 961</p>
          </div>
          <ChevronRight className="size-3 shrink-0" style={{ color: "#7a8fa8" }} />
        </div>
      </div>
    </aside>
  )
}

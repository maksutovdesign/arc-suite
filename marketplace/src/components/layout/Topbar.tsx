"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Store, Plus, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { LiveTicker } from "@/components/dashboard/LiveTicker"

const NAV = [
  { href: "/",            label: "Browse"     },
  { href: "/categories",  label: "Categories" },
  { href: "/providers",   label: "Providers"  },
  { href: "/analytics",   label: "Analytics"  },
  { href: "/x402",        label: "x402"       },
  { href: "/submit",      label: "Submit"     },
]

export function Topbar() {
  const path = usePathname()
  return (
    <header className="border-b shrink-0" style={{ background: "linear-gradient(180deg,#1a2d3e,#162436)", borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="size-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#4d8ee9,#5FBFFF)", boxShadow: "0 0 12px rgba(77,142,233,0.4)" }}>
            <Zap className="size-3.5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">Arc</span>
            <span className="text-sm font-bold" style={{ color: "#5FBFFF" }}> Marketplace</span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          {NAV.map(({ href, label }) => {
            const active = path === href || (href !== "/" && path.startsWith(href))
            return (
              <Link key={href} href={href}
                className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  active ? "text-white" : "text-[#7a8fa8] hover:text-white hover:bg-white/5")}
                style={active ? { background: "rgba(77,142,233,0.15)", border: "1px solid rgba(77,142,233,0.25)" } : {}}>
                {label === "Submit" && <Plus className="size-3 inline mr-1" />}
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Live ticker */}
        <LiveTicker />

        {/* Arc + Circle badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ background: "rgba(95,191,255,0.08)", border: "1px solid rgba(95,191,255,0.18)" }}>
            <Zap className="size-3" style={{ color: "#5FBFFF" }} />
            <span className="text-[11px] font-semibold" style={{ color: "#5FBFFF" }}>Built on Arc</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)" }}>
            <Store className="size-3" style={{ color: "#34d399" }} />
            <span className="text-[11px] font-semibold" style={{ color: "#34d399" }}>USDC</span>
          </div>
        </div>
      </div>
    </header>
  )
}

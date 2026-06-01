"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Code, Zap, CheckCircle, DollarSign, Shield, ArrowLeft, PartyPopper } from "lucide-react"
import { ArcButton } from "@/components/ui/ArcButton"

const STEPS = [
  { n: 1, icon: Code,        color: "#5FBFFF", title: "Wrap your endpoint with x402",   desc: "Add the x402 middleware to any existing API. Works with Node.js, Python, Go — any language." },
  { n: 2, icon: DollarSign,  color: "#34d399", title: "Set your USDC price",            desc: "Price per request, token, or byte. Payments land directly in your Arc wallet — no intermediary." },
  { n: 3, icon: Shield,      color: "#a78bfa", title: "Submit & get verified",           desc: "Fill the form below. Verification takes 24–48h. Verified APIs get a badge and priority placement." },
]

const CATEGORIES = ["Data Feeds","Compute","Finance","Storage","AI / LLM","Identity","Oracles","Messaging"]

export default function SubmitPage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: "", provider: "", endpoint: "", price: "", unit: "", description: "", category: "Data Feeds" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.provider || !form.endpoint) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: "linear-gradient(180deg,#162436 0%,#0f1c2a 100%)" }}>
        <div className="max-w-md w-full mx-6">
          <div className="rounded-2xl p-8 text-center"
            style={{ background: "linear-gradient(160deg,#1e3247,#162436)", border: "1px solid rgba(52,211,153,0.3)", boxShadow: "0 0 40px rgba(52,211,153,0.08)" }}>
            <div className="size-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)" }}>
              <PartyPopper className="size-7" style={{ color: "#34d399" }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Submitted for Review!</h2>
            <p className="text-sm mb-1" style={{ color: "#94a3b8" }}>
              <span className="font-semibold text-white">{form.name}</span> by {form.provider} is now in the review queue.
            </p>
            <p className="text-sm mb-6" style={{ color: "#7a8fa8" }}>
              Verification takes 24–48h. You'll receive a notification at your wallet address when approved.
            </p>

            <div className="rounded-xl p-4 mb-6 text-left space-y-2"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {[
                { label: "API Name",  value: form.name },
                { label: "Provider",  value: form.provider },
                { label: "Endpoint",  value: form.endpoint },
                { label: "Price",     value: form.price ? `$${form.price} / ${form.unit || "request"}` : "—" },
                { label: "Category",  value: form.category },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-[11px]" style={{ color: "#7a8fa8" }}>{label}</span>
                  <span className="text-[11px] font-medium text-white text-right truncate">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSubmitted(false)} className="flex-1 h-9 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.05)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.08)" }}>
                Submit another
              </button>
              <Link href="/" className="flex-1">
                <button className="w-full h-9 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#4d8ee9,#5FBFFF)", boxShadow: "0 0 16px rgba(77,142,233,0.3)" }}>
                  Browse APIs →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg,#162436 0%,#0f1c2a 100%)" }}>
      {/* Hero */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "linear-gradient(180deg,#1e3247,#162436)" }}>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Link href="/" className="flex items-center gap-1.5 text-[11px] mb-4 w-fit" style={{ color: "#7a8fa8" }}>
            <ArrowLeft className="size-3" /><span>Back to marketplace</span>
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}>
              Free to list
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Submit your API</h1>
          <p className="text-sm" style={{ color: "#7a8fa8" }}>
            List your x402-enabled API and start earning USDC per request — no monthly fees, no rev share.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        {/* Steps */}
        <div className="rounded-2xl p-5" style={{ background: "linear-gradient(160deg,#1e3247,#162436)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-sm font-semibold text-white mb-4">How it works</p>
          <div className="space-y-4">
            {STEPS.map(({ n, icon: Icon, color, title, desc }) => (
              <div key={n} className="flex gap-3">
                <div className="size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon className="size-3.5" style={{ color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{n}. {title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#7a8fa8" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code snippet */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#0d1b2a", border: "1px solid rgba(95,191,255,0.15)" }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(95,191,255,0.04)" }}>
            <Code className="size-3.5" style={{ color: "#5FBFFF" }} />
            <span className="text-[11px] font-mono font-medium" style={{ color: "#5FBFFF" }}>x402 integration · Node.js</span>
          </div>
          <pre className="px-5 py-4 text-xs leading-relaxed overflow-x-auto" style={{ color: "#94a3b8", fontFamily: "'Space Mono', monospace" }}>
{`import { paymentMiddleware } from "x402-next"

export const middleware = paymentMiddleware({
  "/api/data":      { price: "$0.002", network: "arc" },
  "/api/premium/*": { price: "$0.010", network: "arc" },
})

// AI agents detect x402 and pay automatically`}
          </pre>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "linear-gradient(160deg,#1e3247,#162436)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-sm font-semibold text-white">API Details</p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "API Name *",              key: "name",     placeholder: "e.g. CryptoPrice Feed",        full: false },
              { label: "Provider Name *",          key: "provider", placeholder: "Company or handle",            full: false },
              { label: "Endpoint URL *",           key: "endpoint", placeholder: "https://api.example.com/v1/", full: true  },
              { label: "Price per unit (USDC)",    key: "price",    placeholder: "e.g. 0.002",                  full: false },
              { label: "Unit",                     key: "unit",     placeholder: "request / token / MB",         full: false },
            ].map(({ label, key, placeholder, full }) => (
              <div key={key} className={full ? "col-span-2" : ""}>
                <label className="text-[11px] font-medium mb-1.5 block" style={{ color: "#7a8fa8" }}>{label}</label>
                <input
                  className="w-full h-9 px-3 rounded-xl text-sm outline-none transition-all focus:border-[#5FBFFF]"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e8e6f0" }}
                  placeholder={placeholder}
                  value={(form as Record<string, string>)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[11px] font-medium mb-1.5 block" style={{ color: "#7a8fa8" }}>Description</label>
            <textarea
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e8e6f0" }}
              rows={3} placeholder="What does your API do? Who is it for?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium mb-1.5 block" style={{ color: "#7a8fa8" }}>Category</label>
            <select
              className="w-full h-9 px-3 rounded-xl text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e8e6f0" }}
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} style={{ background: "#1e3247" }}>{c}</option>)}
            </select>
          </div>

          <button type="submit"
            className="w-full h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-98"
            style={{ background: "linear-gradient(135deg,#4d8ee9,#5FBFFF)", boxShadow: "0 0 20px rgba(77,142,233,0.3)" }}>
            <Plus className="size-4" />
            Submit for Review
          </button>

          <div className="flex items-center gap-2 text-[11px]" style={{ color: "#7a8fa8" }}>
            <CheckCircle className="size-3.5 shrink-0" style={{ color: "#34d399" }} />
            Verified APIs earn a badge and appear in featured sections
          </div>
        </form>
      </div>
    </div>
  )
}

"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { getLandingAnalyticsIdentity, trackLandingConversion } from "@/lib/analytics"

type FormState = {
  company: string
  email: string
  interest: "pilot" | "investment" | "partnership" | "press" | "other"
  message: string
  name: string
  role: string
  website: string
}

const initialForm: FormState = {
  company: "",
  email: "",
  interest: "pilot",
  message: "",
  name: "",
  role: "",
  website: "",
}

export function RequestPilotForm() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("submitting")
    setError(null)

    const identity = getLandingAnalyticsIdentity()
    trackLandingConversion({
      eventName: "lead_submit",
      placement: "request_pilot_form",
      surface: "lead_capture",
      properties: { interest: form.interest },
    })

    try {
      const response = await fetch("/api/leads", {
        body: JSON.stringify({
          ...form,
          anonymousId: identity.anonymousId,
          path: window.location.pathname,
          referrer: document.referrer,
          sessionId: identity.sessionId,
          url: window.location.href,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })

      if (!response.ok) throw new Error("Lead capture failed")
      setForm(initialForm)
      setStatus("success")
    } catch {
      setError("Could not send the request. Try again from the demo workspace or contact flow.")
      setStatus("error")
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <form className="lead-form" onSubmit={submitLead}>
      <div className="lead-form-grid">
        <label>
          <span>Name</span>
          <input name="name" required value={form.name} onChange={(event) => update("name", event.target.value)} />
        </label>
        <label>
          <span>Email</span>
          <input name="email" required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
        </label>
        <label>
          <span>Company</span>
          <input name="company" value={form.company} onChange={(event) => update("company", event.target.value)} />
        </label>
        <label>
          <span>Role</span>
          <input name="role" value={form.role} onChange={(event) => update("role", event.target.value)} />
        </label>
        <label>
          <span>Interest</span>
          <select name="interest" value={form.interest} onChange={(event) => update("interest", event.target.value as FormState["interest"])}>
            <option value="pilot">Pilot</option>
            <option value="investment">Investment</option>
            <option value="partnership">Partnership</option>
            <option value="press">Press</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="lead-message">
          <span>Message</span>
          <textarea name="message" value={form.message} onChange={(event) => update("message", event.target.value)} />
        </label>
        <label className="lead-honeypot" aria-hidden="true">
          <span>Website</span>
          <input
            autoComplete="off"
            name="website"
            tabIndex={-1}
            value={form.website}
            onChange={(event) => update("website", event.target.value)}
          />
        </label>
      </div>

      <div className="lead-form-footer">
        <button className="button primary" disabled={status === "submitting"} type="submit">
          {status === "submitting" ? "Sending..." : "Request pilot"}
        </button>
        {status === "success" && <p className="lead-success">Request received.</p>}
        {error && <p className="lead-error">{error}</p>}
      </div>
    </form>
  )
}

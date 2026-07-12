"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { SPEND_OVER_TIME } from "@/data/mock"

const COLORS = {
  dataharvester: "#4d8ee9",
  tradebot: "#5FBFFF",
  contentgen: "#a78bfa",
  iot: "#34d399",
}

export function SpendChart() {
  return (
    <div className="min-w-0">
      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={SPEND_OVER_TIME} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            {Object.entries(COLORS).map(([key, color]) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#7a8fa8" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#7a8fa8" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#1e3247",
              color: "#E8E6F0",
            }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, ""]}
          />
          {Object.entries(COLORS).map(([key, color]) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={key.charAt(0).toUpperCase() + key.slice(1)}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-4">
        {Object.entries(COLORS).map(([key, color]) => (
          <div className="flex min-w-0 items-center gap-1.5 text-[10px]" key={key}>
            <span className="h-1.5 w-3 shrink-0 rounded-full" style={{ background: color }} />
            <span className="min-w-0 truncate" style={{ color: "#C7C5D1" }}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

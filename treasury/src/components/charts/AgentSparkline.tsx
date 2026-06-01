"use client"

import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts"

interface Props {
  data: { value: number }[]
  color?: string
  height?: number
}

export function AgentSparkline({ data, color = "#4d8ee9", height = 40 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{
            fontSize: 11,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "#1e3247",
            color: "#E8E6F0",
          }}
          formatter={(v) => [`$${Number(v).toFixed(2)}`, "Spend"]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace("#", "")})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

"use client"

import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface BarChartProps {
  data: { name: string; value: number; color?: string }[]
  height?: number
  formatValue?: (v: number) => string
}

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#1e3247",
  color: "#E8E6F0",
}

export function ArcBarChart({ data, height = 200, formatValue = (v) => `$${v}` }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBar data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "#7a8fa8" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#7a8fa8" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "rgba(77,142,233,0.06)", radius: 8 }}
          formatter={(value) => [formatValue(Number(value)), "Spend"]}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.color ?? "#4d8ee9"}
              opacity={0.85}
            />
          ))}
        </Bar>
      </RechartsBar>
    </ResponsiveContainer>
  )
}

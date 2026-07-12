"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { CATEGORY_BREAKDOWN } from "@/data/mock"

export function CategoryChart() {
  return (
    <div className="min-w-0">
      <ResponsiveContainer width="100%" height={176}>
        <PieChart>
          <Pie
            data={CATEGORY_BREAKDOWN}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={68}
            paddingAngle={3}
            dataKey="value"
          >
            {CATEGORY_BREAKDOWN.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#1e3247",
              color: "#E8E6F0",
            }}
            formatter={(value) => [`${value}%`, ""]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {CATEGORY_BREAKDOWN.map((entry) => (
          <div className="flex min-w-0 items-center gap-1.5 text-[10px]" key={entry.name}>
            <span className="size-2 shrink-0 rounded-full" style={{ background: entry.color }} />
            <span className="min-w-0 truncate" style={{ color: "#C7C5D1" }}>{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

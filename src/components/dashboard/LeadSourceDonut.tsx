'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { LeadSourceData } from '@/lib/types'
import { SOURCE_LABELS } from '@/lib/types'

interface Props { data: LeadSourceData[] }

const COLORS = ['#C9A84C', '#9A7A32', '#6366F1', '#22C55E', '#F97316', '#8B5CF6']

export default function LeadSourceDonut({ data }: Props) {
  const displayData = data.map((d) => ({
    ...d,
    name: SOURCE_LABELS[d.source as keyof typeof SOURCE_LABELS] ?? d.source,
  }))

  return (
    <div className="is-card">
      <h3 className="text-text-primary font-semibold text-sm mb-4">Lead Sources</h3>
      {data.length === 0 ? (
        <div className="h-[240px] flex items-center justify-center text-text-secondary text-sm">
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="count"
            >
              {displayData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A1A26',
                border: '1px solid #2A2A38',
                borderRadius: '8px',
                color: '#F5F5F0',
                fontSize: 12,
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: '#9A9A8A', fontSize: 11 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
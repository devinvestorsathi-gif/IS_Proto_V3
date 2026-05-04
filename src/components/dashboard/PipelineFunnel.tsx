'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { PipelineFunnelData } from '@/lib/types'

interface Props { data: PipelineFunnelData[] }

const COLORS = [
  '#3B82F6', '#8B5CF6', '#EAB308', '#F97316',
  '#EC4899', '#6366F1', '#22C55E', '#EF4444'
]

export default function PipelineFunnel({ data }: Props) {
  return (
    <div className="is-card">
      <h3 className="text-text-primary font-semibold text-sm mb-4">Pipeline Funnel</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" tick={{ fill: '#9A9A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: '#9A9A8A', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A26',
              border: '1px solid #2A2A38',
              borderRadius: '8px',
              color: '#F5F5F0',
              fontSize: 12,
            }}
            cursor={{ fill: 'rgba(201,168,76,0.05)' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
"use client"

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface ChartDataPoint {
  date: string
  calls: number
  meetings: number
}

interface Props {
  data: ChartDataPoint[]
}

export default function WeeklyTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ right: 16 }}>
        <XAxis dataKey="date" tick={{ fill: '#9A9A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#9A9A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
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
          formatter={(v) => <span style={{ color: '#9A9A8A', fontSize: 11 }}>{v}</span>}
        />
        <Line type="monotone" dataKey="calls" stroke="#C9A84C" strokeWidth={2} dot={false} name="Calls / WhatsApp" />
        <Line type="monotone" dataKey="meetings" stroke="#22C55E" strokeWidth={2} dot={false} name="Meetings" />
      </LineChart>
    </ResponsiveContainer>
  )
}

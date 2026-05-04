import { createClient } from '@/lib/supabase/server'
import WeeklyTrendChart from './WeeklyTrendChart'

interface Props {
  userId:  string
  role:    string
  teamId:  string | null
}

export default async function WeeklyTrend({ userId, role, teamId }: Props) {
  const supabase = await createClient()

  // Last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const query = supabase
    .from('interactions')
    .select('logged_at, type, leads!inner(assigned_to, team_id)')
    .gte('logged_at', sevenDaysAgo.toISOString())

  const { data: interactions = [] } = await query

  // Filter by role scope
  const scoped = (interactions ?? []).filter((i) => {
    const lead = Array.isArray(i.leads) ? i.leads[0] : i.leads
    if (!lead) return false
    if (role === 'sales_rep')  return lead.assigned_to === userId
    if (role === 'team_lead')  return lead.team_id === teamId
    return true
  })

  // Group by date
  const dayMap: Record<string, { calls: number; meetings: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    dayMap[key] = { calls: 0, meetings: 0 }
  }

  scoped.forEach((interaction) => {
    const key = new Date(interaction.logged_at).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short'
    })
    if (dayMap[key]) {
      if (interaction.type === 'call' || interaction.type === 'whatsapp') dayMap[key].calls++
      if (interaction.type === 'meeting') dayMap[key].meetings++
    }
  })

  const chartData = Object.entries(dayMap).map(([date, values]) => ({ date, ...values }))

  return (
    <div className="is-card">
      <h3 className="text-text-primary font-semibold text-sm mb-4">Weekly Activity (Last 7 Days)</h3>
      <WeeklyTrendChart data={chartData} />
    </div>
  )
}

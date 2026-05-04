import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KPICard from '@/components/dashboard/KPICard'
import PipelineFunnel from '@/components/dashboard/PipelineFunnel'
import LeadSourceDonut from '@/components/dashboard/LeadSourceDonut'
import WeeklyTrend from '@/components/dashboard/WeeklyTrend'
import {
  Target, Users, TrendingUp, PhoneCall, Star, DollarSign
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, team_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Build scope filter based on role
  let leadsQuery = supabase.from('leads').select('*')
  if (profile.role === 'sales_rep') {
    leadsQuery = leadsQuery.eq('assigned_to', user.id)
  } else if (profile.role === 'team_lead') {
    leadsQuery = leadsQuery.eq('team_id', profile.team_id)
  }
  // admin sees everything — no filter

  const { data: leads = [] } = await leadsQuery

  // Compute KPIs
  const totalLeads    = leads?.length ?? 0
  const converted     = leads?.filter((l) => l.stage === 'converted').length ?? 0
  const convRate      = totalLeads > 0 ? (converted / totalLeads) * 100 : 0

  // Qualified = reached meeting_scheduled, site_visit, negotiation, or converted
  const QUALIFIED_STAGES = ['meeting_scheduled', 'site_visit', 'negotiation', 'converted']
  const qualified     = leads?.filter((l) => QUALIFIED_STAGES.includes(l.stage)).length ?? 0
  const qualifiedPct  = totalLeads > 0 ? (qualified / totalLeads) * 100 : 0

  // Leads with upcoming follow-up
  const today = new Date().toISOString().split('T')[0]
  const withFollowUp = leads?.filter(
    (l) => l.follow_up_date && l.follow_up_date >= today && !l.is_lost
  ).length ?? 0
  const activeLeads    = leads?.filter((l) => !l.is_lost && l.stage !== 'converted').length ?? 1
  const followUpRate   = activeLeads > 0 ? (withFollowUp / activeLeads) * 100 : 0

  const avgScore = leads && leads.length > 0
    ? leads.reduce((sum, l) => sum + (l.lead_score ?? 0), 0) / leads.filter((l) => l.lead_score).length
    : 0

  // Revenue from payments
  const revenueQuery = supabase
    .from('payment_milestones')
    .select('amount, client_id, client_profiles!inner(lead_id, leads!inner(assigned_to, team_id))')
    .eq('status', 'paid')

  const { data: payments = [] } = await revenueQuery
  const revenue = payments?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0

  // Pipeline funnel data
  const STAGE_ORDER = [
    'new_lead', 'contacted', 'interested', 'meeting_scheduled',
    'site_visit', 'negotiation', 'converted', 'lost'
  ]
  const funnelData = STAGE_ORDER.map((stage) => ({
    stage,
    count: leads?.filter((l) => l.stage === stage).length ?? 0,
    label: stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }))

  // Source breakdown
  const sourceMap: Record<string, number> = {}
  leads?.forEach((l) => {
    sourceMap[l.source] = (sourceMap[l.source] ?? 0) + 1
  })
  const sourceData = Object.entries(sourceMap).map(([source, count]) => ({ source, count }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary">
          Good {getGreeting()}, {profile.full_name.split(' ')[0]} 👋
        </h2>
        <p className="text-text-secondary text-sm mt-0.5">
          Here&apos;s your pipeline snapshot
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Qualified Conversion"
          value={qualifiedPct}
          format="percent"
          icon={Target}
          subtitle="North Star Metric"
          highlight
        />
        <KPICard
          title="Total Leads"
          value={totalLeads}
          format="number"
          icon={Users}
        />
        <KPICard
          title="Conversion Rate"
          value={convRate}
          format="percent"
          icon={TrendingUp}
          subtitle={`${converted} converted`}
        />
        <KPICard
          title="Follow-up Rate"
          value={followUpRate}
          format="percent"
          icon={PhoneCall}
          subtitle={`${withFollowUp} upcoming`}
        />
        <KPICard
          title="Avg Lead Score"
          value={isNaN(avgScore) ? 0 : avgScore}
          format="number"
          icon={Star}
          subtitle="out of 10"
        />
        <KPICard
          title="Revenue Collected"
          value={revenue}
          format="currency"
          icon={DollarSign}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineFunnel data={funnelData} />
        <LeadSourceDonut data={sourceData} />
      </div>

      <div className="grid grid-cols-1">
        <WeeklyTrend userId={user.id} role={profile.role} teamId={profile.team_id} />
      </div>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
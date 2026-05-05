import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Mail, ShieldCheck, User, Target, Activity, Clock } from 'lucide-react'

export const metadata = {
  title: 'Sales Team | Investor Sathi CRM',
}

interface PipelineLead {
  id: string
  stage: string
  last_contacted_at: string | null
}

interface TeamData {
  name: string
}

interface SalespersonRecord {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
  is_active: boolean
  teams: TeamData | null 
  leads: PipelineLead[]
}

export default async function SalespersonsPage() {
  const supabase = await createClient()

  // 1. Authenticate and enforce role-based access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single()

  if (!currentUserProfile || currentUserProfile.role === 'sales_rep') {
    redirect('/dashboard')
  }

  // 2. Fetch sales team profiles with EXPLICIT team relationship[cite: 1]
  let query = supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      phone,
      role,
      is_active,
      teams!team_id ( name ), 
      leads (
        id,
        stage,
        last_contacted_at
      )
    `)
    .in('role', ['sales_rep', 'team_lead'])
    // EXCLUSION: Do not show the current user in their own team list[cite: 1]
    .neq('id', user.id) 
    .order('role', { ascending: false }) 
    .order('full_name', { ascending: true })

  // Explicit filter: Team leads only see their own team members[cite: 1]
  if (currentUserProfile.role === 'team_lead' && currentUserProfile.team_id) {
    query = query.eq('team_id', currentUserProfile.team_id)
  }

  const { data, error } = await query
  
  const salespersons = (data as unknown as SalespersonRecord[]) || []

  if (error) {
    console.error("Supabase Error fetching salespersons:", error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Sales Team Performance</h1>
        <p className="text-sm text-zinc-400">
          Overview of your authorized representatives and their pipeline metrics.[cite: 1]
        </p>
      </div>

      <div className="bg-[#121214] border border-zinc-800/60 rounded-xl overflow-hidden shadow-lg">
        {salespersons.length === 0 ? (
          <div className="py-16 text-center">
            <User className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
            <p className="text-zinc-400 text-sm">No sales representatives found in your team.[cite: 1]</p>
            {error && <p className="text-red-400 text-xs mt-2">Error: {error.message}</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#18181b] border-b border-zinc-800/60 text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                <tr>
                  <th className="py-4 px-6">Representative</th>
                  <th className="py-4 px-6">Pipeline Overview</th>
                  <th className="py-4 px-6">Recent Activity</th>
                  <th className="py-4 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {salespersons.map((person) => {
                  const totalLeads = person.leads.length
                  const convertedLeads = person.leads.filter(l => l.stage === 'converted').length
                  const activeLeads = person.leads.filter(l => l.stage !== 'converted' && l.stage !== 'lost').length
                  
                  const contactTimestamps = person.leads
                    .map(l => l.last_contacted_at ? new Date(l.last_contacted_at).getTime() : 0)
                    .filter(t => t > 0)
                  const lastActive = contactTimestamps.length > 0 
                    ? new Date(Math.max(...contactTimestamps)).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                    : 'No activity'

                  return (
                    <tr key={person.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-600 flex items-center justify-center text-white font-semibold shadow-inner">
                            {person.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium">{person.full_name}</p>
                              {person.role === 'team_lead' && (
                                <span title="Team Lead" className="flex items-center">
                                  <ShieldCheck size={14} className="text-gold" />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                                <Mail size={10} /> {person.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-5 px-6">
                        <div className="flex items-center gap-5">
                          <div className="flex flex-col">
                            <span className="text-2xl font-semibold text-white leading-none">{totalLeads}</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-1">Total Leads</span>
                          </div>
                          <div className="h-8 w-px bg-zinc-800" />
                          <div className="flex flex-col gap-1.5">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                              <Target size={12} /> {convertedLeads} Converted
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-medium text-blue-400">
                              <Activity size={12} /> {activeLeads} Active
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2 text-zinc-300 bg-zinc-800/30 w-max px-3 py-1.5 rounded-md border border-zinc-800">
                          <Clock size={13} className="text-zinc-500" />
                          <span className="text-xs">{lastActive}</span>
                        </div>
                      </td>

                      <td className="py-5 px-6 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded-full border border-zinc-800">
                            <div className={`w-1.5 h-1.5 rounded-full ${person.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className={`text-[10px] uppercase tracking-wider font-bold ${person.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                              {person.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-medium tracking-tight">
                            {person.teams?.name || 'Unassigned'}[cite: 1]
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
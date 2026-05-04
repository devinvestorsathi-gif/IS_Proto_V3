import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LeadTable from '@/components/leads/LeadTable'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single()
    
  if (!profile) redirect('/login')

  // 1. Fetch team members but EXCLUDE the current user (Priya)
  let teamMembers: { id: string; full_name: string }[] = []
  
  if (profile.team_id) {
    const { data: members } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('team_id', profile.team_id)
      .in('role', ['sales_rep', 'team_lead'])
      // EXCLUSION: Filter out Priya's own ID from the filter list
      .neq('id', user.id) 
      .order('full_name', { ascending: true })
    
    teamMembers = members || []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Leads</h2>
          <p className="text-zinc-400 text-sm mt-0.5">Track and manage your pipeline</p>
        </div>
        <a href="/leads/new" className="bg-gold hover:bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          + New Lead
        </a>
      </div>

      <LeadTable 
        userRole={profile.role} 
        teamMembers={teamMembers} 
      />
    </div>
  )
}
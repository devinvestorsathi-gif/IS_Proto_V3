import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PaymentMilestonesManager from '@/components/clients/PaymentMilestonesManager' 

interface Props {
  params: {
    id: string
  }
}

export default async function ClientDetailPage({ params }: Props) {
  const supabase = await createClient()

  // 1. Fetch current user and their role
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  const userRole = profile?.role || 'sales_rep'

  // 2. Fetch the specific client profile
  const { data: client, error: clientError } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  // If the client doesn't exist or RLS blocks access, show a 404
  if (clientError || !client) {
    notFound()
  }

  // 3. Fetch their payment milestones
  const { data: milestones } = await supabase
    .from('payment_milestones')
    .select('*')
    .eq('client_id', params.id)
    .order('due_date', { ascending: true })

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/clients" className="text-sm text-text-secondary hover:text-[#d4af37] mb-2 inline-block transition-colors">
            ← Back to Clients
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-3">
            {client.full_name}
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
              Onboarded
            </span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Client ID: <span className="font-mono text-xs">{client.id}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="is-card rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-text-primary mb-4 border-b border-border pb-2">Contact Information</h3>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-text-secondary text-xs mb-1">Phone</dt>
                <dd className="text-text-primary font-medium">{client.phone}</dd>
              </div>
              <div>
                <dt className="text-text-secondary text-xs mb-1">Email</dt>
                <dd className="text-text-primary font-medium">{client.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-text-secondary text-xs mb-1">Location</dt>
                <dd className="text-text-primary font-medium">{client.city}{client.state ? `, ${client.state}` : ''}</dd>
              </div>
            </dl>
          </div>

          <div className="is-card rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-text-primary mb-4 border-b border-border pb-2">Investment Details</h3>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-text-secondary text-xs mb-1">Project Interest</dt>
                <dd className="text-text-primary font-medium">{client.project_interest || '—'}</dd>
              </div>
              <div>
                <dt className="text-text-secondary text-xs mb-1">Unit/Plot</dt>
                <dd className="text-text-primary font-medium">{client.plot_unit_details || '—'}</dd>
              </div>
              <div>
                <dt className="text-text-secondary text-xs mb-1">Budget</dt>
                <dd className="text-text-primary font-medium">{client.investment_budget || '—'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right Column: Interactive Payment Milestones Component */}
        <div className="lg:col-span-2">
          <PaymentMilestonesManager 
            clientId={client.id} 
            clientName={client.full_name}
            clientEmail={client.email}
            initialMilestones={milestones || []} 
            userRole={userRole}
          />
        </div>
      </div>
    </div>
  )
}
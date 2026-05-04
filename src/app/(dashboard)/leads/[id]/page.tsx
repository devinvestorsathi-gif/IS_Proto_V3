import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { STAGE_LABELS, SOURCE_LABELS, type LeadStage, type LeadSource } from '@/lib/types'
import { getStageColor, formatDate, isOverdue } from '@/lib/utils/formatters'
import { Calendar, Star } from 'lucide-react'

// Importing the interactive client components
import StageSelector from '@/components/leads/StageSelector'
import InteractionLog from '@/components/leads/InteractionLog'
import SalesNotes from '@/components/leads/SalesNotes'
import MagicLinkButton from '@/components/leads/MagicLinkButton'

interface Props {
  params: { id: string }
}

export default async function LeadDetailPage({ params }: Props) {
  const supabase = await createClient()

  const { data: lead, error } = await supabase
    .from('leads')
    .select(`
      *,
      lead_notes(*),
      interactions(*),
      lead_stage_history(*)
    `)
    .eq('id', params.id)
    .single()

  if (error || !lead) {
    notFound()
  }

  const interactions = lead.interactions?.sort((a: { logged_at: string }, b: { logged_at: string }) => 
    new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  ) || []

  // MERGE THE DATA: The leads table is now the master record for score and follow_up
  const initialNotesState = {
    ...lead.lead_notes?.[0],
    lead_score: lead.lead_score ?? lead.lead_notes?.[0]?.lead_score ?? 5,
    follow_up_date: lead.follow_up_date ?? lead.lead_notes?.[0]?.follow_up_date ?? ''
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Link href="/leads" className="text-sm text-text-secondary hover:text-[#d4af37] transition-colors">
          ← Back to Leads
        </Link>
        {lead.stage === 'converted' && <MagicLinkButton leadId={lead.id} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          <div className="is-card rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex justify-between items-start border-b border-border pb-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{lead.full_name}</h1>
                <p className="text-text-secondary text-sm mt-1">{lead.city || 'Location not specified'}</p>
              </div>
              <span className={`pipeline-badge ${getStageColor(lead.stage)}`}>
                {STAGE_LABELS[lead.stage as LeadStage]}
              </span>
            </div>

            {/* EXPANDED GRID: Now includes Key Metrics directly from the leads table */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Contact Info</p>
                <p className="text-sm text-text-primary font-medium">{lead.phone}</p>
                <p className="text-sm text-text-primary">{lead.email || 'No email provided'}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Source</p>
                <p className="text-sm text-text-primary">{SOURCE_LABELS[lead.source as LeadSource]}</p>
              </div>
              <div className="bg-surface-raised/30 p-3 rounded-lg border border-border/50">
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Key Metrics</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-text-primary">
                    <Star size={14} className="text-gold" />
                    <span>Score: <strong className="text-gold">{lead.lead_score ?? 5}/10</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className={lead.follow_up_date && isOverdue(lead.follow_up_date) ? 'text-red-400' : 'text-text-secondary'} />
                    <span className={lead.follow_up_date && isOverdue(lead.follow_up_date) ? 'text-red-400' : 'text-text-primary'}>
                      {lead.follow_up_date ? formatDate(lead.follow_up_date) : 'No follow-up set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pass the fully merged state into the component */}
          <SalesNotes leadId={lead.id} initialNotes={initialNotesState} />
        </div>

        <div className="space-y-6">
          <StageSelector leadId={lead.id} currentStage={lead.stage as LeadStage} />
          <InteractionLog leadId={lead.id} interactions={interactions} />
        </div>
      </div>
    </div>
  )
}
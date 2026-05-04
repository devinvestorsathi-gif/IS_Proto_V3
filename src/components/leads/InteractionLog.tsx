'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Phone, MessageSquare, Users, Mail, Plus } from 'lucide-react'
import type { Interaction, InteractionType, InteractionOutcome } from '@/lib/types'
import { timeAgo } from '@/lib/utils/formatters'

const TYPE_ICONS: Record<InteractionType, React.ReactNode> = {
  call:     <Phone size={13} />,
  whatsapp: <MessageSquare size={13} />,
  meeting:  <Users size={13} />,
  email:    <Mail size={13} />,
  other:    <Plus size={13} />,
}

const OUTCOMES: InteractionOutcome[] = [
  'answered', 'no_answer', 'busy', 'callback_requested', 'meeting_set',
]
const TYPES: InteractionType[] = ['call', 'whatsapp', 'meeting', 'email', 'other']

interface Props { 
  leadId: string
  interactions: Interaction[] 
}

export default function InteractionLog({ leadId, interactions }: Props) {
  const router = useRouter()
  const [adding, setAdding]   = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({
    type: 'call' as InteractionType,
    outcome: 'answered' as InteractionOutcome,
    notes: '',
    duration_minutes: '',
    follow_up_required: false,
    follow_up_date: '',
  })

  async function handleAdd() {
    setSaving(true)
    const res = await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id:           leadId,
        type:              form.type,
        outcome:           form.outcome,
        notes:             form.notes,
        duration_minutes:  form.duration_minutes ? parseInt(form.duration_minutes) : null,
        follow_up_required: form.follow_up_required,
        follow_up_date:    form.follow_up_date || null,
      }),
    })
    
    setSaving(false)
    
    if (res.ok) {
      setAdding(false)
      setForm({
        type: 'call', outcome: 'answered', notes: '',
        duration_minutes: '', follow_up_required: false, follow_up_date: '',
      })
      // Tell Next.js to re-fetch the server component so the new interaction appears immediately
      router.refresh()
    } else {
      console.error("Failed to save interaction")
    }
  }

  return (
    <div className="is-card space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-text-primary font-semibold text-sm">
          Interaction Log
          <span className="ml-2 text-text-secondary font-normal">({interactions.length})</span>
        </h3>
        <button
          onClick={() => setAdding(!adding)}
          className="text-gold text-xs hover:text-[#f3e5ab] flex items-center gap-1 transition-colors"
        >
          <Plus size={13} /> {adding ? 'Cancel' : 'Log'}
        </button>
      </div>

      {adding && (
        <div className="bg-surface-dark rounded-lg p-4 space-y-3 border border-border">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Type</label>
              <select
                className="is-input text-sm w-full bg-[#1A1A26] text-white"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as InteractionType }))}
                aria-label="Interaction type"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#1A1A26] text-white">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Outcome</label>
              <select
                className="is-input text-sm w-full bg-[#1A1A26] text-white"
                value={form.outcome}
                onChange={(e) => setForm((p) => ({ ...p, outcome: e.target.value as InteractionOutcome }))}
                aria-label="Interaction outcome"
              >
                {OUTCOMES.map((o) => (
                  <option key={o} value={o} className="bg-[#1A1A26] text-white">
                    {o.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-text-secondary mb-1 block">Notes</label>
            <textarea
              className="is-input text-sm w-full resize-none bg-[#1A1A26] text-white"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="What happened on this call?"
              aria-label="Interaction notes"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Duration (mins)</label>
              <input
                className="is-input text-sm w-full bg-[#1A1A26] text-white"
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))}
                placeholder="15"
                aria-label="Duration in minutes"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Follow-up Date</label>
              <input
                className="is-input text-sm w-full bg-[#1A1A26] text-white [color-scheme:dark]"
                type="date"
                value={form.follow_up_date}
                onChange={(e) => setForm((p) => ({ ...p, follow_up_date: e.target.value }))}
                aria-label="Follow-up date"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border mt-2">
            <button 
              onClick={() => setAdding(false)} 
              className="px-4 py-2 border border-border text-text-primary text-xs font-semibold rounded-lg hover:bg-surface-raised flex-1 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex-1 bg-gold text-black text-xs font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 size={12} className="animate-spin" />} Save Interaction
            </button>
          </div>
        </div>
      )}

      {interactions.length === 0 ? (
        <div className="text-center py-8 text-text-secondary text-sm">
          No interactions yet. Log your first contact above.
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
          {interactions.map((interaction) => {
            const profile = interaction.logged_by_profile as { full_name?: string } | undefined
            return (
              <div key={interaction.id} className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 bg-surface-dark border border-border
                                rounded-full flex items-center justify-center text-text-secondary mt-0.5">
                  {TYPE_ICONS[interaction.type]}
                </div>
                <div className="flex-1 min-w-0 pb-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-text-primary text-xs font-medium capitalize">
                      {interaction.type} ·{' '}
                      <span className="text-text-secondary font-normal">
                        {interaction.outcome?.replace(/_/g, ' ')}
                      </span>
                    </p>
                    <span className="text-text-secondary text-xs flex-shrink-0">
                      {timeAgo(interaction.logged_at)}
                    </span>
                  </div>
                  {interaction.notes && (
                    <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                      {interaction.notes}
                    </p>
                  )}
                  {interaction.follow_up_date && (
                    <p className="text-gold text-xs mt-1.5 font-medium flex items-center gap-1">
                      📅 Follow-up: {new Date(interaction.follow_up_date).toLocaleDateString('en-IN')}
                    </p>
                  )}
                  <p className="text-text-secondary text-[10px] mt-1.5 font-medium">
                    {profile?.full_name ?? 'You'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

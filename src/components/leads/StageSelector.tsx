'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { LeadStage, LostReason } from '@/lib/types'
import { STAGE_LABELS, STAGE_ORDER, LOST_REASON_LABELS } from '@/lib/types'
import { getStageColor } from '@/lib/utils/formatters'

interface Props { 
  leadId: string
  currentStage: string
  isLost?: boolean 
}

export default function StageSelector({ leadId, currentStage}: Props) {
  const router = useRouter()
  const [loading, setLoading]         = useState(false)
  const [showLostModal, setShowLostModal] = useState(false)
  const [lostReason, setLostReason]   = useState<LostReason>('price_issue')
  const [lostDetail, setLostDetail]   = useState('')
  const [notes, setNotes]             = useState('')
  const [error, setError]             = useState<string | null>(null)

  async function moveStage(stage: LeadStage, opts?: { lost_reason?: LostReason; lost_reason_detail?: string; notes?: string }) {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/leads/${leadId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        stage, 
        notes: opts?.notes, 
        lost_reason: opts?.lost_reason, 
        lost_reason_detail: opts?.lost_reason_detail 
      }),
    })
    setLoading(false)
    if (!res.ok) { 
      const j = await res.json()
      setError(j.error)
      return 
    }
    setShowLostModal(false)
    setNotes('') // Clear notes after successful update
    router.refresh()
  }

  function handleStageClick(stage: LeadStage) {
    if (stage === currentStage) return
    if (stage === 'lost') { 
      setShowLostModal(true)
      return 
    }
    moveStage(stage, { notes })
  }

  return (
    <div className="space-y-4 is-card rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-text-primary mb-2 border-b border-border pb-2">Pipeline Stage</h3>
      
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

      {/* Stage pipeline buttons */}
      <div className="flex flex-wrap gap-2">
        {STAGE_ORDER.map((stage) => {
          const isCurrent = stage === currentStage
          return (
            <button
              key={stage}
              onClick={() => handleStageClick(stage)}
              disabled={loading}
              className={`
                pipeline-badge cursor-pointer transition-all text-xs px-3 py-1.5 font-medium
                ${isCurrent ? getStageColor(stage) + ' ring-2 ring-gold/40 scale-105' : getStageColor(stage) + ' opacity-50 hover:opacity-100 hover:scale-105'}
              `}
            >
              {isCurrent && loading && <Loader2 size={10} className="animate-spin inline mr-1" />}
              {STAGE_LABELS[stage]}
            </button>
          )
        })}
      </div>

      {/* Notes for stage change */}
      <div className="pt-2">
        <label className="text-text-secondary text-xs mb-1 block">Notes for this stage change (optional)</label>
        <input
          className="is-input text-sm w-full bg-[#1A1A26] text-white"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Client requested site visit next week..."
        />
      </div>

      {/* Lost modal */}
      {showLostModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="is-card max-w-md w-full p-6 space-y-4 rounded-xl border border-border bg-[#1A1A26]">
            <h3 className="text-lg text-text-primary font-bold">Mark as Lost</h3>
            <p className="text-text-secondary text-sm">Please select a reason before marking this lead as lost.</p>

            <div className="space-y-2">
              <label htmlFor="lost-reason" className="text-sm font-medium text-text-primary">Lost Reason *</label>
              <select 
                id="lost-reason" 
                className="is-input w-full bg-[#1A1A26] text-white" 
                value={lostReason} 
                onChange={(e) => setLostReason(e.target.value as LostReason)}
              >
                {Object.entries(LOST_REASON_LABELS).map(([v, l]) => (
                  <option key={v} value={v} className="bg-[#1A1A26] text-white">{l}</option>
                ))}
              </select>
            </div>

            {lostReason === 'other' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Details</label>
                <input 
                  className="is-input w-full" 
                  value={lostDetail} 
                  onChange={(e) => setLostDetail(e.target.value)} 
                  placeholder="Describe the reason…" 
                />
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-border mt-4">
              <button 
                onClick={() => setShowLostModal(false)} 
                className="px-4 py-2 border border-border text-text-primary font-semibold rounded-lg hover:bg-surface-dark flex-1 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => moveStage('lost', { lost_reason: lostReason, lost_reason_detail: lostDetail, notes })}
                disabled={loading}
                className="flex-1 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
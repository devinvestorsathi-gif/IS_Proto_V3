'use client'

import { STAGE_LABELS, type LeadStage } from '@/lib/types'
import { getStageColor, timeAgo } from '@/lib/utils/formatters'
import { ArrowRight, History } from 'lucide-react'

interface StageHistoryRecord {
  id?: string
  from_stage: string
  to_stage: string
  notes?: string
  changed_at: string
}

interface Props {
  history: StageHistoryRecord[]
}

export default function StageHistory({ history }: Props) {
  if (!history || history.length === 0) return null

  return (
    <div className="is-card space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <History size={16} className="text-text-secondary" />
        <h3 className="text-sm font-semibold text-text-primary">Stage History</h3>
      </div>

      <div className="space-y-4 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
        {history.map((record, idx) => (
          <div key={record.id || idx} className="pb-4 border-b border-border/50 last:border-0 last:pb-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-xs font-medium bg-[#1A1A26] px-2 py-1 rounded-md border border-border/50">
                <span className="text-text-secondary">
                  {STAGE_LABELS[record.from_stage as LeadStage] || 'New'}
                </span>
                <ArrowRight size={12} className="text-text-secondary" />
                <span className={`${getStageColor(record.to_stage as LeadStage)}`}>
                  {STAGE_LABELS[record.to_stage as LeadStage] || record.to_stage}
                </span>
              </div>
              <span className="text-[10px] text-text-secondary flex-shrink-0">
                {record.changed_at ? timeAgo(record.changed_at) : 'Just now'}
              </span>
            </div>
            
            {record.notes && (
              <div className="mt-1 ml-1 pl-3 border-l-2 border-gold/30">
                <p className="text-xs text-text-secondary leading-relaxed italic">
                  {record.notes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
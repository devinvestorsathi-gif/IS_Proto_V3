/* eslint-disable */
'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import type { LeadNote, InterestLevel, Sentiment, ObjectionCategory } from '@/lib/types'

interface Props {
  leadId: string
  initialNotes?: Partial<LeadNote> | null
}

export default function SalesNotes({ leadId, initialNotes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [notes, setNotes]     = useState<Partial<LeadNote>>(initialNotes || {})
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  // Bulletproof hydration: Deep sync when server data changes
  useEffect(() => {
    if (initialNotes) {
      setNotes(initialNotes)
    }
  }, [initialNotes?.lead_score, initialNotes?.follow_up_date, initialNotes?.call_summary]) 

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/leads/${leadId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notes),
    })
    
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      
      startTransition(() => {
        router.refresh()
      })
    } else {
      console.error("Failed to save notes")
    }
  }

  function upd(key: keyof LeadNote, value: string | number) {
    setNotes((p) => ({ ...p, [key]: value }))
  }

  const isWorking = saving || isPending;

  return (
    <div className="is-card rounded-xl border border-border bg-card shadow-sm">
      
      {/* Header - Removed sticky to allow natural flow */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-text-primary tracking-wide">Sales Notes</h3>
        <button 
          onClick={handleSave} 
          disabled={isWorking} 
          className="bg-gold text-black text-xs font-semibold py-1.5 px-4 rounded-md hover:bg-opacity-90 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(212,175,55,0.1)] hover:shadow-[0_0_15px_rgba(212,175,55,0.2)]"
        >
          {isWorking ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? 'Saved!' : isPending ? 'Syncing...' : 'Save Changes'}
        </button>
      </div>

      {/* Form Body - Tighter Grid & No internal scrolling */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          
          {/* Call Summary (Spans 2 columns) */}
          <div className="md:col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-text-secondary/80 font-semibold mb-1 block">Call Summary</label>
            <textarea 
              className="w-full resize-none bg-[#1A1A26] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-text-secondary/40 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all" 
              rows={2}
              value={notes.call_summary ?? ''}
              onChange={(e) => upd('call_summary', e.target.value)}
              placeholder="Brief details of your last conversation..." 
            />
          </div>

          {/* Interest Level */}
          <div>
            <label htmlFor="interest_level" className="text-[10px] uppercase tracking-widest text-text-secondary/80 font-semibold mb-1 block">Interest Level</label>
            <select 
              id="interest_level" 
              className="w-full bg-[#1A1A26] border border-white/5 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all" 
              value={notes.interest_level ?? ''}
              onChange={(e) => upd('interest_level', e.target.value as InterestLevel)}
            >
              <option value="" className="bg-[#1A1A26] text-white">— Select —</option>
              {(['high','medium','low'] as InterestLevel[]).map((v) => (
                <option key={v} value={v} className="bg-[#1A1A26] text-white">
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Sentiment */}
          <div>
            <label htmlFor="sentiment" className="text-[10px] uppercase tracking-widest text-text-secondary/80 font-semibold mb-1 block">Sentiment</label>
            <select 
              id="sentiment" 
              className="w-full bg-[#1A1A26] border border-white/5 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all" 
              value={notes.sentiment ?? ''}
              onChange={(e) => upd('sentiment', e.target.value as Sentiment)}
            >
              <option value="" className="bg-[#1A1A26] text-white">— Select —</option>
              {(['positive','neutral','negative'] as Sentiment[]).map((v) => (
                <option key={v} value={v} className="bg-[#1A1A26] text-white">
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Lead Score Slider (Integrated) */}
          <div className="flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
              <label htmlFor="lead_score" className="text-[10px] uppercase tracking-widest text-text-secondary/80 font-semibold">Lead Score</label>
              <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-md border border-gold/20">
                {notes.lead_score ?? 5} / 10
              </span>
            </div>
            <input 
              id="lead_score" 
              type="range" 
              min="1" 
              max="10" 
              value={notes.lead_score ?? 5}
              onChange={(e) => upd('lead_score', parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold mt-1" 
            />
          </div>

          {/* Follow-up Date */}
          <div>
            <label htmlFor="follow_up_date" className="text-[10px] uppercase tracking-widest text-text-secondary/80 font-semibold mb-1 block">Follow-up Date</label>
            <input 
              id="follow_up_date" 
              type="date" 
              className="w-full bg-[#1A1A26] border border-white/5 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all [color-scheme:dark]" 
              value={notes.follow_up_date ?? ''}
              onChange={(e) => upd('follow_up_date', e.target.value)} 
            />
          </div>

          {/* Next Step */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-text-secondary/80 font-semibold mb-1 block">Next Step</label>
            <input 
              className="w-full bg-[#1A1A26] border border-white/5 rounded-lg px-3 py-1.5 text-sm text-white placeholder-text-secondary/40 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all" 
              value={notes.next_step ?? ''}
              onChange={(e) => upd('next_step', e.target.value)} 
              placeholder="e.g. Schedule site visit" 
            />
          </div>

          {/* Main Objection */}
          <div>
            <label htmlFor="objection_category" className="text-[10px] uppercase tracking-widest text-text-secondary/80 font-semibold mb-1 block">Main Objection</label>
            <select 
              id="objection_category" 
              className="w-full bg-[#1A1A26] border border-white/5 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all" 
              value={notes.objection_category ?? ''}
              onChange={(e) => upd('objection_category', e.target.value as ObjectionCategory)}
            >
              <option value="" className="bg-[#1A1A26] text-white">None</option>
              {(['trust','price','timing','competition','other'] as ObjectionCategory[]).map((v) => (
                <option key={v} value={v} className="bg-[#1A1A26] text-white">
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Objection Detail (Conditional) */}
          {notes.objection_category && notes.objection_category !== 'other' && (
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-text-secondary/80 font-semibold mb-1 block">Objection Detail</label>
              <textarea 
                className="w-full resize-none bg-[#1A1A26] border border-red-500/20 rounded-lg px-3 py-2 text-sm text-white placeholder-text-secondary/40 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all" 
                rows={1}
                value={notes.objection_detail ?? ''} 
                onChange={(e) => upd('objection_detail', e.target.value)}
                placeholder="What specifically is the objection?" 
              />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
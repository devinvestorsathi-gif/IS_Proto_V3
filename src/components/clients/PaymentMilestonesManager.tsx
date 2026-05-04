'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CheckCircle, Loader2, X, Clock } from 'lucide-react'

interface Milestone {
  id: string
  client_id: string
  milestone_name: string
  amount: number
  due_date: string
  status: 'pending' | 'paid' | 'overdue'
  paid_on_date: string | null
}

interface Props {
  clientId: string
  clientName: string
  clientEmail: string
  initialMilestones: Milestone[]
  userRole: string
}

export default function PaymentMilestonesManager({ clientId, clientName, clientEmail, initialMilestones, userRole }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [isAdding, setIsAdding] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  const [newMilestone, setNewMilestone] = useState({
    milestone_name: '',
    amount: '',
    due_date: ''
  })

  const canManagePayments = userRole === 'admin' || userRole === 'team_lead'

  const formatINR = (amount: number | string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount))
  }

  const getDisplayStatus = (milestone: Milestone) => {
    if (milestone.status === 'paid') return 'paid'
    const isOverdue = new Date(milestone.due_date).getTime() < new Date().setHours(0, 0, 0, 0)
    return isOverdue ? 'overdue' : 'pending'
  }

  async function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault()
    if (!canManagePayments) return
    setProcessingId('new')

    const res = await fetch(`/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        milestone_name: newMilestone.milestone_name,
        amount: Number(newMilestone.amount),
        due_date: newMilestone.due_date,
      }),
    })

    setProcessingId(null)
    if (res.ok) {
      setNewMilestone({ milestone_name: '', amount: '', due_date: '' })
      setIsAdding(false)
      startTransition(() => {
        router.refresh()
      })
    }
  }

  async function handleMarkAsPaid(milestoneId: string) {
    if (!canManagePayments) return
    setProcessingId(milestoneId)

    const res = await fetch(`/api/payments/${milestoneId}/mark-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: clientName,
        client_email: clientEmail
      }),
    })

    setProcessingId(null)
    if (res.ok) {
      startTransition(() => {
        router.refresh()
      })
    }
  }

  return (
    /* FIXED: max-h-[502px] ensures it aligns with the bottom of the left column's second card[cite: 1] */
    <div className="is-card rounded-xl border border-border bg-card shadow-sm max-h-[515px] flex flex-col overflow-hidden">
      
      {/* Header - Sticky behavior through flex-col[cite: 1] */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0 bg-card">
        <div>
          <h3 className="text-sm font-semibold text-text-primary tracking-wide">Payment Milestones</h3>
          <p className="text-[11px] text-text-secondary mt-0.5">Manage schedule and receipts</p>
        </div>
        {!isAdding && canManagePayments && (
          <button 
            onClick={() => setIsAdding(true)} 
            className="bg-surface-raised border border-white/10 text-white text-xs font-semibold py-1.5 px-3 rounded-md hover:border-gold/50 hover:text-gold flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} /> Add Milestone
          </button>
        )}
      </div>

      {/* Internal Scroll Area[cite: 1] */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 
        scrollbar-thin scrollbar-thumb-gold/20 scrollbar-track-transparent hover:scrollbar-thumb-gold/40">
        
        {/* Add Milestone Inline Form */}
        {isAdding && canManagePayments && (
          <form onSubmit={handleAddMilestone} className="mb-6 bg-[#1A1A26] border border-gold/30 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-semibold text-gold uppercase tracking-wider">New Milestone</h4>
              <button aria-label="Close new milestone form" type="button" onClick={() => setIsAdding(false)} className="text-text-secondary hover:text-white">
                <X size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <label htmlFor="milestone_name" className="text-[10px] uppercase tracking-widest text-text-secondary/80 font-semibold mb-1 block">Title *</label>
                <input id="milestone_name" required type="text" value={newMilestone.milestone_name} onChange={e => setNewMilestone({...newMilestone, milestone_name: e.target.value})} className="w-full bg-[#12121A] border border-white/5 rounded-md px-3 py-2 text-sm text-white focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all" placeholder="e.g. Booking Amount" />
              </div>
              <div className="md:col-span-4">
                <label htmlFor="amount" className="text-[10px] uppercase tracking-widest text-text-secondary/80 font-semibold mb-1 block">Amount (₹) *</label>
                <input id="amount" required type="number" value={newMilestone.amount} onChange={e => setNewMilestone({...newMilestone, amount: e.target.value})} className="w-full bg-[#12121A] border border-white/5 rounded-md px-3 py-2 text-sm text-white focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all" placeholder="500000" />
              </div>
              <div className="md:col-span-3">
                <label htmlFor="due_date" className="text-[10px] uppercase tracking-widest text-text-secondary/80 font-semibold mb-1 block">Due Date *</label>
                <input id="due_date" required type="date" value={newMilestone.due_date} onChange={e => setNewMilestone({...newMilestone, due_date: e.target.value})} className="w-full bg-[#12121A] border border-white/5 rounded-md px-3 py-2 text-sm text-white focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all [color-scheme:dark]" />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button type="submit" disabled={processingId === 'new' || isPending} className="bg-gold text-black text-xs font-semibold py-2 px-5 rounded-md hover:bg-opacity-90 flex items-center gap-1.5 transition-all disabled:opacity-50">
                {processingId === 'new' || isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {processingId === 'new' || isPending ? 'Saving...' : 'Save Milestone'}
              </button>
            </div>
          </form>
        )}

        {/* Milestones List */}
        {!initialMilestones || initialMilestones.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-secondary flex flex-col items-center gap-3">
            <Clock size={32} className="text-white/10" />
            <p>No payment milestones created yet.<br/>{canManagePayments ? 'Click "Add Milestone" to set up the payment schedule.' : 'Waiting for schedule to be set.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {initialMilestones.map((milestone) => {
              const displayStatus = getDisplayStatus(milestone)
              
              return (
                <div key={milestone.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-[#1A1A26] border border-white/5 hover:border-white/10 transition-colors gap-4">
                  <div>
                    <p className="text-sm font-semibold text-text-primary mb-1">{milestone.milestone_name}</p>
                    <p className="text-xs text-text-secondary flex items-center gap-1.5">
                      <Clock size={12} />
                      Due: {new Date(milestone.due_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      {milestone.status === 'paid' && milestone.paid_on_date && (
                        <span className="text-emerald-500/80 ml-2 border-l border-white/10 pl-2">
                          Paid on {new Date(milestone.paid_on_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <span className="text-[15px] font-bold text-white tracking-wide">
                      {formatINR(milestone.amount)}
                    </span>
                    
                    <div className="flex items-center gap-3">
                      {displayStatus !== 'paid' && canManagePayments && (
                        <button 
                          onClick={() => handleMarkAsPaid(milestone.id)}
                          disabled={processingId === milestone.id || isPending}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-[11px] font-semibold text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 hover:bg-emerald-400 hover:text-black px-3 py-1.5 rounded-md transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                          {processingId === milestone.id || isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                          Mark Paid
                        </button>
                      )}

                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        displayStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        displayStatus === 'overdue' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-gold/10 text-gold border-gold/20'
                      }`}>
                        {displayStatus}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
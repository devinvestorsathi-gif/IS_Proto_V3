'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Phone, Calendar, User } from 'lucide-react'
import type { Lead, UserRole } from '@/lib/types'
import { STAGE_LABELS, SOURCE_LABELS } from '@/lib/types'
import { getStageColor, formatDate, isOverdue } from '@/lib/utils/formatters'

const STAGES: { value: string; label: string }[] = [
  { value: '', label: 'All Stages' },
  ...Object.entries(STAGE_LABELS).map(([value, label]) => ({ value, label })),
]
const SOURCES: { value: string; label: string }[] = [
  { value: '', label: 'All Sources' },
  ...Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label })),
]

interface TeamMember {
  id: string
  full_name: string
}

interface LeadTableProps {
  userRole: UserRole
  teamMembers: TeamMember[] // Added new prop to fix the TypeScript error
}

export default function LeadTable({ userRole, teamMembers }: LeadTableProps) {
  const [leads, setLeads]     = useState<(Lead & { lead_notes?: { follow_up_date?: string | null }[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [stage, setStage]     = useState('')
  const [source, setSource]   = useState('')
  const [assignedTo, setAssignedTo] = useState('') // New filter state for 'Assigned To'

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (stage)  params.set('stage', stage)
    if (source) params.set('source', source)
    if (assignedTo) params.set('assigned_to', assignedTo) // Pass assigned_to to API

    const res  = await fetch(`/api/leads?${params.toString()}`)
    const json = await res.json()
    setLeads(json.data ?? [])
    setLoading(false)
  }, [search, stage, source, assignedTo])

  useEffect(() => {
    const timeout = setTimeout(fetchLeads, 300)
    return () => clearTimeout(timeout)
  }, [fetchLeads])

  return (
    <div className="space-y-4">
      {/* Filters Container */}
      <div className="flex flex-col xl:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email…"
            className="w-full bg-[#121214] border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="bg-[#121214] border border-zinc-800 text-zinc-300 text-sm px-4 py-2.5 rounded-lg focus:border-gold/50 outline-none min-w-[140px]"
          >
            {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="bg-[#121214] border border-zinc-800 text-zinc-300 text-sm px-4 py-2.5 rounded-lg focus:border-gold/50 outline-none min-w-[140px]"
          >
            {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* New 'Assigned To' Filter - Only visible for Admins/Team Leads */}
          {userRole !== 'sales_rep' && (
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="bg-[#121214] border border-zinc-800 text-zinc-300 text-sm px-4 py-2.5 rounded-lg focus:border-gold/50 outline-none min-w-[160px]"
            >
              <option value="">All Assigned To</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#121214] border border-zinc-800/60 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-sm">Loading pipeline…</div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-zinc-500 text-sm">No leads match your filters.</p>
            <button onClick={() => {setSearch(''); setStage(''); setSource(''); setAssignedTo('')}} className="text-gold text-xs mt-2 hover:underline">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#18181b] border-b border-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Lead Name</th>
                  <th className="py-4 px-6 hidden md:table-cell">Phone</th>
                  <th className="py-4 px-6">Stage</th>
                  <th className="py-4 px-6 hidden lg:table-cell">Source</th>
                  <th className="py-4 px-6 hidden lg:table-cell">Follow-up</th>
                  {userRole !== 'sales_rep' && (
                    <th className="py-4 px-6 hidden xl:table-cell">Assigned To</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {leads.map((lead) => {
                  const followUpDate = lead.lead_notes?.[0]?.follow_up_date || lead.follow_up_date;
                  const assignedName = (lead.assigned_profile as { full_name?: string } | undefined)?.full_name ?? 'Unassigned';

                  return (
                    <tr key={lead.id} className="hover:bg-zinc-800/20 transition-colors group">
                      <td className="py-4 px-6">
                        <Link href={`/leads/${lead.id}`} className="block">
                          <p className="text-white font-medium group-hover:text-gold transition-colors">
                            {lead.full_name}
                          </p>
                          {lead.city && <p className="text-zinc-500 text-xs mt-0.5">{lead.city}</p>}
                        </Link>
                      </td>
                      <td className="py-4 px-6 hidden md:table-cell">
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors">
                          <Phone size={13} /> {lead.phone}
                        </a>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStageColor(lead.stage)}`}>
                          {STAGE_LABELS[lead.stage as keyof typeof STAGE_LABELS]}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-zinc-400 hidden lg:table-cell text-xs">
                        {SOURCE_LABELS[lead.source as keyof typeof SOURCE_LABELS]}
                      </td>
                      <td className="py-4 px-6 hidden lg:table-cell">
                        {followUpDate ? (
                          <div className={`flex items-center gap-1.5 text-xs ${isOverdue(followUpDate) ? 'text-red-400 font-medium' : 'text-zinc-400'}`}>
                            <Calendar size={13} />
                            {formatDate(followUpDate)}
                          </div>
                        ) : <span className="text-zinc-600 text-xs">—</span>}
                      </td>
                      {userRole !== 'sales_rep' && (
                        <td className="py-4 px-6 hidden xl:table-cell">
                          <div className="flex items-center gap-2 text-zinc-400">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500 border border-zinc-700">
                              <User size={12} />
                            </div>
                            <span className="text-xs truncate max-w-[120px]">{assignedName}</span>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-zinc-500 text-[11px] uppercase tracking-widest font-bold">
          {leads.length} Result{leads.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SOURCE_LABELS } from '@/lib/types'

export default function NewLeadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    city: '',
    source: 'other'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/leads')
        router.refresh()
      } else {
        console.error('Failed to create lead')
        setLoading(false)
      }
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/leads" className="text-sm text-text-secondary hover:text-gold transition-colors">
          ← Back to Leads
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">Create New Lead</h1>
      </div>

      <form onSubmit={handleSubmit} className="is-card space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Full Name *</label>
            <input
              required
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="is-input w-full bg-[#1A1A26] text-white"
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Phone *</label>
            <input
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="is-input w-full bg-[#1A1A26] text-white"
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="is-input w-full bg-[#1A1A26] text-white"
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="is-input w-full bg-[#1A1A26] text-white"
              placeholder="e.g. Mumbai"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-text-primary">Lead Source *</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="is-input w-full bg-[#1A1A26] text-white"
            >
              {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value} className="bg-[#1A1A26] text-white">
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Lead'}
          </button>
        </div>
      </form>
    </div>
  )
}

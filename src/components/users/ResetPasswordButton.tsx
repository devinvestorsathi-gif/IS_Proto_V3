'use client'

import { useState } from 'react'
import { Mail, Loader2, Check } from 'lucide-react'

export default function ResetPasswordButton({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleReset() {
    setLoading(true)
    const res = await fetch('/api/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({ userId, email: userEmail }),
    })
    setLoading(false)
    if (res.ok) {
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading || sent}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
        sent 
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-gold/50 hover:text-gold'
      }`}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : sent ? <Check size={12} /> : <Mail size={12} />}
      {loading ? 'Sending...' : sent ? 'Email Sent' : 'Send Reset Email'}
    </button>
  )
}
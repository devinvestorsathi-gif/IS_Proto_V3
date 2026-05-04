'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, CheckCircle, Mail, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10">
        {/* Branding Section - Updated with Logo Image */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative w-32 h-20 mb-4">
            <Image 
              src="/logo.png" 
              alt="Investor Sathi Logo" 
              fill
              className="object-contain"
              priority 
            />
          </div>
          <h2 className="text-white text-xl font-bold tracking-tight">Investor Saathi</h2>
          <p className="text-gold text-[10px] uppercase tracking-[0.2em] mt-2 font-bold">Premium Account Recovery</p>
        </div>

        <div className="bg-[#121214] border border-zinc-800/60 rounded-2xl p-8 shadow-2xl backdrop-blur-sm relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

          {sent ? (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <CheckCircle className="text-emerald-500" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Check your inbox</h2>
              <p className="text-zinc-400 text-sm leading-relaxed px-2">
                We&apos;ve sent a secure reset link to <br/>
                <span className="text-white font-semibold">{email}</span>.
              </p>
              
              <div className="mt-10 pt-6 border-t border-zinc-800/50">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 text-zinc-400 text-sm hover:text-gold transition-colors"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <header className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Forgot password?</h1>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Enter your email and we&apos;ll send instructions to reset your password.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs text-red-400 flex items-start gap-3">
                    <div className="mt-0.5">⚠️</div>
                    <p className="leading-normal">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-gold transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@investorsaathi.com"
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-[#09090b] font-bold py-4 rounded-xl shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:brightness-110 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={20} />
                  )}
                  <span className="text-sm uppercase tracking-wider">{loading ? 'Sending Request...' : 'Send Recovery Link'}</span>
                </button>
              </form>

              <footer className="mt-8 pt-6 border-t border-zinc-800/50 text-center">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 text-zinc-500 text-sm hover:text-white transition-colors"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  Back to login
                </Link>
              </footer>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
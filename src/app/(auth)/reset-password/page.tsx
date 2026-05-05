'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, CheckCircle2, Lock, ShieldCheck, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'One uppercase',  pass: /[A-Z]/.test(password) },
    { label: 'One number',     pass: /\d/.test(password) },
    { label: 'One special char', pass: /[!@#$%^&*]/.test(password) },
  ]
  const score = checks.filter((c) => c.pass).length
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500']

  return (
    <div className="mt-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
      <div className="flex gap-1.5 mb-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i < score ? colors[score - 1] : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
        {checks.map((c) => (
          <div key={c.label} className={`text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-bold ${c.pass ? 'text-emerald-400' : 'text-zinc-600'}`}>
            <div className={`w-1 h-1 rounded-full ${c.pass ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [sessionReady, setReady]    = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })

    const timer = setTimeout(() => {
      if (!sessionReady) {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) setReady(true)
          else setError("The reset link is invalid or has expired.")
        })
      }
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [supabase.auth, sessionReady])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  if (!sessionReady && !error) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-gold mb-4" size={40} />
        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold animate-pulse">
          Validating Secure Link...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      
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
          <h2 className="text-white text-xl font-bold tracking-tight text-center leading-none">Investor Sathi</h2>
          <p className="text-gold text-[10px] uppercase tracking-[0.2em] mt-2 font-bold">Secure Account Recovery</p>
        </div>

        <div className="bg-[#121214] border border-zinc-800/60 rounded-2xl p-8 shadow-2xl backdrop-blur-sm relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

          {success ? (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <CheckCircle2 className="text-emerald-500" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Password Updated</h2>
              <p className="text-zinc-400 text-sm leading-relaxed text-center">
                Your credentials have been updated successfully.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-gold" size={20} />
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Redirecting to Login...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <ShieldAlert className="text-red-500" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 text-center">Link Expired</h2>
              <p className="text-zinc-500 text-sm mb-8 leading-relaxed text-center">{error}</p>
              <Link
                href="/forgot-password"
                className="block w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-xl transition-all text-sm uppercase tracking-wider text-center"
              >
                Request New Link
              </Link>
            </div>
          ) : (
            <>
              <header className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Set New Password</h1>
                <p className="text-zinc-500 text-sm">Please create a strong password to protect your account access.</p>
              </header>

              <form onSubmit={handleReset} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs text-red-400 flex items-start gap-3">
                    <span className="mt-0.5">⚠️</span>
                    <p className="leading-normal">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold ml-1 block">New Password</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-gold transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter strong password"
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-zinc-700 focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {password && <PasswordStrength password={password} />}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold ml-1 block">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-gold transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || password !== confirm || password.length < 8}
                  className="w-full bg-gradient-to-r from-gold to-yellow-600 text-[#09090b] font-bold py-4 rounded-xl shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:brightness-110 transition-all flex items-center justify-center gap-3 disabled:grayscale disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm active:scale-[0.98]"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                  {loading ? 'Updating Credentials...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
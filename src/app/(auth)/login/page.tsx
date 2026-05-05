'use client'

import { Suspense } from "react";
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// 1. We renamed your main code to LoginContent
function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setLoading(false)
      if (authError.message.includes('Invalid login')) {
        setError('Incorrect email or password. Please try again.')
      } else if (authError.message.includes('Email not confirmed')) {
        setError('Please verify your email before logging in.')
      } else {
        setError(authError.message)
      }
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 relative overflow-hidden">
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[100px] -z-10" />

      <div className="w-full max-w-md relative z-10">

        {/* Updated Logo Section */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="relative w-32 h-20 mb-4">
            <Image 
              src="/logo.png" 
              alt="Investor Sathi Logo" 
              fill
              className="object-contain"
              priority 
            />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Investor Sathi</h1>
          <p className="text-gold text-[11px] mt-2 font-bold tracking-[0.2em] uppercase">Premium Internal CRM</p>
        </div>

        {/* Main Card */}
        <div className="bg-[#121214] border border-zinc-800/60 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-1.5 font-serif">Welcome back</h2>
            <p className="text-sm text-zinc-400">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3.5 text-[13px] text-red-400 flex items-start gap-2">
                <div className="mt-0.5">•</div>
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block ml-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@investorsaathi.com"
                className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-gold hover:text-yellow-500 transition-colors font-bold uppercase tracking-wider"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-lg pl-4 pr-11 py-2.5 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all font-mono"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-gold to-yellow-600 hover:brightness-110 text-black font-bold text-sm py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(212,175,55,0.15)] disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'AUTHENTICATING...' : 'SIGN IN TO CRM'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-zinc-600 mt-8 font-bold tracking-[0.2em] uppercase">
          INVESTOR SATHI INTERNAL PLATFORM <br className="sm:hidden" />
          <span className="hidden sm:inline"> — </span> 
          AUTHORISED PERSONNEL ONLY
        </p>

      </div>
    </div>
  )
}

// 2. This is the new default export that Next.js sees, properly wrapped in Suspense
export default function LoginPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
          <Loader2 className="animate-spin text-zinc-500" size={32} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
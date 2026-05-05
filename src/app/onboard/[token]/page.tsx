'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image' // Added for the new logo
import { Loader2, CheckCircle, ChevronRight, ChevronLeft, Upload, ShieldCheck, TrendingUp, MapPin, Lock, FileText, XCircle } from 'lucide-react'

interface Props {
  params: {
    token: string
  }
}

type Step = 1 | 2 | 3 | 4

interface FormState {
  full_name: string; phone: string; email: string; date_of_birth: string
  age_range: string; occupation: string; city: string; state: string
  pan_number: string; aadhaar_number: string
  investment_budget: string; heard_about_us: string
  project_interest: string; plot_unit_details: string
  lead_source_confirmed: string; why_chose_us: string
}

interface QuoteData {
  projectName?: string;
  unitDetails?: string;
  quotedPrice?: string;
  paymentPlan?: string;
  specialNotes?: string;
}

const BUDGET_OPTIONS = ['₹25L – ₹50L', '₹50L – ₹1 Cr', '₹1 Cr – ₹3 Cr', '₹3 Cr – ₹5 Cr', '₹5 Cr+']
const AGE_OPTIONS    = ['18–25', '26–35', '36–45', '46–55', '55+']
const SOURCE_OPTIONS = [
  'Referral from friend/family', 'Social media', 'Our website',
  'Event', 'Google search', 'Other',
]

const STEPS = ['Personal Details', 'KYC Documents', 'Investment Details', 'About You']

export default function OnboardingForm({ params }: Props) {
  const token = params.token

  const [initialLoading, setInitialLoading] = useState(true)
  const [invalidTokenMsg, setInvalidTokenMsg] = useState<string | null>(null)
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null)

  const [step, setStep]           = useState<Step>(1)
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [panFile, setPanFile]     = useState<File | null>(null)
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null)

  const [form, setForm] = useState<FormState>({
    full_name: '', phone: '', email: '', date_of_birth: '',
    age_range: '', occupation: '', city: '', state: '',
    pan_number: '', aadhaar_number: '',
    investment_budget: '', heard_about_us: '',
    project_interest: '', plot_unit_details: '',
    lead_source_confirmed: '', why_chose_us: '',
  })

  useEffect(() => {
    async function verifyLink() {
      try {
        const res = await fetch(`/api/magic-link?token=${token}`)
        const json = await res.json()
        if (!res.ok) {
          setInvalidTokenMsg(json.error || 'Invalid or expired link.')
        } else {
          setQuoteData(json.data.quote_data)
          if (json.data.quote_data?.projectName) {
            update('project_interest', json.data.quote_data.projectName)
          }
          if (json.data.quote_data?.unitDetails) {
            update('plot_unit_details', json.data.quote_data.unitDetails)
          }
        }
      } catch (err) {
        console.error('Verification error:', err)
        setInvalidTokenMsg('Failed to verify secure link. Please check your connection.')
      } finally {
        setInitialLoading(false)
      }
    }
    verifyLink()
  }, [token])

  function update(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function canProceed(): boolean {
    if (step === 1) return !!form.full_name && !!form.phone && !!form.email
    if (step === 3) return !!form.investment_budget
    return true
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    const fd = new FormData()
    fd.append('token', token)
    fd.append('data',  JSON.stringify(form))
    if (panFile)      fd.append('pan_file',     panFile)
    if (aadhaarFile) fd.append('aadhaar_file', aadhaarFile)

    const res  = await fetch('/api/onboarding/submit', { method: 'POST', body: fd })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error ?? 'Submission failed. Please try again.')
      return
    }
    setDone(true)
  }

  const formatPan = (val: string) => val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
  const formatPhone = (val: string) => val.replace(/[^\d+]/g, '').slice(0, 15)

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#D4AF37] mb-4" size={40} strokeWidth={1.5} />
        <p className="text-gray-400 font-medium tracking-wide animate-pulse">Securing your session...</p>
      </div>
    )
  }

  if (invalidTokenMsg) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-[#13131A] border border-white/10 rounded-2xl p-10 shadow-2xl">
          <XCircle className="text-red-400 mx-auto mb-6" size={64} strokeWidth={1.5} />
          <h1 className="text-2xl font-light text-white mb-3">Link Unavailable</h1>
          <p className="text-gray-400 text-sm leading-relaxed">{invalidTokenMsg}</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-[#13131A] border border-white/10 rounded-2xl p-10 shadow-2xl">
          <CheckCircle className="text-[#D4AF37] mx-auto mb-6" size={64} strokeWidth={1.5} />
          <h1 className="text-2xl font-light text-white mb-3">You&apos;re all set</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Your profile has been securely created. Your dedicated advisor will review your details and reach out shortly to discuss your investment strategy.
          </p>
          <div className="p-4 bg-black/40 rounded-xl border border-white/5 inline-flex items-center gap-3">
            <span className="text-xl">📧</span>
            <div className="text-left">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Confirmation Sent</p>
              <p className="text-sm font-medium text-white">{form.email}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0A0A0F] text-white">
      
      {/* LEFT PANEL - Updated with official logo */}
      <div className="w-full lg:w-[35%] bg-black p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col items-start mb-12">
            <div className="relative w-32 h-20 mb-2">
              <Image 
                src="/logo.png" 
                alt="Investor Sathi Logo" 
                fill
                className="object-contain object-left"
                priority 
              />
            </div>
            <p className="text-gold text-[10px] uppercase tracking-[0.25em] font-bold">Investment Advisory</p>
          </div>

          <h1 className="text-4xl font-light leading-tight mb-4 serif">
            Your Trusted Guide to <br/>
            <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#F5D061]">
              Dholera Real Estate
            </span>
          </h1>

          {quoteData && Object.keys(quoteData).length > 0 ? (
            <div className="bg-[#13131A]/80 border border-[#D4AF37]/30 rounded-xl p-6 mt-8 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-left-4">
              <h3 className="text-[#D4AF37] font-semibold text-sm uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-[#D4AF37]/20 pb-3">
                <FileText size={16} /> Investment Quote
              </h3>
              
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Project / Property</p>
                  <p className="text-lg font-medium text-white">{quoteData.projectName}</p>
                </div>

                {(quoteData.unitDetails || quoteData.quotedPrice) && (
                  <div className="grid grid-cols-2 gap-4">
                    {quoteData.unitDetails && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Unit / Plot</p>
                        <p className="text-sm text-white">{quoteData.unitDetails}</p>
                      </div>
                    )}
                    {quoteData.quotedPrice && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Quoted Price</p>
                        <p className="text-sm font-semibold text-[#D4AF37]">{quoteData.quotedPrice}</p>
                      </div>
                    )}
                  </div>
                )}

                {quoteData.paymentPlan && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Payment Plan</p>
                    <p className="text-sm text-white">{quoteData.paymentPlan}</p>
                  </div>
                )}

                {quoteData.specialNotes && (
                  <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg p-4 mt-2">
                    <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider mb-1.5">Special Notes</p>
                    <p className="text-sm text-gray-300 leading-relaxed italic">{quoteData.specialNotes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-12">
                Complete your onboarding in under 2 minutes to unlock personalized, high-yield investment opportunities.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 text-[#D4AF37]">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-1 uppercase tracking-wide">Research-Backed</h3>
                    <p className="text-xs text-gray-500">Data-driven insights for maximum ROI.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 text-[#D4AF37]">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-1 uppercase tracking-wide">Field-Verified</h3>
                    <p className="text-xs text-gray-500">Every project thoroughly vetted by our team.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 text-[#D4AF37]">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-1 uppercase tracking-wide">Investor-First Approach</h3>
                    <p className="text-xs text-gray-500">End-to-end transparency and advisory.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-600 mt-12 relative z-10 font-bold">
          <Lock size={12} /> Bank-grade encryption secures your data
        </div>
      </div>

      {/* RIGHT PANEL - Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 relative">
        <div className="w-full max-w-3xl">
          
          <div className="mb-8 px-2 flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-white/10 -z-10" />
            {STEPS.map((label, i) => {
              const stepNum = (i + 1) as Step
              const isActive = step === stepNum
              const isDone   = step > stepNum
              return (
                <div key={label} className="flex flex-col items-center gap-2 bg-[#0A0A0F] px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                    isDone   ? 'bg-[#D4AF37] text-black ring-4 ring-[#D4AF37]/20' :
                    isActive ? 'bg-transparent text-[#D4AF37] border-2 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]' :
                               'bg-[#13131A] text-gray-600 border border-white/10'
                  }`}>
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider hidden sm:block transition-colors font-bold ${
                    isActive ? 'text-[#D4AF37]' : isDone ? 'text-gray-400' : 'text-gray-600'
                  }`}>{label}</span>
                </div>
              )
            })}
          </div>

          <div className="bg-[#13131A] border border-white/10 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
            
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-400 flex items-center gap-3">
                <span className="text-xl">⚠️</span> {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-light text-white mb-1 serif">Personal Details</h2>
                  <p className="text-sm text-gray-400">Let&apos;s start with the basics to set up your profile.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Full Name *" value={form.full_name} onChange={(v) => update('full_name', v)} placeholder="As per PAN card" className="md:col-span-2" />
                  <Field label="Phone Number *" value={form.phone} onChange={(v) => update('phone', formatPhone(v))} placeholder="+91 98765 43210" type="tel" />
                  <Field label="Email Address *" value={form.email} onChange={(v) => update('email', v)} placeholder="you@example.com" type="email" />
                  <Field label="Date of Birth" value={form.date_of_birth} onChange={(v) => update('date_of_birth', v)} type="date" />
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1.5 ml-1">Age Range</label>
                    <select
                      className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all appearance-none cursor-pointer"
                      value={form.age_range}
                      onChange={(e) => update('age_range', e.target.value)}
                    >
                      <option value="" className="text-gray-500">Select age range</option>
                      {AGE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <Field label="Occupation" value={form.occupation} onChange={(v) => update('occupation', v)} placeholder="e.g. Business Owner, IT Professional" className="md:col-span-2" />
                  <Field label="City" value={form.city} onChange={(v) => update('city', v)} placeholder="Mumbai" />
                  <Field label="State" value={form.state} onChange={(v) => update('state', v)} placeholder="Maharashtra" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-light text-white mb-1 serif">KYC Verification</h2>
                  <p className="text-sm text-gray-400">Required for seamless property registration.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="PAN Number" value={form.pan_number} onChange={(v) => update('pan_number', formatPan(v))} placeholder="ABCDE1234F" maxLength={10} />
                  <Field label="Aadhaar Number" value={form.aadhaar_number} onChange={(v) => update('aadhaar_number', v)} placeholder="XXXX XXXX XXXX" maxLength={14} />
                  <div className="md:col-span-2 space-y-4 mt-2">
                    <FileUploadField label="Upload PAN Card (PDF or Image)" file={panFile} onChange={setPanFile} accept=".pdf,.jpg,.jpeg,.png" />
                    <FileUploadField label="Upload Aadhaar Card (PDF or Image)" file={aadhaarFile} onChange={setAadhaarFile} accept=".pdf,.jpg,.jpeg,.png" />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-light text-white mb-1 serif">Investment Strategy</h2>
                  <p className="text-sm text-gray-400">Help us curate the right properties for you.</p>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-3 ml-1">Investment Budget *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {BUDGET_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => update('investment_budget', opt)}
                        className={`py-3 px-2 rounded-lg border text-[11px] uppercase tracking-widest font-bold transition-all duration-300 ${
                          form.investment_budget === opt
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                            : 'border-white/10 bg-[#0A0A0F] text-zinc-500 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-5">
                  <Field label="Project / Property Interested In" value={form.project_interest} onChange={(v) => update('project_interest', v)} placeholder="e.g. Dholera Smart City Commercial Land" />
                  <Field label="Plot / Unit Details (Optional)" value={form.plot_unit_details} onChange={(v) => update('plot_unit_details', v)} placeholder="e.g. Plot 42, Sector 14" />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-light text-white mb-1 serif">A Bit More About You</h2>
                  <p className="text-sm text-gray-400">Final step before we get started.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1.5 ml-1">How did you hear about us?</label>
                    <select
                      className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all appearance-none cursor-pointer"
                      value={form.heard_about_us}
                      onChange={(e) => update('heard_about_us', e.target.value)}
                    >
                      <option value="">Select source</option>
                      {SOURCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <Field label="Lead Source (if referred)" value={form.lead_source_confirmed} onChange={(v) => update('lead_source_confirmed', v)} placeholder="e.g. Referred by Ravi Shah" />
                  
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1.5 ml-1">Why did you choose Investor Sathi?</label>
                    <textarea
                      value={form.why_chose_us}
                      onChange={(e) => update('why_chose_us', e.target.value)}
                      placeholder="Tell us what convinced you..."
                      rows={3}
                      className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-10 flex gap-4 pt-6 border-t border-white/10">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  className="px-6 py-3 rounded-lg border border-zinc-800 text-zinc-400 font-bold uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all flex items-center gap-2 text-[10px]"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s + 1) as Step)}
                  disabled={!canProceed()}
                  className="flex-1 bg-gradient-to-r from-gold to-yellow-600 text-[#09090b] font-bold rounded-lg py-3.5 flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:grayscale disabled:opacity-50 text-[10px] uppercase tracking-widest shadow-lg shadow-gold/10 active:scale-[0.98]"
                >
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-gold to-yellow-600 text-[#09090b] font-bold rounded-lg py-3.5 flex items-center justify-center gap-2 transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 text-[10px] uppercase tracking-widest active:scale-[0.98]"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Processing Profile...' : 'Finalize Profile'}
                </button>
              )}
            </div>
          </div>
          
          <div className="lg:hidden mt-8 text-center flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
            <Lock size={12} /> Bank-grade encryption secured
          </div>

        </div>
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder = '', type = 'text', maxLength, className = ''
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  maxLength?: number
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1.5 ml-1">{label}</label>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
      />
    </div>
  )
}

function FileUploadField({
  label, file, onChange, accept,
}: {
  label: string
  file: File | null
  onChange: (f: File | null) => void
  accept: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1.5 ml-1">{label}</label>
      <label
        className={`flex items-center justify-between border border-dashed rounded-lg px-4 py-4 cursor-pointer transition-all ${
          file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 hover:border-gold/50 bg-[#0A0A0F] hover:bg-white/5'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${file ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-900 text-zinc-500'}`}>
            <Upload size={18} />
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider ${file ? 'text-emerald-500' : 'text-zinc-500'}`}>
            {file ? file.name : 'Choose File'}
          </span>
        </div>
        {!file && <span className="text-[10px] font-bold text-gold uppercase tracking-widest bg-gold/10 px-2 py-1 rounded">Upload</span>}
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}
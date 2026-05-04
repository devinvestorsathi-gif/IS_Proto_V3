'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, ChevronRight, ChevronLeft, Upload } from 'lucide-react'

interface Props { token: string; leadId: string }

type Step = 1 | 2 | 3 | 4

interface FormState {
  full_name: string; phone: string; email: string; date_of_birth: string
  age_range: string; occupation: string; city: string; state: string
  pan_number: string; aadhaar_number: string
  investment_budget: string; heard_about_us: string
  project_interest: string; plot_unit_details: string
  lead_source_confirmed: string; why_chose_us: string
}

const BUDGET_OPTIONS = ['₹25L – ₹50L', '₹50L – ₹1 Cr', '₹1 Cr – ₹3 Cr', '₹3 Cr – ₹5 Cr', '₹5 Cr+']
const AGE_OPTIONS    = ['18–25', '26–35', '36–45', '46–55', '55+']
const SOURCE_OPTIONS = ['Referral from friend/family', 'Social media', 'Our website', 'Event', 'Google search', 'Other']

export default function OnboardingForm({ token }: Props) {
  const [step, setStep]       = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
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

  function update(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function canProceed(): boolean {
    if (step === 1) return !!form.full_name && !!form.phone && !!form.email
    if (step === 2) return true // KYC is optional at form level
    if (step === 3) return !!form.investment_budget
    return true
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    const fd = new FormData()
    fd.append('token', token)
    fd.append('data',  JSON.stringify(form))
    if (panFile)     fd.append('pan_file',     panFile)
    if (aadhaarFile) fd.append('aadhaar_file', aadhaarFile)

    const res = await fetch('/api/onboarding/submit', { method: 'POST', body: fd })
    const json = await res.json()

    setLoading(false)
    if (!res.ok) { setError(json.error ?? 'Submission failed. Please try again.'); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center is-card p-10">
          <CheckCircle className="text-success mx-auto mb-4" size={56} />
          <h1 className="text-2xl font-semibold text-text-primary mb-2">You&apos;re all set!</h1>
          <p className="text-text-secondary text-sm">
            Your onboarding is complete. Your advisor will reach out shortly with next steps.
          </p>
          <div className="mt-6 p-4 bg-surface-raised rounded-lg border border-border">
            <p className="text-xs text-text-secondary">
              📧 A confirmation has been sent to <strong className="text-text-primary">{form.email}</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }

  const STEPS = ['Personal Details', 'KYC Documents', 'Investment Details', 'About You']

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gold rounded-lg flex items-center justify-center">
              <span className="text-background font-bold">IS</span>
            </div>
            <span className="text-lg font-semibold text-text-primary">Investor Saathi</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Client Onboarding</h1>
          <p className="text-text-secondary text-sm mt-1">Complete in 2 minutes</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((label, i) => {
            const stepNum = (i + 1) as Step
            const active  = step === stepNum
            const done    = step > stepNum
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    done   ? 'bg-success text-white' :
                    active ? 'bg-gold text-background' :
                             'bg-surface-raised text-text-secondary border border-border'
                  }`}>
                    {done ? '✓' : stepNum}
                  </div>
                  <span className={`text-[10px] mt-1 text-center leading-tight hidden sm:block ${
                    active ? 'text-gold' : 'text-text-secondary'
                  }`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${step > stepNum ? 'bg-success' : 'bg-border'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Form card */}
        <div className="is-card p-6 space-y-5">

          {error && (
            <div className="bg-danger/20 border border-danger/50 rounded-lg p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Step 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-3">
                Personal Details
              </h2>
              <Field label="Full Name *" value={form.full_name} onChange={(v) => update('full_name', v)} placeholder="As per PAN card" />
              <Field label="Phone Number *" value={form.phone} onChange={(v) => update('phone', v)} placeholder="+91 98765 43210" type="tel" />
              <Field label="Email Address *" value={form.email} onChange={(v) => update('email', v)} placeholder="you@example.com" type="email" />
              <Field label="Date of Birth" value={form.date_of_birth} onChange={(v) => update('date_of_birth', v)} type="date" />
              <div>
                <label className="is-label">Age Range</label>
                <SelectField value={form.age_range} onChange={(v) => update('age_range', v)} options={AGE_OPTIONS} placeholder="Select age range" />
              </div>
              <Field label="Occupation" value={form.occupation} onChange={(v) => update('occupation', v)} placeholder="e.g. Business Owner, Salaried" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" value={form.city} onChange={(v) => update('city', v)} placeholder="Mumbai" />
                <Field label="State" value={form.state} onChange={(v) => update('state', v)} placeholder="Maharashtra" />
              </div>
            </div>
          )}

          {/* Step 2: KYC */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-3">
                KYC Details
              </h2>
              <p className="text-text-secondary text-xs">
                Your details are encrypted and stored securely. We only use them for investment processing.
              </p>
              <Field label="PAN Number" value={form.pan_number} onChange={(v) => update('pan_number', v.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
              <Field label="Aadhaar Number" value={form.aadhaar_number} onChange={(v) => update('aadhaar_number', v)} placeholder="XXXX XXXX XXXX" maxLength={14} />
              <FileUploadField
                label="Upload PAN Card (PDF or Image)"
                file={panFile}
                onChange={setPanFile}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <FileUploadField
                label="Upload Aadhaar Card (PDF or Image)"
                file={aadhaarFile}
                onChange={setAadhaarFile}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
          )}

          {/* Step 3: Investment Details */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-3">
                Investment Details
              </h2>
              <div>
                <label className="is-label">Investment Budget *</label>
                <div className="grid grid-cols-2 gap-2">
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => update('investment_budget', opt)}
                      className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        form.investment_budget === opt
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border text-text-secondary hover:border-gold/50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Project / Property Interested In" value={form.project_interest} onChange={(v) => update('project_interest', v)} placeholder="e.g. Dholera Smart City Land" />
              <Field label="Plot / Unit Details (if any)" value={form.plot_unit_details} onChange={(v) => update('plot_unit_details', v)} placeholder="e.g. Plot 42, Sector 14" />
            </div>
          )}

          {/* Step 4: About You */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-3">
                A Bit More About You
              </h2>
              <div>
                <label className="is-label">How did you hear about us?</label>
                <SelectField
                  value={form.heard_about_us}
                  onChange={(v) => update('heard_about_us', v)}
                  options={SOURCE_OPTIONS}
                  placeholder="Select source"
                />
              </div>
              <Field label="Lead Source (confirmed)" value={form.lead_source_confirmed} onChange={(v) => update('lead_source_confirmed', v)} placeholder="e.g. Referred by Ravi Shah" />
              <div>
                <label className="is-label">Why did you choose Investor Saathi?</label>
                <textarea
                  value={form.why_chose_us}
                  onChange={(e) => update('why_chose_us', e.target.value)}
                  placeholder="Tell us what convinced you..."
                  rows={4}
                  className="is-input resize-none"
                />
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-2 border-t border-border">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="is-btn-outline flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={!canProceed()}
                className="is-btn-gold flex-1 flex items-center justify-center gap-1"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="is-btn-gold flex-1 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Submitting…' : 'Submit Onboarding'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-text-secondary mt-4">
            Your data is encrypted and stored securely.
        </p>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────

function Field({ label, value, onChange, placeholder = '', type = 'text', maxLength }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; maxLength?: number
}) {
  return (
    <div>
      <label className="is-label">{label}</label>
      <input
        type={type} value={value} maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} className="is-input"
      />
    </div>
  )
}

function SelectField({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="is-input" title={placeholder}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function FileUploadField({ label, file, onChange, accept }: {
  label: string; file: File | null; onChange: (f: File | null) => void; accept: string
}) {
  return (
    <div>
      <label className="is-label">{label}</label>
      <label className={`
        flex items-center gap-3 border border-dashed rounded-lg px-4 py-3 cursor-pointer
        transition-colors ${file ? 'border-gold/50 bg-gold/5' : 'border-border hover:border-gold/30'}
      `}>
        <Upload size={16} className={file ? 'text-gold' : 'text-text-secondary'} />
        <span className={`text-sm ${file ? 'text-gold' : 'text-text-secondary'}`}>
          {file ? file.name : 'Click to upload'}
        </span>
        <input type="file" accept={accept} className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      </label>
    </div>
  )
}

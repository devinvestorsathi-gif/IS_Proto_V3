'use client'

import { useState } from 'react'
import { Link2, Copy, Check, Loader2, FileText, X } from 'lucide-react'

export default function MagicLinkButton({ leadId }: { leadId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl]       = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Quote form state
  const [quoteData, setQuoteData] = useState({
    projectName: '',
    unitDetails: '',
    quotedPrice: '',
    paymentPlan: 'Standard 30-70',
    specialNotes: ''
  })

  async function generate(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/magic-link', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ lead_id: leadId, quote_data: quoteData }) 
      })
      const json = await res.json()
      
      if (!res.ok) { 
        setError(json.error || 'Failed to generate link')
        return 
      }
      setUrl(json.data.url)
      setIsOpen(false) // Close form on success
    } catch (err) {
      console.error(err)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function copyUrl() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {/* State 1: Fresh, unopened state */}
      {!url && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="bg-gold text-black text-sm font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 flex items-center gap-2 transition-colors"
        >
          <FileText size={16} />
          Create Quote & Link
        </button>
      )}

      {/* State 2: Quote Builder Form Open (Now a Centered Modal) */}
      {isOpen && !url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#12121A] border border-[#2A2A38] rounded-xl shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Investment Quote</h3>
              <button 
                aria-label="Close quote builder" 
                onClick={() => setIsOpen(false)} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={generate} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Project / Property Name *</label>
                <input 
                  required 
                  type="text" 
                  value={quoteData.projectName} 
                  onChange={e => setQuoteData({...quoteData, projectName: e.target.value})} 
                  className="w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all" 
                  placeholder="e.g. Dholera Sector 14" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Unit / Plot Size</label>
                  <input 
                    type="text" 
                    value={quoteData.unitDetails} 
                    onChange={e => setQuoteData({...quoteData, unitDetails: e.target.value})} 
                    className="w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all" 
                    placeholder="e.g. 500 sq yds" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Quoted Price *</label>
                  <input 
                    required 
                    type="text" 
                    value={quoteData.quotedPrice} 
                    onChange={e => setQuoteData({...quoteData, quotedPrice: e.target.value})} 
                    className="w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all" 
                    placeholder="₹45,00,000" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Payment Plan</label>
                <select 
                  value={quoteData.paymentPlan} 
                  onChange={e => setQuoteData({...quoteData, paymentPlan: e.target.value})} 
                  className="w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all appearance-none"
                >
                  <option className="bg-[#1A1A26] text-white">Standard 30-70</option>
                  <option className="bg-[#1A1A26] text-white">50% Upfront, 50% on Possession</option>
                  <option className="bg-[#1A1A26] text-white">100% Upfront (Discounted)</option>
                  <option className="bg-[#1A1A26] text-white">Custom (See Notes)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Special Notes / Discounts</label>
                <textarea 
                  value={quoteData.specialNotes} 
                  onChange={e => setQuoteData({...quoteData, specialNotes: e.target.value})} 
                  className="w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all h-24 resize-none" 
                  placeholder="e.g. Includes corner plot premium waiver." 
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-gold text-black text-sm font-semibold py-3 rounded-lg hover:bg-opacity-90 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Link2 size={18} />}
                  {loading ? 'Generating...' : 'Generate Magic Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* State 3: Link Generated Successfully */}
      {url && (
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-emerald-400 font-medium">Quote attached and link generated!</span>
          <div className="flex items-center gap-2 bg-[#1A1A26] border border-border rounded-lg p-1 pl-3 shadow-sm">
            <code className="text-sm text-gold font-mono truncate max-w-[180px] sm:max-w-[250px]">
              {url}
            </code>
            <button 
              onClick={copyUrl} 
              className="bg-gold text-black text-xs font-semibold py-1.5 px-3 rounded-md hover:bg-opacity-90 flex items-center gap-1 flex-shrink-0 transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
      
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
// ============================================================
// FORMATTING UTILITIES
// ============================================================

// Format currency in Indian Rupees with commas
// e.g., 1234567 → "₹12,34,567"
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format large numbers as Lakhs / Crores
// e.g., 1234567 → "12.35 L" or 12345678 → "1.23 Cr"
export function formatIndianShort(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return formatINR(amount)
}

// Format date as "15 Jan 2024"
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  })
}

// Format datetime as "15 Jan 2024, 10:30 AM"
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

// Relative time: "2 hours ago", "3 days ago"
export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60)   return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return formatDate(dateStr)
}

// Check if a date is in the past (overdue)
export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

// Format phone number for display
export function formatPhone(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  return phone
}

// Stage display color mapping
export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    new_lead:          'bg-blue-900/40 text-blue-300 border border-blue-700/50',
    contacted:         'bg-purple-900/40 text-purple-300 border border-purple-700/50',
    interested:        'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50',
    meeting_scheduled: 'bg-orange-900/40 text-orange-300 border border-orange-700/50',
    site_visit:        'bg-pink-900/40 text-pink-300 border border-pink-700/50',
    negotiation:       'bg-indigo-900/40 text-indigo-300 border border-indigo-700/50',
    converted:         'bg-green-900/40 text-green-300 border border-green-700/50',
    lost:              'bg-red-900/40 text-red-300 border border-red-700/50',
  }
  return colors[stage] ?? 'bg-gray-900/40 text-gray-300 border border-gray-700/50'
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending:  'bg-yellow-900/40 text-yellow-300',
    paid:     'bg-green-900/40 text-green-300',
    overdue:  'bg-red-900/40 text-red-300',
  }
  return colors[status] ?? 'bg-gray-900/40 text-gray-300'
}

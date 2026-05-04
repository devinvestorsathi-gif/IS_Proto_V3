import { createServiceClient } from '@/lib/supabase/server'

// Generate a random 8-character alphanumeric token
export function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  // Excludes look-alike characters: 0/O, 1/I/l
  let result = ''
  const array = new Uint8Array(8)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
    array.forEach((byte) => {
      result += chars[byte % chars.length]
    })
  } else {
    // Fallback for environments without Web Crypto
    for (let i = 0; i < 8; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
  }
  return result
}

// Create a magic link token in the database and return the compact URL
export async function createMagicLinkToken(
  leadId: string,
  createdBy: string
): Promise<{ token: string; url: string; error: string | null }> {
  const supabase = await createServiceClient()
  const token = generateToken()

  const { error } = await supabase.from('onboarding_tokens').insert({
    token,
    lead_id: leadId,
    created_by: createdBy,
    expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
  })

  if (error) {
    return { token: '', url: '', error: error.message }
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/onboard/${token}`
  return { token, url, error: null }
}

// Validate a token — returns the lead_id AND quote_data or null
export async function validateOnboardingToken(
  token: string
): Promise<{ lead_id: string | null; quote_data: Record<string, string> | null; error: string | null }> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('onboarding_tokens')
    .select('lead_id, expires_at, used, quote_data')
    .eq('token', token)
    .single()

  if (error || !data) {
    return { lead_id: null, quote_data: null, error: 'Invalid or expired link.' }
  }

  if (data.used) {
    return { lead_id: null, quote_data: null, error: 'This link has already been used.' }
  }

  if (new Date(data.expires_at) < new Date()) {
    return { lead_id: null, quote_data: null, error: 'This link has expired. Please contact your advisor.' }
  }

  return { 
    lead_id: data.lead_id, 
    quote_data: data.quote_data as Record<string, string> | null, 
    error: null 
  }
}
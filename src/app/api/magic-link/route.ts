import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createMagicLinkToken, validateOnboardingToken } from '@/lib/utils/token'

// POST /api/magic-link — generate a magic link for a converted lead
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient() // <-- Added Service Client to bypass RLS
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Extract lead_id and the new quote_data from the request body
  const { lead_id, quote_data } = await request.json()
  if (!lead_id) return NextResponse.json({ error: 'lead_id is required' }, { status: 400 })

  // Verify lead exists and is converted (Safe to use normal client here)
  const { data: lead } = await supabase
    .from('leads').select('id, stage, full_name').eq('id', lead_id).single()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.stage !== 'converted') {
    return NextResponse.json({ error: 'Magic links can only be generated for converted leads' }, { status: 400 })
  }

  // SECURITY/UX FIX: Invalidate all existing unused tokens for this lead.
  // Uses serviceClient to ensure RLS doesn't block the update
  await serviceClient
    .from('onboarding_tokens')
    .update({ used: true })
    .eq('lead_id', lead_id)
    .eq('used', false)

  // Generate a fresh token with retry on collision
  let result = await createMagicLinkToken(lead_id, user.id)
  if (result.error?.includes('duplicate') || result.error?.includes('unique')) {
    result = await createMagicLinkToken(lead_id, user.id)
  }
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })

  // FIX: Attach the quote_data using the serviceClient so it actually saves to the database
  if (quote_data) {
    const { error: quoteErr } = await serviceClient
      .from('onboarding_tokens')
      .update({ quote_data: quote_data })
      .eq('token', result.token)
      
    if (quoteErr) {
      console.error('Failed to save quote data:', quoteErr)
    }
  }

  return NextResponse.json({ data: { token: result.token, url: result.url } }, { status: 201 })
}

// GET /api/magic-link — fetch token validity and quote data for the onboarding page
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  // validateOnboardingToken already uses serviceClient internally, so this is safe
  const { lead_id, quote_data, error } = await validateOnboardingToken(token)
  
  if (error || !lead_id) {
    return NextResponse.json({ error: error || 'Invalid link' }, { status: 400 })
  }

  return NextResponse.json({ data: { quote_data } }, { status: 200 })
}
import { NextRequest, NextResponse } from 'next/server'
import { validateOnboardingToken } from '@/lib/utils/token'

// GET /api/onboarding/validate?token=XXXXXXXX
// Public route — used by the client onboarding page
export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 })

  const { lead_id, error } = await validateOnboardingToken(token)
  if (error || !lead_id) {
    return NextResponse.json({ error: error ?? 'Invalid token' }, { status: 400 })
  }

  return NextResponse.json({ data: { valid: true, lead_id } })
}
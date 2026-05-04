import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { CreateInteractionInput } from '@/lib/types'

// POST /api/interactions — log an interaction
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const service  = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: CreateInteractionInput = await request.json()
  if (!body.lead_id || !body.type) {
    return NextResponse.json({ error: 'lead_id and type are required' }, { status: 400 })
  }

  const { data, error } = await service.from('interactions').insert({
    lead_id:           body.lead_id,
    logged_by:         user.id,
    type:              body.type,
    outcome:           body.outcome        ?? null,
    notes:             body.notes          ?? null,
    duration_minutes:  body.duration_minutes ?? null,
    follow_up_required: body.follow_up_required ?? false,
    follow_up_date:    body.follow_up_date  ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update last_contacted_at on the lead
  await service.from('leads').update({
    last_contacted_at: new Date().toISOString(),
    ...(body.follow_up_date ? { follow_up_date: body.follow_up_date } : {}),
  }).eq('id', body.lead_id)

  return NextResponse.json({ data }, { status: 201 })
}

// GET /api/interactions?lead_id=xxx
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const leadId = new URL(request.url).searchParams.get('lead_id')
  if (!leadId) return NextResponse.json({ error: 'lead_id is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('interactions')
    .select('*, logged_by_profile:profiles!logged_by(id, full_name)')
    .eq('lead_id', leadId)
    .order('logged_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('lead_notes').select('*').eq('lead_id', params.id).single()
  return NextResponse.json({ data: data ?? {} })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const service  = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const body = await request.json()

  // 1. UPDATE THE SINGLE SOURCE OF TRUTH (leads table)
  // We extract the core fields to update the main lead record directly.
  const { error: leadUpdateError } = await service
    .from('leads')
    .update({
      lead_score: body.lead_score ?? 5,
      follow_up_date: body.follow_up_date || null
    })
    .eq('id', params.id)

  if (leadUpdateError) {
    return NextResponse.json({ error: leadUpdateError.message }, { status: 500 })
  }

  // 2. UPSERT THE RICH NOTES (lead_notes table)
  const { data, error: notesError } = await service.from('lead_notes').upsert({
    lead_id: params.id, 
    updated_by: user.id, 
    updated_at: new Date().toISOString(), 
    ...body,
  }, { onConflict: 'lead_id' }).select().single()

  if (notesError) {
    return NextResponse.json({ error: notesError.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
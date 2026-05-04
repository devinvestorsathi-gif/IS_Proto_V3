import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { CreatePaymentMilestoneInput } from '@/lib/types'

// GET /api/payments?client_id=xxx
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = new URL(request.url).searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('payment_milestones')
    .select('*')
    .eq('client_id', clientId)
    .order('due_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/payments — create a milestone (admin/team_lead only)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const service  = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'team_lead'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Admin or Team Lead only' }, { status: 403 })
  }

  const body: CreatePaymentMilestoneInput = await request.json()
  if (!body.client_id || !body.milestone_name || !body.amount || !body.due_date) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const { data, error } = await service.from('payment_milestones').insert({
    client_id:      body.client_id,
    milestone_name: body.milestone_name,
    amount:         body.amount,
    due_date:       body.due_date,
    status:         'pending',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
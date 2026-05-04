import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { UpdateLeadStageInput } from '@/lib/types'

// PATCH /api/leads/[id]/stage — move stage forward or backward
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const service  = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: UpdateLeadStageInput = await request.json()
  if (!body.stage) return NextResponse.json({ error: 'Stage is required' }, { status: 400 })

  // Get current lead
  const { data: current } = await supabase
    .from('leads').select('stage, full_name, assigned_to').eq('id', params.id).single()
  if (!current) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  if (body.stage === 'lost' && !body.lost_reason) {
    return NextResponse.json({ error: 'A lost reason is required' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {
    stage:            body.stage,
    stage_updated_at: new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  }

  if (body.stage === 'lost') {
    updateData.is_lost            = true
    updateData.lost_at_stage      = current.stage
    updateData.lost_reason        = body.lost_reason
    updateData.lost_reason_detail = body.lost_reason_detail ?? null
  } else {
    updateData.is_lost            = false
    updateData.lost_at_stage      = null
    updateData.lost_reason        = null
    updateData.lost_reason_detail = null
  }

  const { data: updated, error } = await service
    .from('leads').update(updateData).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log stage change
  await service.from('lead_stage_history').insert({
    lead_id:    params.id,
    from_stage: current.stage,
    to_stage:   body.stage,
    changed_by: user.id,
    notes:      body.notes ?? null,
  })

  return NextResponse.json({ data: updated })
}
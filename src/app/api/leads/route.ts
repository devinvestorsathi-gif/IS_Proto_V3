import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { CreateLeadInput } from '@/lib/types'

// GET /api/leads — list leads (scoped by role)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role, team_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const stage      = searchParams.get('stage')
  const source     = searchParams.get('source')
  const search     = searchParams.get('search')
  const assignedTo = searchParams.get('assigned_to') // Capture the new filter parameter

  let query = supabase
    .from('leads')
    .select('*, assigned_profile:profiles!assigned_to(id, full_name, email), lead_notes(follow_up_date)')
    .order('created_at', { ascending: false })

  // --- Role-Based Scoping ---
  if (profile.role === 'sales_rep') {
    query = query.eq('assigned_to', user.id)
  } else if (profile.role === 'team_lead') {
    query = query.eq('team_id', profile.team_id)
  }

  // --- Dynamic Filtering ---
  if (stage)  query = query.eq('stage', stage)
  if (source) query = query.eq('source', source)
  
  // Apply the Assigned To filter if selected
  if (assignedTo) query = query.eq('assigned_to', assignedTo)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/leads — create lead
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const service  = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role, team_id, full_name, email').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body: CreateLeadInput = await request.json()

  if (!body.full_name?.trim() || !body.phone?.trim()) {
    return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
  }

  const assignedTo = body.assigned_to ?? user.id
  const teamId     = body.team_id     ?? profile.team_id

  const { data: lead, error } = await service.from('leads').insert({
    full_name:   body.full_name.trim(),
    phone:       body.phone.trim(),
    email:       body.email?.trim() ?? null,
    city:        body.city?.trim()  ?? null,
    source:      body.source,
    assigned_to: assignedTo,
    team_id:     teamId,
    stage:       'new_lead',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log initial stage history
  await service.from('lead_stage_history').insert({
    lead_id:    lead.id,
    from_stage: 'none',
    to_stage:   'new_lead',
    changed_by: user.id,
    notes:      'Lead created',
  })

  // Notify assigned sales rep (if assigned to someone else)
  if (assignedTo !== user.id) {
    const { data: assignee } = await service
      .from('profiles').select('email, full_name').eq('id', assignedTo).single()
    if (assignee) {
      const { leadAssignedEmail } = await import('@/lib/email/templates/lead-assigned')
      const { sendEmail } = await import('@/lib/email/mailer')
      await sendEmail({
        to:      assignee.email,
        subject: `New lead assigned: ${lead.full_name}`,
        html:    leadAssignedEmail({
          salesRepName: assignee.full_name,
          leadName:     lead.full_name,
          leadPhone:    lead.phone,
          leadSource:   lead.source,
          leadId:       lead.id,
          appUrl:       process.env.NEXT_PUBLIC_APP_URL!,
        }),
      })
      await service.from('notifications').insert({
        user_id: assignedTo,
        title:   'New lead assigned',
        message: `${lead.full_name} has been assigned to you.`,
        type:    'info',
        link:    `/leads/${lead.id}`,
      })
    }
  }

  return NextResponse.json({ data: lead }, { status: 201 })
}
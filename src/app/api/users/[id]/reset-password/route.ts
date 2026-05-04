import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/users/[id]/reset-password — admin triggers reset email for any user
export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const service  = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { data: targetProfile } = await service
    .from('profiles').select('email').eq('id', params.id).single()
  if (!targetProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Use Supabase Admin API to send password reset
  const { error } = await service.auth.admin.generateLink({
    type:  'recovery',
    email: targetProfile.email,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: { success: true } })
}
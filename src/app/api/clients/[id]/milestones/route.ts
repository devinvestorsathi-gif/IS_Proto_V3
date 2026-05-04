import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  // 1. Verify Authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Extract data from the request body
  const { milestone_name, amount, due_date } = await request.json()

  if (!milestone_name || !amount || !due_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 3. Insert into the payment_milestones table
  const { data, error } = await supabase
    .from('payment_milestones')
    .insert({
      client_id: params.id,
      milestone_name,
      amount,
      due_date,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating milestone:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 4. Return success
  return NextResponse.json({ data }, { status: 201 })
}
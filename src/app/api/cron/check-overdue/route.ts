import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/cron/check-overdue
// Called daily by Vercel Cron — protected by CRON_SECRET
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = await createServiceClient()
  const today   = new Date().toISOString().split('T')[0]

  // Find all pending milestones past due date
  const { data: overdue } = await service
    .from('payment_milestones')
    .select(`
      id, milestone_name, amount, due_date,
      client:client_profiles!client_id(
        full_name,
        lead:leads!lead_id(
          assigned_to,
          assigned_profile:profiles!assigned_to(email, full_name)
        )
      )
    `)
    .eq('status', 'pending')
    .lt('due_date', today)

  if (!overdue || overdue.length === 0) {
    return NextResponse.json({ data: { updated: 0, notified: 0 } })
  }

  // Mark as overdue
  const ids = overdue.map((m) => m.id)
  await service.from('payment_milestones')
    .update({ status: 'overdue' }).in('id', ids)

  // Send alerts
  const { sendEmail } = await import('@/lib/email/mailer')
  const { paymentOverdueEmail } = await import('@/lib/email/templates/payment-overdue')

  let notified = 0
  for (const milestone of overdue) {
    const client = milestone.client as unknown as {
      full_name: string;
      lead: { assigned_to: string; assigned_profile: { email: string; full_name: string } | null }
    } | null
    const rep = client?.lead?.assigned_profile
    if (rep) {
      await sendEmail({
        to:      rep.email,
        subject: `Payment overdue: ${client!.full_name} — ${milestone.milestone_name}`,
        html:    paymentOverdueEmail({
          salesRepName:  rep.full_name,
          clientName:    client!.full_name,
          milestoneName: milestone.milestone_name,
          amount:        milestone.amount,
          dueDate:       milestone.due_date,
          clientId:      '',
          appUrl:        process.env.NEXT_PUBLIC_APP_URL!,
        }),
      })
      await service.from('notifications').insert({
        user_id: client!.lead.assigned_to,
        title:   'Payment overdue',
        message: `${client!.full_name} — ${milestone.milestone_name} is overdue.`,
        type:    'warning',
        link:    `/clients`,
      })
      notified++
    }
  }

  return NextResponse.json({ data: { updated: overdue.length, notified } })
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string, milestoneId: string } }
) {
  const supabase = await createClient()
  
  // 1. Verify Authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { client_name, client_email } = await request.json()

  // 2. Generate a unique, professional Receipt ID (e.g., IS-2026-849201)
  const currentYear = new Date().getFullYear()
  const randomNumbers = Math.floor(100000 + Math.random() * 900000)
  const generatedReceiptId = `IS-${currentYear}-${randomNumbers}`

  // 3. Update the milestone status in the database
  const { data: milestone, error: updateError } = await supabase
    .from('payment_milestones')
    .update({
      status: 'paid',
      paid_on_date: new Date().toISOString(),
      receipt_id: generatedReceiptId
    })
    .eq('id', params.milestoneId)
    .eq('client_id', params.id)
    .select()
    .single()

  if (updateError) {
    console.error('Error marking milestone as paid:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // 4. Log the interaction automatically
  try {
    // Fetch the client to get the associated lead_id
    const { data: client } = await supabase
      .from('client_profiles')
      .select('lead_id')
      .eq('id', params.id)
      .single()

    if (client?.lead_id) {
      await supabase.from('interactions').insert({
        lead_id: client.lead_id,
        logged_by: user.id,
        type: 'other',
        outcome: 'answered',
        notes: `Payment Received: ${milestone.milestone_name} (₹${milestone.amount}) - Receipt ID: ${generatedReceiptId}`,
        follow_up_required: false
      })
    }
  } catch (err) {
    console.error('Non-fatal error logging interaction:', err)
  }

  // 5. Trigger Email Generation (This fixes the unused variable error!)
  try {
    const { sendEmail } = await import('@/lib/email/mailer')
    const { paymentConfirmedEmail } = await import('@/lib/email/templates/payment-confirmed')

    if (client_email && client_name) {
      const emailHtml = paymentConfirmedEmail({
        clientName: client_name,
        milestoneName: milestone.milestone_name,
        amount: milestone.amount,
        receiptId: generatedReceiptId,
        paidDate: milestone.paid_on_date,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      })
      
      await sendEmail({
        to: client_email,
        cc: user.email, // Automatically CC the Sales Rep!
        bcc: process.env.ADMIN_BCC_EMAIL, // BCC the Admin
        subject: `Payment Receipt: ${milestone.milestone_name} (Receipt #${generatedReceiptId})`,
        html: emailHtml,
      })
      console.log(`Payment successful. Receipt ID ${generatedReceiptId} generated for ${client_email}`)
    }
  } catch (notifyErr) {
    console.error('Failed to send receipt email:', notifyErr)
    // We don't fail the API request if the email fails (e.g. if Resend isn't configured yet)
  }

  return NextResponse.json({ data: milestone }, { status: 200 })
}
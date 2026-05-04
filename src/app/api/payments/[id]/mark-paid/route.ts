/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateReceiptId } from '@/lib/utils/receipt-id'
import { sendEmail, emailShell } from '@/lib/email/mailer' // Updated imports

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const service  = await createServiceClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  
  if (!['admin', 'team_lead'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Admin or Team Lead only' }, { status: 403 })
  }

  const { data: milestone } = await service
    .from('payment_milestones')
    .select(`
      *,
      client:client_profiles!client_id(
        id, full_name, email, phone, project_interest,
        lead:leads!lead_id(
          assigned_to,
          assigned_profile:profiles!assigned_to(full_name, email)
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (!milestone) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
  if (milestone.status === 'paid') return NextResponse.json({ error: 'Already marked as paid' }, { status: 400 })

  const receiptId  = generateReceiptId()
  const paidAt     = new Date().toISOString()
  
  const client = milestone.client as any
  const assignedProfile = client.lead?.assigned_profile

  // Generate PDF receipt
  const { generateReceiptPDF } = await import('@/lib/pdf/receipt-generator')
  const pdfBuffer = await generateReceiptPDF({
    receiptId,
    clientName:     client.full_name,
    clientPhone:    client.phone,
    clientEmail:    client.email,
    projectDetails: client.project_interest ?? 'Investor Saathi Property',
    milestoneName:  milestone.milestone_name,
    amount:         milestone.amount,
    paidAt,
    salesRepName:   assignedProfile?.full_name ?? 'Investor Saathi',
  })

  // Upload to Storage
  const receiptPath = `clients/${client.id}/receipts/${receiptId}.pdf`
  await service.storage
    .from('receipts')
    .upload(receiptPath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

  // DB Records
  await service.from('documents').insert({
    client_id:     client.id,
    document_type: 'receipts',
    file_path:     receiptPath,
    file_name:     `${receiptId}.pdf`,
    uploaded_by:   user.id,
  })

  const { data: updated, error: updateError } = await service
    .from('payment_milestones')
    .update({ status: 'paid', paid_at: paidAt, receipt_id: receiptId, receipt_url: receiptPath })
    .eq('id', params.id).select().single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // PREMIUM RECEIPT EMAIL BODY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  // formatting the amount for the email
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(milestone.amount)

  const emailHtml = emailShell(`
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-family: serif;">Payment Confirmed ✓</h1>
      <p style="color: #a1a1aa; font-size: 14px; margin-top: 8px;">Your payment for <strong>${milestone.milestone_name}</strong> has been received.</p>
    </div>

    <div style="background-color: #18181b; padding: 30px; border-radius: 12px; border-left: 4px solid #d4af37; margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse; color: #ffffff; font-size: 14px;">
        <tr>
          <td style="padding: 10px 0; color: #71717a; text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 1px;">Receipt ID</td>
          <td style="padding: 10px 0; text-align: right; color: #d4af37; font-weight: bold; font-family: monospace;">${receiptId}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #71717a; text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 1px;">Client Name</td>
          <td style="padding: 10px 0; text-align: right;">${client.full_name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #71717a; text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 1px;">Amount Paid</td>
          <td style="padding: 10px 0; text-align: right; font-size: 20px; font-weight: bold; color: #ffffff;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #71717a; text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 1px;">Date of Payment</td>
          <td style="padding: 10px 0; text-align: right;">${new Date(paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
        </tr>
      </table>
    </div>

    <p style="color: #52525b; font-size: 12px; line-height: 1.6; text-align: center; margin-top: 30px;">
      Thank you for choosing <strong>Investor Saathi</strong>. A formal PDF receipt has been attached to this email for your records.
    </p>
  `, `Payment Confirmation — ${receiptId}`)

  // SEND EMAIL
  await sendEmail({
    to: [client.email],
    cc: assignedProfile?.email ? [assignedProfile.email] : undefined,
    bcc: process.env.ADMIN_BCC_EMAIL,
    subject: `Payment confirmed — ${receiptId}`,
    html: emailHtml,
    attachments: [{ filename: `${receiptId}.pdf`, content: pdfBuffer }],
  })

  // INTERNAL NOTIFICATION
  if (client.lead?.assigned_to) {
    await service.from('notifications').insert({
      user_id: client.lead.assigned_to,
      title: 'Payment received',
      message: `${client.full_name} — ${milestone.milestone_name} marked as paid.`,
      type: 'success',
      link: '/clients',
    })
  }

  return NextResponse.json({ data: updated })
}
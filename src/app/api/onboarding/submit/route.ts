import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { validateOnboardingToken } from '@/lib/utils/token'
import type { OnboardingFormData } from '@/lib/types'

// POST /api/onboarding/submit
// Public route — client submits their onboarding form
export async function POST(request: NextRequest) {
  const service = await createServiceClient()

  const formData = await request.formData()
  const token    = formData.get('token') as string
  const dataRaw  = formData.get('data')  as string
  const panFile  = formData.get('pan_file')  as File | null
  const aadhaarFile = formData.get('aadhaar_file') as File | null

  if (!token || !dataRaw) {
    return NextResponse.json({ error: 'Token and form data are required.' }, { status: 400 })
  }

  // 1. Validate token & extract quote data
  const { lead_id, quote_data, error: tokenError } = await validateOnboardingToken(token)
  if (tokenError || !lead_id) {
    return NextResponse.json({ error: tokenError ?? 'Invalid or expired link.' }, { status: 400 })
  }

  // 2. Safely parse the form data
  let formFields: OnboardingFormData;
  try {
    formFields = JSON.parse(dataRaw)
  } catch {
    return NextResponse.json({ error: 'Invalid form data format.' }, { status: 400 })
  }

  // 3. Upload PAN card
  let panDocPath: string | null = null
  if (panFile && panFile.size > 0) {
    const panBuffer = Buffer.from(await panFile.arrayBuffer())
    const panExt    = panFile.name.includes('.') ? panFile.name.split('.').pop() : 'pdf'
    const panPath   = `clients/${lead_id}/kyc/pan.${panExt}`
    
    const { error: panErr } = await service.storage
      .from('client_documents')
      .upload(panPath, panBuffer, {
        contentType: panFile.type || 'application/pdf',
        upsert:      true,
      })
    if (!panErr) panDocPath = panPath
  }

  // 4. Upload Aadhaar card
  let aadhaarDocPath: string | null = null
  if (aadhaarFile && aadhaarFile.size > 0) {
    const aadhaarBuffer = Buffer.from(await aadhaarFile.arrayBuffer())
    const aadhaarExt    = aadhaarFile.name.includes('.') ? aadhaarFile.name.split('.').pop() : 'pdf'
    const aadhaarPath   = `clients/${lead_id}/kyc/aadhaar.${aadhaarExt}`
    
    const { error: aadhaarErr } = await service.storage
      .from('client_documents')
      .upload(aadhaarPath, aadhaarBuffer, {
        contentType: aadhaarFile.type || 'application/pdf',
        upsert:      true,
      })
    if (!aadhaarErr) aadhaarDocPath = aadhaarPath
  }

  // 5. Insert client_profile
  const { data: clientProfile, error: profileError } = await service
    .from('client_profiles').upsert({
      lead_id,
      full_name:              formFields.full_name,
      phone:                  formFields.phone,
      email:                  formFields.email,
      date_of_birth:          formFields.date_of_birth  || null,
      age_range:              formFields.age_range      || null,
      occupation:             formFields.occupation     || null,
      city:                   formFields.city           || null,
      state:                  formFields.state          || null,
      pan_number:             formFields.pan_number     || null,
      aadhaar_number:         formFields.aadhaar_number || null,
      pan_doc_path:           panDocPath,
      aadhaar_doc_path:       aadhaarDocPath,
      investment_budget:      formFields.investment_budget     || null,
      heard_about_us:         formFields.heard_about_us        || null,
      project_interest:       formFields.project_interest      || null,
      plot_unit_details:      formFields.plot_unit_details     || null,
      lead_source_confirmed:  formFields.lead_source_confirmed || null,
      why_chose_us:           formFields.why_chose_us          || null,
    }, { onConflict: 'lead_id' })
    .select().single()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // 6. Register doc records in documents table
  if (panDocPath && clientProfile) {
    await service.from('documents').insert({
      client_id:     clientProfile.id,
      document_type: 'kyc',
      file_path:     panDocPath,
      file_name:     panFile!.name,
      uploaded_by:   null,
    })
  }
  
  if (aadhaarDocPath && clientProfile) {
    await service.from('documents').insert({
      client_id:     clientProfile.id,
      document_type: 'kyc',
      file_path:     aadhaarDocPath,
      file_name:     aadhaarFile!.name,
      uploaded_by:   null,
    })
  }

  // 7. Mark token as used
  await service.from('onboarding_tokens')
    .update({ used: true, used_at: new Date().toISOString() })
    .eq('token', token)

  // 8. Get assigned sales rep
  const { data: lead } = await service
    .from('leads')
    .select('assigned_to, assigned_profile:profiles!assigned_to(email, full_name)')
    .eq('id', lead_id).single()

  const assignedProfile = ((Array.isArray(lead?.assigned_profile)
    ? lead.assigned_profile[0]
    : lead?.assigned_profile) ?? null) as { email: string; full_name: string } | null

  // 9. Send notifications
  try {
    const { sendEmail } = await import('@/lib/email/mailer')
    const { onboardingCompleteEmail } = await import('@/lib/email/templates/onboarding-complete')

    if (assignedProfile) {
      // Pass the new quote_data and formFields into the template
      const emailHtml = onboardingCompleteEmail({
        clientName:   formFields.full_name,
        salesRepName: assignedProfile.full_name,
        leadId:       lead_id,
        appUrl:       process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        quoteData:    quote_data,
        formFields:   formFields,
      })
      
      await sendEmail({
        to: formFields.email, // Client Email
        cc: assignedProfile.email, // Sales Rep Email
        bcc: process.env.ADMIN_BCC_EMAIL, // Admin BCC
        subject: `Profile Confirmed - Welcome to Investor Saathi, ${formFields.full_name}!`,
        html: emailHtml,
      })

      // In-app notification for sales rep
      await service.from('notifications').insert({
        user_id: lead!.assigned_to,
        title:   'Client onboarded',
        message: `${formFields.full_name} has completed their onboarding form.`,
        type:    'success',
        link:    `/clients`,
      })
    }
  } catch (notifyErr) {
    console.error('Failed to send onboarding notifications:', notifyErr)
  }

  return NextResponse.json({ data: { success: true } }, { status: 201 })
}
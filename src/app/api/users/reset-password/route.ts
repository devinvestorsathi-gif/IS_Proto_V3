/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/mailer'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const service = await createServiceClient()

  // 1. Verify Admin Access
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminUser?.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { userId, email } = await request.json()

  // 2. Generate Password Reset Link using Service Role
  const { data, error } = await service.auth.admin.generateLink({
    type: 'recovery',
    email: email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password` }
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 3. Send Premium Receipt Email
  try {
    await sendEmail({
      to: email,
      subject: 'Security Receipt: Password Reset Request',
      html: `
        <div style="font-family: sans-serif; background-color: #09090b; padding: 40px; color: #ffffff; text-align: center;">
          <div style="margin-bottom: 24px;">
            <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Investor Sathi" style="width: 120px; height: auto;" />
          </div>
          
          <div style="background-color: #121214; border: 1px solid #27272a; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto; text-align: left;">
            <h2 style="color: #d4af37; margin-top: 0; font-size: 22px; text-align: center;">Security Protocol</h2>
            <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-bottom: 30px;">An administrator has initiated a secure password reset for your CRM access.</p>
            
            <div style="background: #18181b; padding: 20px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #d4af37;">
              <p style="margin: 0; color: #d4af37; font-weight: bold; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">Request Information</p>
              <p style="margin: 12px 0 4px; font-size: 14px; color: #ffffff;"><strong>Account:</strong> ${email}</p>
              <p style="margin: 0; font-size: 14px; color: #ffffff;"><strong>Action:</strong> Identity Verification Required</p>
            </div>

            <div style="text-align: center;">
              <a href="${data.properties.action_link}" 
                 style="display: inline-block; background: linear-gradient(to right, #d4af37, #f3e5ab); color: #000000; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(212,175,55,0.2);">
                CONFIRM & RESET PASSWORD
              </a>
            </div>
            
            <p style="color: #52525b; font-size: 11px; margin-top: 30px; line-height: 1.6; text-align: center;">
              This link is strictly for authorized personnel and expires in 60 minutes. <br/>
              Investor Sathi Internal Systems — Security ID: ${userId.slice(0,8)}
            </p>
          </div>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (mailError) {
    console.error('Mail Error:', mailError)
    return NextResponse.json({ error: 'Link generated but email failed to send.' }, { status: 500 })
  }
}
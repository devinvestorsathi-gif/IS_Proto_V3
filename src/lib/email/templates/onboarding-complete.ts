/* eslint-disable */
import { emailShell, emailButton } from '../mailer' // <-- Changed from '../resend'

export function onboardingCompleteEmail(data: {
  clientName: string
  salesRepName: string
  leadId: string
  appUrl: string
  quoteData?: Record<string, string> | null
  formFields?: any
}): string {
  
  // Conditionally render the quote block if data exists
  const quoteBlock = data.quoteData && Object.keys(data.quoteData).length > 0 ? `
  <div style="background-color:#1A1A26;border:1px solid #C9A84C;border-radius:8px;padding:24px;margin-bottom:32px;">
    <h3 style="margin:0 0 16px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#C9A84C;">
      Investment Quote Summary
    </h3>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A38;" width="40%">
          <span style="font-size:13px;color:#9A9A8A;">Project / Property</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A38;" width="60%">
          <span style="font-size:14px;color:#F5F5F0;font-weight:500;">${data.quoteData.projectName || 'N/A'}</span>
        </td>
      </tr>
      ${data.quoteData.unitDetails ? `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A38;">
          <span style="font-size:13px;color:#9A9A8A;">Unit / Plot Size</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A38;">
          <span style="font-size:14px;color:#F5F5F0;">${data.quoteData.unitDetails}</span>
        </td>
      </tr>` : ''}
      ${data.quoteData.quotedPrice ? `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A38;">
          <span style="font-size:13px;color:#9A9A8A;">Quoted Price</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A38;">
          <span style="font-size:14px;color:#C9A84C;font-weight:600;">${data.quoteData.quotedPrice}</span>
        </td>
      </tr>` : ''}
      ${data.quoteData.paymentPlan ? `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A38;">
          <span style="font-size:13px;color:#9A9A8A;">Payment Plan</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A38;">
          <span style="font-size:14px;color:#F5F5F0;">${data.quoteData.paymentPlan}</span>
        </td>
      </tr>` : ''}
    </table>
    ${data.quoteData.specialNotes ? `
    <div style="margin-top:16px;padding:12px;background-color:rgba(201,168,76,0.1);border-radius:6px;">
      <span style="font-size:12px;color:#C9A84C;font-weight:600;display:block;margin-bottom:4px;">NOTES</span>
      <span style="font-size:13px;color:#D3D3C3;font-style:italic;">${data.quoteData.specialNotes}</span>
    </div>` : ''}
  </div>
  ` : ''

  const content = `
<h2 style="margin:0 0 16px;font-size:24px;font-weight:300;color:#F5F5F0;">
  Welcome to <span style="font-weight:600;color:#C9A84C;">Investor Saathi</span>, ${data.clientName.split(' ')[0]}!
</h2>
<p style="margin:0 0 32px;font-size:15px;color:#9A9A8A;line-height:1.6;">
  Your investment profile has been successfully securely registered. We are thrilled to guide you through your real estate journey. Below is a summary of your profile and investment preferences.
</p>

${quoteBlock}

<h3 style="margin:0 0 16px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#9A9A8A;">
  Profile Details
</h3>
<div style="background-color:#1A1A26;border:1px solid #2A2A38;border-radius:8px;padding:20px;margin-bottom:32px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #2A2A38;" width="40%">
        <span style="font-size:13px;color:#9A9A8A;">Full Name</span>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #2A2A38;" width="60%">
        <span style="font-size:14px;color:#F5F5F0;font-weight:500;">${data.clientName}</span>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #2A2A38;">
        <span style="font-size:13px;color:#9A9A8A;">Phone</span>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #2A2A38;">
        <span style="font-size:14px;color:#F5F5F0;">${data.formFields?.phone || 'N/A'}</span>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #2A2A38;">
        <span style="font-size:13px;color:#9A9A8A;">Investment Budget</span>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #2A2A38;">
        <span style="font-size:14px;color:#F5F5F0;">${data.formFields?.investment_budget || 'N/A'}</span>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 0;">
        <span style="font-size:13px;color:#9A9A8A;">Dedicated Advisor</span>
      </td>
      <td style="padding:8px 0;">
        <span style="font-size:14px;color:#C9A84C;font-weight:500;">${data.salesRepName}</span>
      </td>
    </tr>
  </table>
</div>

<p style="margin:0;font-size:15px;color:#9A9A8A;line-height:1.6;border-top:1px solid #2A2A38;padding-top:24px;">
  Your dedicated advisor, <strong>${data.salesRepName}</strong>, will review your details and be in touch shortly to finalize your next steps.
</p>
`
  return emailShell(content, `Profile Confirmed - Investor Saathi`)
}
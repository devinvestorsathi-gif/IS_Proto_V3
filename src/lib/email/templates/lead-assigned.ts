import { emailShell, emailButton } from '../mailer'

export function leadAssignedEmail(data: {
  salesRepName: string
  leadName: string
  leadPhone: string
  leadSource: string
  leadId: string
  appUrl: string
}): string {
  const content = `
<h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#F5F5F0;">
  New Lead Assigned
</h2>
<p style="margin:0 0 24px;font-size:15px;color:#9A9A8A;">
  Hi ${data.salesRepName}, a new lead has been assigned to you.
</p>

<div style="background-color:#1A1A26;border:1px solid #2A2A38;border-radius:8px;padding:20px;margin-bottom:24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:6px 0;">
      <span style="font-size:12px;color:#9A9A8A;">Name</span><br/>
      <span style="font-size:16px;color:#F5F5F0;font-weight:500;">${data.leadName}</span>
    </td></tr>
    <tr><td style="border-top:1px solid #2A2A38;padding:6px 0;">
      <span style="font-size:12px;color:#9A9A8A;">Phone</span><br/>
      <span style="font-size:15px;color:#C9A84C;">${data.leadPhone}</span>
    </td></tr>
    <tr><td style="border-top:1px solid #2A2A38;padding:6px 0;">
      <span style="font-size:12px;color:#9A9A8A;">Source</span><br/>
      <span style="font-size:15px;color:#F5F5F0;">${data.leadSource}</span>
    </td></tr>
  </table>
</div>

<p style="font-size:14px;color:#9A9A8A;margin:0;">
  Log your first interaction within 24 hours for best conversion rates.
</p>
${emailButton('View Lead', `${data.appUrl}/leads/${data.leadId}`)}
`
  return emailShell(content, `New lead assigned: ${data.leadName}`)
}
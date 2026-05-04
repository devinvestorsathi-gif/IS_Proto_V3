import { emailShell, emailButton } from '../mailer'
import { formatINR, formatDate } from '@/lib/utils/formatters'

export function paymentOverdueEmail(data: {
  salesRepName: string
  clientName: string
  milestoneName: string
  amount: number
  dueDate: string
  clientId: string
  appUrl: string
}): string {
  const content = `
<h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#F5F5F0;">
   Payment Overdue
</h2>
<p style="margin:0 0 24px;font-size:15px;color:#9A9A8A;">
  Hi ${data.salesRepName}, a client payment is now overdue.
</p>

<div style="background-color:#7B2D2D22;border:1px solid #7B2D2D;border-radius:8px;padding:20px;margin-bottom:24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:6px 0;">
      <span style="font-size:12px;color:#9A9A8A;">Client</span><br/>
      <span style="font-size:15px;color:#F5F5F0;">${data.clientName}</span>
    </td></tr>
    <tr><td style="border-top:1px solid #7B2D2D55;padding:6px 0;">
      <span style="font-size:12px;color:#9A9A8A;">Milestone</span><br/>
      <span style="font-size:15px;color:#F5F5F0;">${data.milestoneName}</span>
    </td></tr>
    <tr><td style="border-top:1px solid #7B2D2D55;padding:6px 0;">
      <span style="font-size:12px;color:#9A9A8A;">Amount Due</span><br/>
      <span style="font-size:20px;color:#ef4444;font-weight:700;">${formatINR(data.amount)}</span>
    </td></tr>
    <tr><td style="border-top:1px solid #7B2D2D55;padding:6px 0;">
      <span style="font-size:12px;color:#9A9A8A;">Was Due On</span><br/>
      <span style="font-size:15px;color:#ef4444;">${formatDate(data.dueDate)}</span>
    </td></tr>
  </table>
</div>

<p style="font-size:14px;color:#9A9A8A;margin:0 0 4px;">
  Please follow up with the client immediately.
</p>
${emailButton('View Client', `${data.appUrl}/clients`)}
`
  return emailShell(content, `Overdue payment: ${data.clientName} — ${formatINR(data.amount)}`)
}
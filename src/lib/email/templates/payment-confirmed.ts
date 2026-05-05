import { emailShell, emailButton } from '../mailer'
import { formatINR, formatDate } from '@/lib/utils/formatters'

interface PaymentEmailData {
  clientName: string
  milestoneName: string
  amount: number
  receiptId: string
  paidDate: string | null 
  appUrl: string
}

export function paymentConfirmedEmail(data: PaymentEmailData): string {
  const content = `
<div style="text-align: center; margin-bottom: 32px;">
  <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#F5F5F0;">
    Payment Confirmed ✓
  </h2>
  <p style="margin:0 0 24px;font-size:15px;color:#9A9A8A;">
    Your payment for <strong>${data.milestoneName}</strong> has been received and processed.
  </p>
</div>

<div style="background-color:#1A1A26;border:1px solid #2A2A38;border-radius:8px;padding:20px;margin-bottom:24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:8px 0;">
        <p style="margin:0;font-size:12px;color:#9A9A8A;text-transform:uppercase;letter-spacing:0.5px;">Receipt ID</p>
        <p style="margin:4px 0 0;font-size:16px;color:#C9A84C;font-weight:600;font-family:monospace;">${data.receiptId}</p>
      </td>
    </tr>
    <tr>
      <td style="border-top:1px solid #2A2A38;padding:12px 0;">
        <p style="margin:0;font-size:12px;color:#9A9A8A;">Client</p>
        <p style="margin:2px 0 0;font-size:15px;color:#F5F5F0;">${data.clientName}</p>
      </td>
    </tr>
    <tr>
      <td style="border-top:1px solid #2A2A38;padding:12px 0;">
        <p style="margin:0;font-size:12px;color:#9A9A8A;">Amount Paid</p>
        <p style="margin:4px 0 0;font-size:24px;color:#D4AF37;font-weight:700;">${formatINR(data.amount)}</p>
      </td>
    </tr>
    <tr>
      <td style="border-top:1px solid #2A2A38;padding:12px 0;">
        <p style="margin:0;font-size:12px;color:#9A9A8A;">Date of Payment</p>
        <p style="margin:2px 0 0;font-size:15px;color:#F5F5F0;">${data.paidDate ? formatDate(data.paidDate) : 'Today'}</p>
      </td>
    </tr>
  </table>
</div>

<p style="margin:0 0 24px;font-size:14px;color:#9A9A8A;text-align:center;line-height:1.6;">
  Thank you for your continued trust in Investor Sathi. Your digital receipt is now available in your document vault for your records. A copy has also been sent to your assigned sales representative.
</p>

<div style="text-align: center;">
  ${emailButton('Go to Dashboard', `${data.appUrl}/dashboard`)}
</div>
`
  return emailShell(content, `Payment Confirmed — Receipt #${data.receiptId}`)
}
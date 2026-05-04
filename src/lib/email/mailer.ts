import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'

interface SendEmailOptions {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  html: string
  // FIX: Expanded the interface so TypeScript accepts Nodemailer's path and cid properties
  attachments?: Array<{ 
    filename: string; 
    content?: Buffer; 
    path?: string; 
    cid?: string; 
  }>
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendEmail(options: SendEmailOptions) {
  try {
    // 1. Prepare the attachments array (keeping your existing PDF attachments safe)
    const mailAttachments = options.attachments ? [...options.attachments] : []

    // 2. Add the logo as an inline CID attachment
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    
    if (fs.existsSync(logoPath)) {
      mailAttachments.push({
        filename: 'logo.png',
        path: logoPath, // Nodemailer reads the file directly from the disk
        cid: 'investor-sathi-logo' // The magic ID referenced in the HTML
      })
    } else {
      console.warn('Warning: logo.png not found in public folder for email attachment.')
    }

    const info = await transporter.sendMail({
      from: `"Investor Saathi" <${process.env.GMAIL_USER}>`,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      html: options.html,
      attachments: mailAttachments, // Sends both the PDF and the hidden logo
    })
    
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

export function emailShell(content: string, previewText: string = '') {
  // Use the CID reference instead of a URL or Base64 string
  const brandingHeader = `<img src="cid:investor-sathi-logo" alt="Investor Saathi" style="width: 140px; height: auto; display: block; margin: 0 auto;" />`

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${previewText}</title>
    </head>
    <body style="background-color: #09090b; margin: 0; padding: 40px 0; font-family: 'Times New Roman', Times, serif;">
      <div style="max-width: 600px; margin: 0 auto; text-align: center;">
        
        <!-- CID Embedded Branding Header -->
        <div style="margin-bottom: 30px;">
          ${brandingHeader}
        </div>

        <!-- Main Container -->
        <div style="background-color: #121214; border: 1px solid #27272a; border-radius: 16px; padding: 40px; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          ${content}
        </div>

        <!-- Footer -->
        <div style="margin-top: 30px; text-align: center;">
          <p style="color: #52525b; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
            Investor Saathi — Investment Advisory Portal
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function emailButton(text: string, url: string) {
  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="display: inline-block; background: linear-gradient(to right, #d4af37, #f3e5ab); color: #000000; font-weight: bold; font-size: 13px; text-decoration: none; padding: 16px 32px; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px;">
        ${text}
      </a>
    </div>
  `
}
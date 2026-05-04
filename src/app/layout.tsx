import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Investor Saathi CRM',
  description: 'Internal CRM for Investor Saathi',
  icons: {
    // Explicitly using your custom named file for the browser tab
    icon: '/favicon.ico.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-text-primary antialiased`}>
        {children}
      </body>
    </html>
  )
}
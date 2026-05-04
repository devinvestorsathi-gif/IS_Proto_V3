// Generate receipt ID in format: IS-2024-A1B2C3
export function generateReceiptId(): string {
  const year = new Date().getFullYear()
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `IS-${year}-${suffix}`
}

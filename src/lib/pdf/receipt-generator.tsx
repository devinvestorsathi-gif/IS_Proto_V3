// Server-side only — imported via API routes, never in client components
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { formatINR, formatDate } from '@/lib/utils/formatters'
import fs from 'fs'
import path from 'path'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding:         40,
    fontFamily:      'Helvetica',
  },
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'flex-start',
    marginBottom:      32,
    paddingBottom:     20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  // NEW: Image styling for the logo
  logoImage: {
    width:           120, // Adjust width based on your actual logo proportions
    height:          45,
    objectFit:       'contain',
    marginBottom:    8,
  },
  // Fallback box if image isn't found
  logoBox: {
    width:           36,
    height:          36,
    backgroundColor: '#C9A84C',
    borderRadius:    6,
    justifyContent:  'center',
    alignItems:      'center',
    marginBottom:    8,
  },
  logoText:  { color: '#FFFFFF', fontSize: 14, fontFamily: 'Helvetica-Bold' },
  brandName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#111827', marginTop: 4 },
  brandSub:  { fontSize:  9, color: '#6B7280', marginTop: 2 },
  receiptLabel: { fontSize: 10, color: '#6B7280', textAlign: 'right' },
  receiptId:    { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#C9A84C', textAlign: 'right', marginTop: 2 },
  amountBox: {
    backgroundColor: '#F9FAFB',
    borderRadius:    8,
    padding:         16,
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    marginBottom:    24,
    borderWidth:     1,
    borderColor:     '#E5E7EB',
  },
  amountLabel: { fontSize: 11, color: '#6B7280' },
  amountValue: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#059669' },
  sectionTitle: {
    fontSize:      10,
    color:         '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom:  12,
    marginTop:     16,
  },
  row: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    marginBottom:    8,
    paddingBottom:   8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  rowLabel: { fontSize: 10, color: '#6B7280', flex: 1 },
  rowValue: { fontSize: 10, color: '#111827', fontFamily: 'Helvetica-Bold', flex: 2, textAlign: 'right' },
  footer: {
    marginTop:      32,
    paddingTop:     20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems:     'center',
  },
  thankYou:   { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#C9A84C', marginBottom: 6 },
  footerText: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 4 },
})

export interface ReceiptData {
  receiptId:      string
  clientName:     string
  clientPhone:    string
  clientEmail:    string
  projectDetails: string
  milestoneName:  string
  amount:         number
  paidAt:         string
  salesRepName:   string
}

function ReceiptDocument({ data, logoDataUri }: { data: ReceiptData, logoDataUri: string | null }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            {/* Conditional Logo Rendering */}
            {logoDataUri ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image style={styles.logoImage} src={logoDataUri} />
            ) : (
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>IS</Text>
              </View>
            )}
            <Text style={styles.brandName}>Investor Sathi</Text>
            <Text style={styles.brandSub}>Investment Advisory</Text>
          </View>
          <View>
            <Text style={styles.receiptLabel}>PAYMENT RECEIPT</Text>
            <Text style={styles.receiptId}>{data.receiptId}</Text>
          </View>
        </View>

        {/* Amount highlight box */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>{data.milestoneName}</Text>
          <Text style={styles.amountValue}>{formatINR(data.amount)}</Text>
        </View>

        {/* Client details */}
        <Text style={styles.sectionTitle}>Client Details</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Name</Text>
          <Text style={styles.rowValue}>{data.clientName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Phone</Text>
          <Text style={styles.rowValue}>{data.clientPhone}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue}>{data.clientEmail}</Text>
        </View>

        {/* Payment details */}
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Project / Property</Text>
          <Text style={styles.rowValue}>{data.projectDetails}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Milestone</Text>
          <Text style={styles.rowValue}>{data.milestoneName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Amount Paid</Text>
          <Text style={styles.rowValue}>{formatINR(data.amount)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Payment Date</Text>
          <Text style={styles.rowValue}>{formatDate(data.paidAt)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Advisor</Text>
          <Text style={styles.rowValue}>{data.salesRepName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Receipt ID</Text>
          <Text style={styles.rowValue}>{data.receiptId}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.thankYou}>Thank you for investing with us.</Text>
          <Text style={styles.footerText}>
            This is a computer-generated receipt and does not require a signature.
          </Text>
          <Text style={styles.footerText}>For queries: hello@investorsaathi.com</Text>
        </View>

      </Page>
    </Document>
  )
}

export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  let logoDataUri = null;
  
  // Fetch logo data dynamically when generating the PDF
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    const fileBuffer = fs.readFileSync(logoPath)
    logoDataUri = `data:image/png;base64,${fileBuffer.toString('base64')}`
  } catch (err) {
    console.error('Failed to read logo.png for PDF generation:', err)
  }

  const buffer = await renderToBuffer(<ReceiptDocument data={data} logoDataUri={logoDataUri} />)
  return Buffer.from(buffer)
}
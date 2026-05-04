import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/documents/[id]/download — returns a signed URL
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const service  = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: doc } = await supabase
    .from('documents').select('file_path, file_name, document_type').eq('id', params.id).single()
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  const bucket = doc.document_type === 'receipts' ? 'receipts' : 'client-documents'

  const { data: signed, error } = await service.storage
    .from(bucket)
    .createSignedUrl(doc.file_path, 3600) // expires in 1 hour

  if (error || !signed) return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })

  return NextResponse.json({ data: { url: signed.signedUrl, file_name: doc.file_name } })
}
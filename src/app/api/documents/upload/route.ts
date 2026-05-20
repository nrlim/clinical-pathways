import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, SNAPPATH_BUCKET } from '@/lib/supabase/supabase-admin'

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const docId = formData.get('docId') as string | null

    if (!file || !docId) {
      return NextResponse.json(
        { error: 'File dan docId wajib disertakan.' },
        { status: 400 }
      )
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Tipe file tidak diizinkan: ${file.type}. Hanya PDF, JPG, PNG, dan WebP yang diterima.` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Ukuran file melebihi batas maksimal 10 MB.' },
        { status: 400 }
      )
    }

    // Build storage path: documents/{docId}/{timestamp}_{sanitizedFilename}
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `documents/${docId}/${timestamp}_${sanitizedName}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data, error } = await supabaseAdmin.storage
      .from(SNAPPATH_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('[Document Upload] Supabase Storage error:', error)
      return NextResponse.json(
        { error: `Gagal mengunggah ke storage: ${error.message}` },
        { status: 500 }
      )
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(SNAPPATH_BUCKET)
      .getPublicUrl(data.path)

    const fileSize = formatBytes(file.size)

    return NextResponse.json({
      path: data.path,
      publicUrl: urlData.publicUrl,
      fileName: file.name,
      fileSize,
    })
  } catch (error) {
    console.error('[Document Upload] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal saat upload berkas.' },
      { status: 500 }
    )
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

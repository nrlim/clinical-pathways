import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, SNAPPATH_BUCKET } from '@/lib/supabase/supabase-admin'

export async function DELETE(request: NextRequest) {
  try {
    const { path } = await request.json() as { path?: string }

    if (!path) {
      return NextResponse.json(
        { error: 'Storage path wajib disertakan.' },
        { status: 400 }
      )
    }

    // Guard: only allow deleting paths within the documents/ prefix
    if (!path.startsWith('documents/')) {
      return NextResponse.json(
        { error: 'Path tidak valid — hanya path di dalam folder documents/ yang dapat dihapus.' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin.storage
      .from(SNAPPATH_BUCKET)
      .remove([path])

    if (error) {
      console.error('[Document Delete] Supabase Storage error:', error)
      return NextResponse.json(
        { error: `Gagal menghapus berkas dari storage: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, deleted: path })
  } catch (error) {
    console.error('[Document Delete] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal saat menghapus berkas.' },
      { status: 500 }
    )
  }
}

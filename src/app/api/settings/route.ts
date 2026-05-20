import { NextRequest, NextResponse } from 'next/server'
import { getAllSettings, updateSettings } from '@/lib/settings'

export const runtime = 'nodejs'

/**
 * GET /api/settings
 * Returns all system settings as an array of { key, value, label, category }.
 */
export async function GET() {
  try {
    const settings = await getAllSettings()
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('[Settings API] GET error:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json(
      { message: 'Gagal mengambil pengaturan sistem.' },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/settings
 * Body: { updates: Record<string, string> }
 * Updates one or more settings by key. Validates range [0, 100].
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as { updates: Record<string, string> }

    if (!body.updates || typeof body.updates !== 'object') {
      return NextResponse.json({ message: 'Payload tidak valid.' }, { status: 400 })
    }

    const result = await updateSettings(body.updates)

    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 400 })
    }

    return NextResponse.json({ message: result.message })
  } catch (error) {
    console.error('[Settings API] PATCH error:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json(
      { message: 'Gagal menyimpan pengaturan.' },
      { status: 500 },
    )
  }
}

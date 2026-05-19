import { NextResponse } from 'next/server'
import { getClinicalPathwaySummary } from '@/lib/clinical-pathway/repository'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const record = await getClinicalPathwaySummary(id)
    if (!record) {
      return NextResponse.json({ message: 'Clinical pathway tidak ditemukan.' }, { status: 404 })
    }

    return NextResponse.json({ record })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Gagal mengambil detail clinical pathway.' },
      { status: 500 },
    )
  }
}

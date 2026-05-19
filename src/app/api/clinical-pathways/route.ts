import { NextResponse } from 'next/server'
import { listClinicalPathwaySummaries } from '@/lib/clinical-pathway/repository'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const sort = searchParams.get('sort') || undefined
    const pageParam = searchParams.get('page')
    const page = pageParam ? parseInt(pageParam, 10) : undefined

    const result = await listClinicalPathwaySummaries({ search, sort, page })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Gagal mengambil riwayat clinical pathway.' },
      { status: 500 },
    )
  }
}

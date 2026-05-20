import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const runtime = 'nodejs'

/**
 * GET /api/master-data?category=diagnosa|tindakan|obat|practitioner&q=search
 * Returns master data items from the database.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') ?? 'diagnosa'
    const q = searchParams.get('q')?.trim() ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '50', 10))
    const skip = (page - 1) * pageSize

    const where = q
      ? {
          isActive: true,
          OR: [
            { code: { contains: q } },
            { name: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : { isActive: true }

    let items: object[] = []
    let total = 0

    switch (category) {
      case 'diagnosa': {
        const [data, count] = await Promise.all([
          prisma.masterDiagnosis.findMany({ where, skip, take: pageSize, orderBy: { code: 'asc' } }),
          prisma.masterDiagnosis.count({ where }),
        ])
        items = data.map((d) => ({ ...d, category: 'diagnosa', baseTariff: null }))
        total = count
        break
      }
      case 'tindakan': {
        const [data, count] = await Promise.all([
          prisma.masterProcedure.findMany({ where, skip, take: pageSize, orderBy: { code: 'asc' } }),
          prisma.masterProcedure.count({ where }),
        ])
        items = data.map((d) => ({ ...d, category: 'tindakan', baseTariff: d.baseTariff ? Number(d.baseTariff) : null }))
        total = count
        break
      }
      case 'obat': {
        const [data, count] = await Promise.all([
          prisma.masterMedication.findMany({ where, skip, take: pageSize, orderBy: { code: 'asc' } }),
          prisma.masterMedication.count({ where }),
        ])
        items = data.map((d) => ({ ...d, category: 'obat', baseTariff: d.baseTariff ? Number(d.baseTariff) : null }))
        total = count
        break
      }
      case 'practitioner': {
        const practWhere = q
          ? {
              isActive: true,
              OR: [
                { nik: { contains: q } },
                { name: { contains: q } },
                { specialization: { contains: q } },
              ],
            }
          : { isActive: true }
        const [data, count] = await Promise.all([
          prisma.masterPractitioner.findMany({ where: practWhere, skip, take: pageSize, orderBy: { name: 'asc' } }),
          prisma.masterPractitioner.count({ where: practWhere }),
        ])
        items = data.map((d) => ({ ...d, category: 'practitioner', code: d.nik, baseTariff: null }))
        total = count
        break
      }
      default:
        return NextResponse.json({ message: 'Kategori tidak valid.' }, { status: 400 })
    }

    return NextResponse.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (error) {
    console.error('[Master Data API] error:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ message: 'Gagal mengambil data master.' }, { status: 500 })
  }
}

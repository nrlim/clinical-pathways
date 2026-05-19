import { NextResponse } from 'next/server'
import { buildAiSummaryFeed, buildManualMasterData } from '@/lib/clinical-pathway/feed'
import { generateClinicalPathwayBrain } from '@/lib/ai/clinical-pathway-brain'
import { saveClinicalPathwaySummary } from '@/lib/clinical-pathway/repository'
import type { ClinicalPathwayForm, ClinicalMasterData } from '@/types/clinical-pathway'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { form: ClinicalPathwayForm; masterData?: ClinicalMasterData }
    const masterData: ClinicalMasterData = payload.masterData ?? buildManualMasterData(payload.form)
    const feed = await buildAiSummaryFeed(payload.form, masterData)
    const brain = await generateClinicalPathwayBrain(feed)
    const savedRecord = await saveClinicalPathwaySummary({
      form: payload.form,
      masterData,
      feed,
      brain,
    })

    return NextResponse.json({ brain, feed, savedRecordId: savedRecord.id })
  } catch (error) {
    const cause = error instanceof Error && 'cause' in error ? error.cause : undefined
    console.error('Brain AI API Error:', error, cause)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Brain AI gagal membuat clinical pathway.' },
      { status: 502 },
    )
  }
}

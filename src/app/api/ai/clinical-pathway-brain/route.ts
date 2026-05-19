import { NextResponse } from 'next/server'
import { buildAiSummaryFeed, buildManualMasterData } from '@/lib/clinical-pathway/feed'
import { generateClinicalPathwayBrain } from '@/lib/ai/clinical-pathway-brain'
import { saveClinicalPathwaySummary } from '@/lib/clinical-pathway/repository'
import type { ClinicalPathwayForm, ClinicalMasterData } from '@/types/clinical-pathway'

export const runtime = 'nodejs'
/**
 * Allow up to 60 s of wall-clock time.
 * Per-fetch timeout (SUMOPOD_TIMEOUT_MS, default 30 s) fires well before this,
 * so the function will always return a JSON error body rather than a cold 504.
 */
export const maxDuration = 60

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
    const isTimeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
    const cause = error instanceof Error && 'cause' in error ? error.cause : undefined
    console.error('Brain AI API Error:', error, cause)
    return NextResponse.json(
      {
        message: isTimeout
          ? 'Brain AI timeout: model AI memerlukan waktu terlalu lama. Coba lagi atau gunakan model yang lebih cepat.'
          : (error instanceof Error ? error.message : 'Brain AI gagal membuat clinical pathway.'),
      },
      { status: isTimeout ? 504 : 502 },
    )
  }
}

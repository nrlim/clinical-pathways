import { buildAiSummaryFeed, buildManualMasterData } from '@/lib/clinical-pathway/feed'
import { generateClinicalPathwayBrain } from '@/lib/ai/clinical-pathway-brain'
import { saveClinicalPathwaySummary } from '@/lib/clinical-pathway/repository'
import { prisma } from '@/lib/db/prisma'
import { FatalError } from 'workflow'
import type { ClinicalPathwayForm, ClinicalMasterData, AiSummaryFeed } from '@/types/clinical-pathway'
import type { AiClinicalPathwayResponse } from '@/types/ai-clinical-pathway'

export interface WorkflowPayload {
  form: ClinicalPathwayForm
  masterData?: ClinicalMasterData
}

/**
 * Step 1: Build the master data feed from form data.
 * Resolves master data (manual or passed in) and builds the structured AI feed.
 */
export async function buildFeedStep(payload: WorkflowPayload): Promise<{
  feed: AiSummaryFeed
  masterData: ClinicalMasterData
}> {
  'use step'

  const masterData: ClinicalMasterData = payload.masterData ?? buildManualMasterData(payload.form)
  const feed = await buildAiSummaryFeed(payload.form, masterData)
  return { feed, masterData }
}
buildFeedStep.maxRetries = 2

/**
 * Step 2: Validate feed against master data.
 * Checkpointing boundary — returns the feed as-is after build step succeeds.
 */
export async function validateMasterDataStep(feed: AiSummaryFeed): Promise<AiSummaryFeed> {
  'use step'

  return feed
}
validateMasterDataStep.maxRetries = 1

/**
 * Step 3: Call the Brain AI (SumoPod kimi-k2.6).
 *
 * maxRetries = 1 → up to 2 total attempts.
 * This prevents triple-billing on the heavy AI call.
 * SumoPod network-level retries (3x) already handle transient failures internally.
 */
export async function callBrainAiStep(feed: AiSummaryFeed): Promise<AiClinicalPathwayResponse> {
  'use step'

  try {
    const brain = await generateClinicalPathwayBrain(feed)
    return brain
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // If the error is a permanent API key / auth issue, don't retry
    if (message.includes('401') || message.includes('403') || message.includes('SUMOPOD_API_KEY')) {
      throw new FatalError(`SumoPod auth gagal (non-retryable): ${message}`)
    }
    throw error
  }
}
callBrainAiStep.maxRetries = 1

/**
 * Step 4: Save the results to the database.
 * Updates the record with the workflowRunId so the status endpoint can find it.
 */
export async function saveToDbStep(
  form: ClinicalPathwayForm,
  masterData: ClinicalMasterData,
  feed: AiSummaryFeed,
  brain: AiClinicalPathwayResponse,
  workflowRunId: string,
): Promise<{ id: string }> {
  'use step'

  const savedRecord = await saveClinicalPathwaySummary({ form, masterData, feed, brain })

  // Mark workflow as completed in DB so the status route can retrieve the full result
  await prisma.clinicalPathwaySummary.update({
    where: { id: savedRecord.id },
    data: { workflowRunId, workflowStatus: 'completed' },
  })

  return { id: savedRecord.id }
}
saveToDbStep.maxRetries = 2

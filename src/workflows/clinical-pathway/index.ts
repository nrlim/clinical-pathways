import { buildFeedStep, validateMasterDataStep, callBrainAiStep, saveToDbStep } from './steps'
import type { WorkflowPayload } from './steps'
import type { AiClinicalPathwayResponse } from '@/types/ai-clinical-pathway'
import type { AiSummaryFeed } from '@/types/clinical-pathway'

export interface ClinicalPathwayWorkflowResult {
  brain: AiClinicalPathwayResponse
  feed: AiSummaryFeed
  savedRecordId: string
}

/**
 * SnapPath Workflow Orchestrator
 *
 * Runs 4 steps in sequence with durability and automatic retry:
 *   1. buildFeedStep     — Build structured AI feed from form + master data
 *   2. validateMasterDataStep — Confirm validated feed checkpoint
 *   3. callBrainAiStep   — Call SumoPod AI (retried up to 3x on failure)
 *   4. saveToDbStep      — Persist result to ClinicalPathwaySummary
 *
 * This workflow is called via `start()` from the API route and runs in the background.
 * The client polls `/api/workflow/status?runId=...` to check progress.
 */
export async function clinicalPathwayWorkflow(
  payload: WorkflowPayload,
  workflowRunId: string,
): Promise<ClinicalPathwayWorkflowResult> {
  'use workflow'

  // Step 1: Build the AI feed
  const { feed, masterData } = await buildFeedStep(payload)

  // Step 2: Validate master data (checkpointing boundary)
  const validatedFeed = await validateMasterDataStep(feed)

  // Step 3: Call Brain AI with retry
  const brain = await callBrainAiStep(validatedFeed)

  // Step 4: Save to database
  const { id: savedRecordId } = await saveToDbStep(
    payload.form,
    masterData,
    validatedFeed,
    brain,
    workflowRunId,
  )

  return { brain, feed: validatedFeed, savedRecordId }
}

import { NextResponse } from 'next/server'
import { start } from 'workflow/api'
import { clinicalPathwayWorkflow } from '@/workflows/clinical-pathway'
import type { ClinicalPathwayForm, ClinicalMasterData } from '@/types/clinical-pathway'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { form: ClinicalPathwayForm; masterData?: ClinicalMasterData }

    // Step 1: Start the workflow — gets runId immediately.
    // We pass an empty string as workflowRunId placeholder first,
    // then the saveToDbStep will receive the actual runId we pass below.
    //
    // The actual approach: start() returns run.runId synchronously after enqueuing.
    // We pass runId as the second arg to the workflow so saveToDbStep can store it.
    // We start the workflow with a temporary empty runId, get the real one, then rely
    // on the workflow SDK to pass the full argument list as provided.
    //
    // Correct pattern: start() enqueues [payload, runId] atomically.
    // We do a two-phase approach: start with placeholder, update DB after.
    // Since saveToDbStep receives workflowRunId from the workflow args, we need to
    // ensure run.runId is what's stored. The simplest fix: pass run.runId in a
    // separate "seed" step that we trigger from the status endpoint.
    //
    // SIMPLEST CORRECT APPROACH: generate a stable ID ourselves before starting.
    const { randomUUID } = await import('crypto')
    const stableRunId = randomUUID()

    // Pass the stableRunId as argument — the workflow will store this in the DB.
    const run = await start(clinicalPathwayWorkflow, [payload, stableRunId])

    // Use the actual runId from the SDK (may differ from stableRunId).
    // The DB record stores stableRunId for lookup via the status endpoint.
    return NextResponse.json({
      runId: run.runId,
      stableRunId,
    })
  } catch (error) {
    const cause = error instanceof Error && 'cause' in error ? error.cause : undefined
    console.error('Workflow Start Error:', error, cause)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Gagal memulai workflow clinical pathway.' },
      { status: 502 },
    )
  }
}

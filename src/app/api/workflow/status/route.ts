import { NextRequest, NextResponse } from 'next/server'
import { getRun } from 'workflow/api'
import { prisma } from '@/lib/db/prisma'
import type { AiClinicalPathwayResponse } from '@/types/ai-clinical-pathway'
import type { AiSummaryFeed } from '@/types/clinical-pathway'

export const runtime = 'nodejs'

export interface WorkflowStatusResponse {
  status: 'running' | 'completed' | 'failed' | 'not_found'
  currentStep?: string
  brain?: AiClinicalPathwayResponse
  feed?: AiSummaryFeed
  savedRecordId?: string
  error?: string
}

/**
 * GET /api/workflow/status?runId=xxx&stableRunId=yyy
 *
 * Polls the Workflow SDK for run status, then cross-references with
 * the database (by stableRunId) to return the full result when completed.
 */
export async function GET(request: NextRequest): Promise<NextResponse<WorkflowStatusResponse>> {
  const { searchParams } = new URL(request.url)
  const runId = searchParams.get('runId')
  const stableRunId = searchParams.get('stableRunId') ?? runId

  if (!runId) {
    return NextResponse.json({ status: 'not_found', error: 'runId parameter is required' }, { status: 400 })
  }

  try {
    const run = getRun(runId)

    // Check if the run exists
    const exists = await run.exists
    if (!exists) {
      // If the workflow SDK says it doesn't exist, it may be a local world warming up
      // Check if the DB record already has a completed entry (race condition safety)
      if (stableRunId) {
        const record = await prisma.clinicalPathwaySummary.findFirst({
          where: { workflowRunId: stableRunId, workflowStatus: 'completed' },
          orderBy: { createdAt: 'desc' },
        })
        if (record) {
          return buildCompletedResponse(record)
        }
      }
      return NextResponse.json({ status: 'not_found', error: 'Workflow run tidak ditemukan.' }, { status: 404 })
    }

    const wfStatus = await run.status

    if (wfStatus === 'failed' || wfStatus === 'cancelled') {
      return NextResponse.json({ status: 'failed', error: 'Workflow gagal. Silakan coba lagi.' })
    }

    if (wfStatus === 'completed') {
      // Look up the DB record by stableRunId (stored by saveToDbStep)
      const record = await prisma.clinicalPathwaySummary.findFirst({
        where: { workflowRunId: stableRunId ?? undefined },
        orderBy: { createdAt: 'desc' },
      })

      if (!record) {
        // Workflow completed but DB not yet committed — brief race condition, treat as running
        return NextResponse.json({ status: 'running' })
      }

      return buildCompletedResponse(record)
    }

    // running / pending / any other status
    return NextResponse.json({ status: 'running' })
  } catch (error) {
    console.error('Workflow status check error:', error)
    return NextResponse.json(
      { status: 'failed', error: error instanceof Error ? error.message : 'Gagal memeriksa status workflow.' },
      { status: 500 },
    )
  }
}

function buildCompletedResponse(record: {
  brainResult: unknown
  rawText: string | null
  aiModel: string
  generatedAt: Date
  aiFeed: unknown
  id: string
}): NextResponse<WorkflowStatusResponse> {
  return NextResponse.json({
    status: 'completed',
    brain: {
      result: record.brainResult as AiClinicalPathwayResponse['result'],
      rawText: record.rawText ?? '',
      model: record.aiModel,
      generatedAt: record.generatedAt.toISOString(),
      latencyMs: 0,
    },
    feed: record.aiFeed as AiSummaryFeed,
    savedRecordId: record.id,
  })
}

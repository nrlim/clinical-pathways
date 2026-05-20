/**
 * AI Router — Provider Abstraction Layer
 *
 * Routes AI completions to the configured provider:
 *   - "sumopod"  → calls SumoPod AI Gateway (primary)
 *   - "vercel"   → calls Vercel AI Gateway directly
 *
 * Automatic fallback:
 *   If provider is "sumopod" and the call fails, the router automatically
 *   retries with Vercel AI Gateway before surfacing an error.
 *
 * Called from: clinical-pathway-brain.ts
 */

import type { SumoPodCompletionInput } from './sumopod'
import { createSumoPodChatCompletion, getSumoPodModel } from './sumopod'
import { createVercelAiCompletion, getVercelModel } from './vercel-ai-gateway'
import { getAiProviderSettings } from '@/lib/settings'

export type AiProvider = 'sumopod' | 'vercel'

export interface AiRouterResult {
  content: string
  /** Resolved model identifier (e.g. "gpt-4o-mini" or "openai/gpt-4o-mini") */
  model: string
  /** Which provider actually responded */
  provider: AiProvider
  /** True when SumoPod failed and Vercel was used automatically */
  usedFallback: boolean
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Calls AI via the configured provider.
 * Falls back automatically to Vercel AI Gateway if SumoPod fails.
 */
export async function callAi(input: SumoPodCompletionInput): Promise<AiRouterResult> {
  const settings = await getAiProviderSettings()
  const provider = settings.aiProvider

  if (provider === 'vercel') {
    return callVercel(input, settings.aiVercelModel)
  }

  // Default: SumoPod with automatic fallback
  return callSumoPodWithFallback(input, settings)
}

// ─── Provider callers ─────────────────────────────────────────────────────────

async function callSumoPodWithFallback(
  input: SumoPodCompletionInput,
  settings: { aiSumopodModel: string; aiVercelModel: string },
): Promise<AiRouterResult> {
  try {
    const content = await createSumoPodChatCompletion(input)
    return {
      content,
      model: getSumoPodModel(settings.aiSumopodModel),
      provider: 'sumopod',
      usedFallback: false,
    }
  } catch (sumopodError) {
    const sumopodErrorMsg = (sumopodError as Error)?.message ?? 'unknown'
    console.warn('[AI Router] SumoPod gagal, menggunakan Vercel AI Gateway sebagai fallback.', sumopodErrorMsg)

    // Check if Vercel is configured — if not, re-throw original error
    if (!process.env.VERCEL_AI_GATEWAY_API_KEY) {
      throw new Error(
        `SumoPod AI gagal dan VERCEL_AI_GATEWAY_API_KEY tidak dikonfigurasi untuk fallback. ` +
        `Detail SumoPod: ${sumopodErrorMsg}`,
      )
    }

    const content = await createVercelAiCompletion(input, settings.aiVercelModel)
    return {
      content,
      model: getVercelModel(settings.aiVercelModel),
      provider: 'vercel',
      usedFallback: true,
    }
  }
}

async function callVercel(input: SumoPodCompletionInput, modelOverride?: string): Promise<AiRouterResult> {
  const content = await createVercelAiCompletion(input, modelOverride)
  return {
    content,
    model: getVercelModel(modelOverride),
    provider: 'vercel',
    usedFallback: false,
  }
}

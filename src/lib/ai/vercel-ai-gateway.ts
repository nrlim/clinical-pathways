/**
 * Vercel AI Gateway Client
 *
 * OpenAI-compatible client for https://ai-gateway.vercel.sh/v1
 * Used as a fallback when SumoPod is unavailable.
 *
 * Env:
 *   VERCEL_AI_GATEWAY_API_KEY — API key from Vercel Dashboard → AI Gateway
 */

import type { SumoPodCompletionInput } from './sumopod'

const VERCEL_GATEWAY_BASE_URL = 'https://ai-gateway.vercel.sh/v1'
const DEFAULT_VERCEL_MODEL = 'openai/gpt-4o-mini'

// ─── Model catalogue (shown in Settings dropdown) ─────────────────────────────

export interface VercelModelOption {
  value: string
  label: string
  provider: string
}

export const VERCEL_MODEL_OPTIONS: VercelModelOption[] = [
  // OpenAI
  { value: 'openai/gpt-4o',         label: 'GPT-4o',              provider: 'OpenAI' },
  { value: 'openai/gpt-4o-mini',    label: 'GPT-4o Mini',         provider: 'OpenAI' },
  // Anthropic
  { value: 'anthropic/claude-sonnet-4-5',  label: 'Claude Sonnet 4.5', provider: 'Anthropic' },
  { value: 'anthropic/claude-haiku-3-5',   label: 'Claude Haiku 3.5',  provider: 'Anthropic' },
  // Google
  { value: 'google/gemini-2.0-flash',      label: 'Gemini 2.0 Flash',  provider: 'Google' },
  { value: 'google/gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash Preview', provider: 'Google' },
]

interface VercelChatChoice {
  message?: { content?: string | null }
  finish_reason?: string
}

interface VercelChatResponse {
  choices?: VercelChatChoice[]
  error?: { message?: string }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the active Vercel AI Gateway model.
 * Priority: DB setting (passed in) → env → default
 */
export function getVercelModel(dbModel?: string): string {
  return dbModel ?? process.env.VERCEL_GATEWAY_MODEL ?? DEFAULT_VERCEL_MODEL
}

/**
 * Calls Vercel AI Gateway with an OpenAI-compatible chat completion request.
 * Throws if the API key is missing or the request fails after retries.
 */
export async function createVercelAiCompletion(
  input: SumoPodCompletionInput,
  modelOverride?: string,
): Promise<string> {
  const apiKey = process.env.VERCEL_AI_GATEWAY_API_KEY
  if (!apiKey) {
    throw new Error('VERCEL_AI_GATEWAY_API_KEY belum dikonfigurasi di environment server.')
  }

  const model = getVercelModel(modelOverride)
  const endpoint = `${VERCEL_GATEWAY_BASE_URL}/chat/completions`

  const body: Record<string, unknown> = {
    model,
    messages: input.messages,
    max_tokens: input.maxTokens ?? 8000,
    temperature: input.temperature ?? 0.1,
  }

  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(`Vercel AI Gateway gagal (${response.status}): ${message || response.statusText}`)
      }

      const payload = await response.json() as VercelChatResponse

      if (payload.error?.message) {
        throw new Error(`Vercel AI Gateway error: ${payload.error.message}`)
      }

      const content = payload.choices?.[0]?.message?.content
      if (typeof content === 'string' && content.trim()) {
        return content.trim()
      }

      throw new Error(`Vercel AI Gateway tidak mengembalikan konten. finish_reason=${payload.choices?.[0]?.finish_reason ?? 'unknown'}`)
    } catch (error) {
      lastError = error
      console.warn(`[VercelAI] Attempt ${attempt} gagal:`, error instanceof Error ? error.message : String(error))
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }

  throw new Error(`Koneksi ke Vercel AI Gateway gagal setelah 3 percobaan. Detail: ${(lastError as Error)?.message ?? 'fetch failed'}`)
}

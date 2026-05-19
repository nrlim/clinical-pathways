interface SumoPodChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface SumoPodContentPart {
  type?: string
  text?: string
}

interface SumoPodChatChoice {
  text?: string
  finish_reason?: string
  message?: {
    content?: string | SumoPodContentPart[] | null
    reasoning_content?: string | null
  }
}

interface SumoPodChatResponse {
  choices?: SumoPodChatChoice[]
  error?: {
    message?: string
  }
}

export interface SumoPodCompletionInput {
  messages: SumoPodChatMessage[]
  temperature?: number
  maxTokens?: number
}

const DEFAULT_SUMOPOD_BASE_URL = 'https://ai.sumopod.com/v1'
const DEFAULT_SUMOPOD_MODEL = 'gpt-4o-mini'

export function getSumoPodModel(): string {
  return process.env.SUMOPOD_MODEL ?? DEFAULT_SUMOPOD_MODEL
}

export async function createSumoPodChatCompletion(input: SumoPodCompletionInput): Promise<string> {
  const apiKey = process.env.SUMOPOD_API_KEY
  if (!apiKey) {
    throw new Error('SUMOPOD_API_KEY belum dikonfigurasi di environment server.')
  }

  const baseUrl = process.env.SUMOPOD_BASE_URL ?? DEFAULT_SUMOPOD_BASE_URL
  const shouldUseJsonMode = process.env.SUMOPOD_JSON_MODE === 'true'
  const response = await requestSumoPodCompletion(baseUrl, apiKey, input, shouldUseJsonMode)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`SumoPod AI gagal (${response.status}): ${message || response.statusText}`)
  }

  const payload = await response.json() as SumoPodChatResponse
  const content = extractContent(payload)
  if (!content) {
    if (shouldUseJsonMode) {
      const retryResponse = await requestSumoPodCompletion(baseUrl, apiKey, input, false)
      if (!retryResponse.ok) {
        const message = await retryResponse.text()
        throw new Error(`SumoPod AI retry gagal (${retryResponse.status}): ${message || retryResponse.statusText}`)
      }
      const retryPayload = await retryResponse.json() as SumoPodChatResponse
      const retryContent = extractContent(retryPayload)
      if (retryContent) return retryContent
      throw new Error(`SumoPod AI tidak mengembalikan konten summary. finish_reason=${retryPayload.choices?.[0]?.finish_reason ?? 'unknown'}`)
    }

    const compactRetryResponse = await requestSumoPodCompletion(baseUrl, apiKey, {
      ...input,
      maxTokens: Math.min(input.maxTokens ?? 3500, 3500),
      temperature: 0.1,
    }, false)
    if (!compactRetryResponse.ok) {
      const message = await compactRetryResponse.text()
      throw new Error(`SumoPod AI retry gagal (${compactRetryResponse.status}): ${message || compactRetryResponse.statusText}`)
    }
    const compactRetryPayload = await compactRetryResponse.json() as SumoPodChatResponse
    const compactRetryContent = extractContent(compactRetryPayload)
    if (compactRetryContent) return compactRetryContent

    throw new Error(`SumoPod AI tidak mengembalikan konten summary. finish_reason=${payload.choices?.[0]?.finish_reason ?? 'unknown'}`)
  }

  return content
}

async function requestSumoPodCompletion(
  baseUrl: string,
  apiKey: string,
  input: SumoPodCompletionInput,
  jsonMode: boolean,
): Promise<Response> {
  const body: Record<string, unknown> = {
    model: getSumoPodModel(),
    messages: input.messages,
    max_tokens: input.maxTokens ?? 3500,
    temperature: input.temperature ?? 0.25,
  }

  if (jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store' as RequestCache,
  }

  // Attempt up to 3 times to handle sporadic network errors (ECONNRESET / IPv6 flip).
  // No AbortSignal — we wait as long as SumoPod needs within Vercel's maxDuration budget.
  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fetch(endpoint, options)
    } catch (error) {
      lastError = error
      console.warn(`[SumoPod] Fetch attempt ${attempt} failed:`, (error as any)?.message || error)
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  throw new Error(`Koneksi ke Brain AI gagal setelah 3 percobaan. Detail: ${(lastError as any)?.message || 'fetch failed'}`)
}

function extractContent(payload: SumoPodChatResponse): string | null {
  const choice = payload.choices?.[0]
  const content = choice?.message?.content

  if (typeof content === 'string' && content.trim()) return content
  if (Array.isArray(content)) {
    const text = content
      .map((part) => part.text ?? '')
      .join('\n')
      .trim()
    if (text) return text
  }
  if (choice?.text?.trim()) return choice.text
  if (choice?.message?.reasoning_content?.trim()) return choice.message.reasoning_content
  if (payload.error?.message) return payload.error.message

  return null
}

/**
 * Settings Library — AI Threshold Configuration
 *
 * Server-side only. Reads threshold values from the `cp_system_settings` table.
 * Falls back to hardcoded defaults if the DB is unavailable.
 *
 * Called from: feed.ts, clinical-pathway-brain.ts, API routes.
 */

import { prisma } from '@/lib/db/prisma'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ThresholdSettings {
  /** Percentage above master tariff that flags a procedure as overcharge (e.g. 20 = 20%) */
  procedureOverchargePct: number
  /** Percentage below master tariff that flags a procedure as undercharge */
  procedureUnderchargePct: number
  /** Percentage above master tariff that flags a medication as overcharge */
  medicationOverchargePct: number
  /** Percentage below master tariff that flags a medication as undercharge */
  medicationUnderchargePct: number
  /** Percentage above expectedLos that flags LOS as overcharge (prolonged stay) */
  losOverchargePct: number
  /** Percentage below expectedLos that flags LOS as undercharge (premature discharge) */
  losUnderchargePct: number
}

export interface AiProviderSettings {
  /** Active AI provider: "sumopod" or "vercel" */
  aiProvider: 'sumopod' | 'vercel'
  /** Model string for SumoPod (e.g. "gpt-4o-mini", "kimi-k2.6") */
  aiSumopodModel: string
  /** Model string for Vercel AI Gateway (e.g. "openai/gpt-4o-mini") */
  aiVercelModel: string
}

export interface SettingRow {
  key: string
  value: string
  label: string
  category: string
}

// ─── Defaults (safe fallbacks) ─────────────────────────────────────────────────

const DEFAULTS: ThresholdSettings = {
  procedureOverchargePct:  20,
  procedureUnderchargePct: 20,
  medicationOverchargePct:  25,
  medicationUnderchargePct: 25,
  losOverchargePct:  20,
  losUnderchargePct: 30,
}

const AI_PROVIDER_DEFAULTS: AiProviderSettings = {
  aiProvider: 'sumopod',
  aiSumopodModel: 'gpt-4o-mini',
  aiVercelModel: 'openai/gpt-4o-mini',
}

const KEY_MAP: Record<string, keyof ThresholdSettings> = {
  threshold_procedure_overcharge_pct:  'procedureOverchargePct',
  threshold_procedure_undercharge_pct: 'procedureUnderchargePct',
  threshold_medication_overcharge_pct: 'medicationOverchargePct',
  threshold_medication_undercharge_pct:'medicationUnderchargePct',
  threshold_los_overcharge_pct:        'losOverchargePct',
  threshold_los_undercharge_pct:       'losUnderchargePct',
}

const AI_KEY_MAP: Record<string, keyof AiProviderSettings> = {
  ai_provider:       'aiProvider',
  ai_sumopod_model:  'aiSumopodModel',
  ai_vercel_model:   'aiVercelModel',
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetches all threshold settings from the database.
 * Falls back to defaults if any key is missing or the DB fails.
 */
export async function getThresholds(): Promise<ThresholdSettings> {
  try {
    const rows = await prisma.systemSetting.findMany({
      where: { category: { startsWith: 'threshold_' } },
    })

    const result = { ...DEFAULTS }
    for (const row of rows) {
      const prop = KEY_MAP[row.key]
      if (prop) {
        const parsed = parseFloat(row.value)
        if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100) {
          result[prop] = parsed
        }
      }
    }
    return result
  } catch {
    // DB unavailable — use safe defaults so workflow isn't blocked
    return { ...DEFAULTS }
  }
}

/**
 * Fetches AI provider settings (provider, models) from the database.
 * Falls back to defaults if the DB fails.
 */
export async function getAiProviderSettings(): Promise<AiProviderSettings> {
  try {
    const rows = await prisma.systemSetting.findMany({
      where: { category: 'ai_provider' },
    })

    const result: AiProviderSettings = { ...AI_PROVIDER_DEFAULTS }
    for (const row of rows) {
      const prop = AI_KEY_MAP[row.key]
      if (prop === 'aiProvider') {
        if (row.value === 'sumopod' || row.value === 'vercel') {
          result.aiProvider = row.value
        }
      } else if (prop === 'aiSumopodModel' || prop === 'aiVercelModel') {
        if (row.value.trim()) result[prop] = row.value.trim()
      }
    }
    return result
  } catch {
    return { ...AI_PROVIDER_DEFAULTS }
  }
}

/**
 * Fetches all setting rows for the Settings UI page.
 */
export async function getAllSettings(): Promise<SettingRow[]> {
  const rows = await prisma.systemSetting.findMany({
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  })
  return rows.map((r) => ({
    key: r.key,
    value: r.value,
    label: r.label,
    category: r.category,
  }))
}

/**
 * Updates one or more settings by key.
 * - For threshold keys: validates numeric range [0, 100].
 * - For AI provider keys: validates allowed string values.
 * Returns an error message if validation fails.
 */
export async function updateSettings(
  updates: Record<string, string>,
): Promise<{ success: boolean; message: string }> {
  const entries = Object.entries(updates)

  for (const [key, rawValue] of entries) {
    if (KEY_MAP[key]) {
      // Numeric threshold validation
      const num = parseFloat(rawValue)
      if (!Number.isFinite(num) || num < 0 || num > 100) {
        return { success: false, message: `Nilai untuk "${key}" tidak valid. Harus antara 0–100.` }
      }
    } else if (AI_KEY_MAP[key]) {
      // AI provider string validation
      if (key === 'ai_provider' && rawValue !== 'sumopod' && rawValue !== 'vercel') {
        return { success: false, message: `Nilai ai_provider harus "sumopod" atau "vercel".` }
      }
      if ((key === 'ai_sumopod_model' || key === 'ai_vercel_model') && !rawValue.trim()) {
        return { success: false, message: `Model AI tidak boleh kosong.` }
      }
    } else {
      return { success: false, message: `Kunci pengaturan "${key}" tidak dikenali.` }
    }
  }

  await Promise.all(
    entries.map(([key, value]) =>
      prisma.systemSetting.update({
        where: { key },
        data: { value },
      }),
    ),
  )

  return { success: true, message: 'Pengaturan berhasil disimpan.' }
}

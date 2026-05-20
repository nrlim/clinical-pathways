import type { AiSummaryFeed } from '@/types/clinical-pathway'
import type {
  AiClinicalPathwayBrainOutput,
  AiClinicalPathwayResponse,
  AiValidatedClinicalItem,
  AiValidationStatus,
} from '@/types/ai-clinical-pathway'
import { createSumoPodChatCompletion, getSumoPodModel } from './sumopod'

export async function generateClinicalPathwayBrain(feed: AiSummaryFeed): Promise<AiClinicalPathwayResponse> {
  const startedAt = Date.now()
  const rawText = await createSumoPodChatCompletion({
    temperature: 0.1,
    // maxTokens: batas output — model berhenti saat selesai, bukan saat mencapai limit.
    // 8000 mencegah truncation JSON schema besar tanpa memperlambat response.
    maxTokens: 8000,
    // budgetTokens: ini yang menentukan kecepatan thinking kimi-k2.6.
    // 1500 cukup untuk reasoning kasus klinis standar (1–3 prosedur/obat).
    // Jangan naikkan kecuali ada kasus sangat kompleks yang butuh reasoning panjang.
    budgetTokens: 1500,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(feed) },
    ],
  })
  const latencyMs = Date.now() - startedAt

  return {
    result: await parseBrainOutput(rawText, feed),
    rawText,
    model: getSumoPodModel(),
    generatedAt: new Date().toISOString(),
    latencyMs,
  }
}

function buildSystemPrompt(): string {
  return `You are a Clinical Pathway Brain AI for Indonesian hospitals.
Act as a multidisciplinary team: DPJP, nurse, pharmacist, case manager, INA-CBGs coder.

Rules:
- The feed includes "masterDataValidation" — pre-computed cross-checks against local Master Data (ICD-10, FORNAS, INA-CBG). Use these as the PRIMARY validation basis.
  · "valid" → item registered and active; use masterName/masterTariff as reference.
  · "not_found" → not in local catalog; mark "perlu_review" and log in dataQualityIssues.
  · "not_active" → registered but inactive; mark "tidak_sesuai".
- Do not invent data not present in the feed. Log gaps in dataQualityIssues.
- Do not create new diagnoses; differentials are allowed as risks.
- Validate each item against the clinical diagnosis.
- When masterTariff is available, use it as base price in priceAssessment.
- Output is clinical decision support, not a substitute for physician orders.
- Use clinical Indonesian for all text fields.
- Return ONLY valid JSON without markdown or extra explanation.`
}

function buildUserPrompt(feed: AiSummaryFeed): string {
  const schema = `{"executiveSummary":"str","clinicalSynopsis":"str","workingAssessment":"str","pathwayName":"str","careGoals":["str"],"validationDashboard":{"overallStatus":"sesuai|tidak_sesuai|perlu_review|data_kurang","score":0,"passedCount":0,"reviewCount":0,"failedCount":0,"totalFlaggedCost":0,"quickFindings":["str"],"validatedItems":[{"id":"str","type":"procedure|medication","code":"str","name":"str","status":"sesuai|tidak_sesuai|perlu_review|data_kurang","diagnosisRelation":"str","masterDataValidation":"str","unitCost":0,"quantity":0,"totalCost":0,"priceAssessment":"str","issue":"str","recommendedAction":"str"}]},"dayByDayPlan":[{"day":"str","focus":"str","assessments":["str"],"interventions":["str"],"medicationConsiderations":["str"],"monitoring":["str"],"dischargeCriteria":["str"]}],"conformanceAnalysis":{"diagnosisProcedureFit":"str","diagnosisMedicationFit":"str","inpatientJustification":"str","losAssessment":"str","costSignal":"str"},"riskStratification":[{"level":"rendah|sedang|tinggi|kritis","issue":"str","rationale":"str","recommendedAction":"str"}],"pathwayVariances":[{"area":"str","observedVariance":"str","potentialImpact":"str","recommendedFollowUp":"str"}],"dischargeReadiness":{"status":"belum_siap|perlu_review|siap|tidak_dinilai","criteriaMet":["str"],"blockers":["str"],"followUpPlan":"str","patientEducation":"str"},"masterDataMapping":{"patientReference":"str","suggestedResources":["str"],"missingMasterData":["str"]},"aiSummaryForClinician":"str","aiSummaryForCoder":"str","aiSummaryForPatient":"str","safetyNotes":["str"],"dataQualityIssues":["str"]}`

  const compressedFeed = buildCompressedFeed(feed)

  return `Generate a clinical pathway from the feed below. Return valid JSON matching this exact schema:
${schema}

Instructions:
1. executiveSummary: concise but complete clinical executive summary (condition, plan, outlook).
2. clinicalSynopsis: full clinical narrative (disease course, current status, relevant factors).
3. dayByDayPlan: daily care plan per LOS from feed — MAX 7 days. Each day must have specific, operational (not generic) assessments, interventions, medicationConsiderations, monitoring, and dischargeCriteria.
4. validatedItems: validate EVERY procedure/medication using "masterDataValidation" in feed. Use same "id" from feed. If status=valid: use masterName as name, masterTariff as unitCost reference. If status=not_found: mark perlu_review, log in issue+dataQualityIssues. If status=not_active: mark tidak_sesuai.
5. Mark "tidak_sesuai" if item is clinically unrelated to diagnosis or conformance=tidak.
6. Compute validationDashboard: accurate score 0-100, counts, totalFlaggedCost from all non-sesuai items.
7. riskStratification, pathwayVariances, dischargeReadiness: specific and actionable, not generic.
8. masterDataMapping: summarize found/missing items and what needs to be added.
9. Three distinct summaries: clinician (clinical depth), coder (codes & billing), patient (plain language).

Feed:
${compressedFeed}`
}

/**
 * Builds a minimal feed payload for the AI — strips non-clinical fields to reduce input tokens.
 * masterDataValidation is kept intact as it is the core validation basis.
 */
function buildCompressedFeed(feed: AiSummaryFeed): string {
  const compressed = {
    patient: {
      name: feed.patient.patient_name,
      nik: feed.patient.nik,
      birth_date: feed.patient.birth_date,
      gender: feed.patient.gender,
      mr_number: feed.patient.mr_number,
      guarantor: feed.patient.guarantor,
      bpjs_number: feed.patient.bpjs_number,
    },
    encounter: {
      class: feed.encounter.encounter_class,
      admission: feed.encounter.admission_date,
      discharge: feed.encounter.discharge_date,
      ward: feed.encounter.ward,
      expected_los: feed.encounter.expected_los,
      practitioner: feed.encounter.practitioner_name,
      org: feed.encounter.organization_id,
    },
    diagnosis: {
      primary_code: feed.diagnosis.primary_diagnosis_code,
      primary_name: feed.diagnosis.primary_diagnosis_name,
      secondary: feed.diagnosis.secondary_diagnoses,
      severity: feed.diagnosis.severity,
      comorbidities: feed.diagnosis.comorbidities,
    },
    procedures: feed.procedures.map(p => ({
      id: p.id,
      code: p.icd9_code,
      name: p.name,
      category: p.category,
      date: p.performed_date,
      conformance: p.conformance,
      cost: p.unit_cost,
      qty: p.quantity,
      tariff: p.tariff_type,
    })),
    medications: feed.medications.map(m => ({
      id: m.id,
      name: m.drug_name,
      generic: m.generic_name,
      route: m.route,
      dosage: m.dosage,
      frequency: m.frequency,
      days: m.duration_days,
      formulary: m.formulary,
      conformance: m.conformance,
      cost: m.unit_cost,
      qty: m.quantity,
    })),
    inpatient: feed.inpatient,
    outcome: feed.outcome,
    masterDataValidation: feed.masterDataValidation,
  }
  return JSON.stringify(compressed)
}

async function parseBrainOutput(rawText: string, feed: AiSummaryFeed): Promise<AiClinicalPathwayBrainOutput> {
  const cleaned = cleanJsonCandidate(rawText)

  let parsed: AiClinicalPathwayBrainOutput
  try {
    parsed = JSON.parse(cleaned) as AiClinicalPathwayBrainOutput
  } catch (firstError) {
    const repaired = await repairBrainJson(cleaned, firstError)
    parsed = JSON.parse(cleanJsonCandidate(repaired)) as AiClinicalPathwayBrainOutput
  }

  return enforceMasterDataValidation(parsed, feed)
}

/**
 * Server-side guardrail after AI generation.
 * The model may reason clinically, but it must not contradict the deterministic
 * DB cross-check in feed.masterDataValidation. This function:
 * - guarantees every submitted procedure/medication appears in validatedItems,
 * - forces not_found -> perlu_review and not_active -> tidak_sesuai,
 * - applies master tariff/name references when available,
 * - recomputes dashboard counts, score, status, flagged cost, and missing data.
 */
function enforceMasterDataValidation(
  output: AiClinicalPathwayBrainOutput,
  feed: AiSummaryFeed,
): AiClinicalPathwayBrainOutput {
  const aiItems = output.validationDashboard?.validatedItems ?? []
  const byKey = new Map(aiItems.map((item) => [`${item.type}:${item.id}`, item]))

  const procedureItems = feed.procedures.map((procedure) => {
    const validation = feed.masterDataValidation.procedures.find((item) => item.id === procedure.id)
    const aiItem = byKey.get(`procedure:${procedure.id}`)
    return buildEnforcedItem({
      aiItem,
      id: procedure.id,
      type: 'procedure',
      code: procedure.icd9_code,
      inputName: procedure.name,
      inputUnitCost: procedure.unit_cost,
      inputQuantity: procedure.quantity,
      conformance: procedure.conformance,
      validationStatus: validation?.status ?? 'not_found',
      masterName: validation?.masterName ?? null,
      masterTariff: validation?.masterTariff ?? null,
      validationNote: validation?.note ?? 'Tindakan belum memiliki hasil validasi master data.',
      fallbackIssue: 'Tindakan perlu diverifikasi terhadap diagnosis, indikasi klinis, dan katalog master data.',
    })
  })

  const medicationItems = feed.medications.map((medication) => {
    const validation = feed.masterDataValidation.medications.find((item) => item.id === medication.id)
    const aiItem = byKey.get(`medication:${medication.id}`)
    return buildEnforcedItem({
      aiItem,
      id: medication.id,
      type: 'medication',
      code: validation?.status === 'valid' ? (validation.masterName ?? medication.drug_name) : medication.drug_name,
      inputName: medication.drug_name,
      inputUnitCost: medication.unit_cost,
      inputQuantity: medication.quantity,
      conformance: medication.conformance,
      validationStatus: validation?.status ?? 'not_found',
      masterName: validation?.masterName ?? null,
      masterTariff: validation?.masterTariff ?? null,
      validationNote: validation?.note ?? 'Obat belum memiliki hasil validasi master data.',
      fallbackIssue: 'Obat perlu diverifikasi terhadap diagnosis, formularium, dosis, rute, durasi, dan katalog master data.',
    })
  })

  const enforcedItems = [...procedureItems, ...medicationItems]
  const passedCount = enforcedItems.filter((item) => item.status === 'sesuai').length
  const reviewCount = enforcedItems.filter((item) => item.status === 'perlu_review' || item.status === 'data_kurang').length
  const failedCount = enforcedItems.filter((item) => item.status === 'tidak_sesuai').length
  const totalChecked = enforcedItems.length
  const totalFlaggedCost = enforcedItems
    .filter((item) => item.status !== 'sesuai')
    .reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0)
  const score = totalChecked > 0 ? Math.max(0, Math.round((passedCount / totalChecked) * 100)) : 100
  const overallStatus = getOverallStatus({ totalChecked, reviewCount, failedCount })
  const deterministicIssues = buildDeterministicDataQualityIssues(feed, enforcedItems)
  const missingMasterData = buildMissingMasterData(enforcedItems)

  return {
    ...output,
    validationDashboard: {
      ...output.validationDashboard,
      overallStatus,
      score,
      passedCount,
      reviewCount,
      failedCount,
      totalFlaggedCost,
      quickFindings: mergeUnique([
        ...(output.validationDashboard?.quickFindings ?? []),
        `Coverage master data lokal: ${feed.masterDataValidation.summary.coverageRate}% (${feed.masterDataValidation.summary.validCount}/${feed.masterDataValidation.summary.totalChecked} item valid).`,
        ...(missingMasterData.length > 0 ? [`${missingMasterData.length} item belum ditemukan/aktif di master data lokal.`] : []),
      ]),
      validatedItems: enforcedItems,
    },
    masterDataMapping: {
      ...output.masterDataMapping,
      missingMasterData: mergeUnique([...(output.masterDataMapping?.missingMasterData ?? []), ...missingMasterData]),
    },
    dataQualityIssues: mergeUnique([...(output.dataQualityIssues ?? []), ...deterministicIssues]),
  }
}

interface EnforcedItemInput {
  aiItem?: AiValidatedClinicalItem
  id: string
  type: 'procedure' | 'medication'
  code: string
  inputName: string
  inputUnitCost: string
  inputQuantity: string
  conformance: string
  validationStatus: string
  masterName: string | null
  masterTariff: number | null
  validationNote: string
  fallbackIssue: string
}

function buildEnforcedItem(input: EnforcedItemInput): AiValidatedClinicalItem {
  const actualUnitCost = parseCurrency(input.inputUnitCost)
  const quantity = parseQuantity(input.inputQuantity)
  const submittedTotalCost = actualUnitCost * quantity
  const masterTariff = input.masterTariff
  const enforcedStatus = getEnforcedStatus(input.validationStatus, input.conformance, input.aiItem?.status)
  const name = input.masterName ?? input.aiItem?.name ?? input.inputName
  const masterPriceText = masterTariff != null ? formatRupiah(masterTariff) : 'tidak tersedia'
  const priceAssessment = buildPriceAssessment({
    actualUnitCost,
    masterTariff,
    aiPriceAssessment: input.aiItem?.priceAssessment,
  })

  return {
    id: input.id,
    type: input.type,
    code: input.aiItem?.code || input.code,
    name,
    status: enforcedStatus,
    diagnosisRelation: input.aiItem?.diagnosisRelation ?? 'Relasi klinis dinilai berdasarkan diagnosis utama, conformance input, dan validasi master data lokal.',
    masterDataValidation: input.validationNote,
    unitCost: masterTariff ?? actualUnitCost,
    quantity,
    totalCost: submittedTotalCost,
    priceAssessment: `${priceAssessment} Referensi master: ${masterPriceText}. Biaya input: ${formatRupiah(actualUnitCost)} x ${quantity}.`,
    issue: buildIssue(input, enforcedStatus),
    recommendedAction: buildRecommendedAction(input.validationStatus, enforcedStatus, input.aiItem?.recommendedAction),
  }
}

function getEnforcedStatus(
  validationStatus: string,
  conformance: string,
  aiStatus: AiValidationStatus = 'sesuai',
): AiValidationStatus {
  if (validationStatus === 'not_active') return 'tidak_sesuai'
  if (validationStatus === 'not_found') return 'perlu_review'
  if (conformance.toLowerCase() === 'tidak') return 'tidak_sesuai'
  if (aiStatus === 'tidak_sesuai' || aiStatus === 'perlu_review' || aiStatus === 'data_kurang') return aiStatus
  return 'sesuai'
}

function buildIssue(input: EnforcedItemInput, status: AiValidationStatus): string {
  if (input.validationStatus === 'not_found') return `${input.inputName} tidak ditemukan di master data lokal. ${input.fallbackIssue}`
  if (input.validationStatus === 'not_active') return `${input.masterName ?? input.inputName} terdaftar tetapi tidak aktif di master data lokal.`
  if (input.conformance.toLowerCase() === 'tidak') return input.aiItem?.issue || `${input.inputName} ditandai tidak sesuai pada input, sehingga perlu justifikasi klinis/administratif.`
  if (status !== 'sesuai') return input.aiItem?.issue || input.fallbackIssue
  return input.aiItem?.issue || 'Tidak ada isu mayor berdasarkan master data lokal dan conformance input.'
}

function buildRecommendedAction(
  validationStatus: string,
  status: AiValidationStatus,
  aiRecommendedAction?: string,
): string {
  if (validationStatus === 'not_found') return 'Verifikasi manual, lengkapi master data bila item memang digunakan rutin, dan pastikan indikasi klinis terdokumentasi.'
  if (validationStatus === 'not_active') return 'Gunakan alternatif aktif di master data atau aktifkan kembali item melalui proses tata kelola master data.'
  if (status === 'tidak_sesuai') return aiRecommendedAction || 'Minta justifikasi DPJP/case manager atau koreksi item agar sesuai pathway.'
  if (status === 'perlu_review' || status === 'data_kurang') return aiRecommendedAction || 'Lengkapi data klinis, dosis/frekuensi, indikasi, dan bukti penunjang sebelum finalisasi klaim/pathway.'
  return aiRecommendedAction || 'Pertahankan rencana dan monitoring sesuai clinical pathway.'
}

function buildPriceAssessment(input: {
  actualUnitCost: number
  masterTariff: number | null
  aiPriceAssessment?: string
}): string {
  if (input.masterTariff == null || input.masterTariff <= 0) {
    return input.aiPriceAssessment || 'Tarif master belum tersedia sehingga kewajaran harga perlu review manual.'
  }

  const diff = input.actualUnitCost - input.masterTariff
  if (diff > 0) return `Harga input lebih tinggi ${formatRupiah(diff)} dari tarif master.`
  if (diff < 0) return `Harga input lebih rendah ${formatRupiah(Math.abs(diff))} dari tarif master.`
  return 'Harga input sesuai tarif master.'
}

function buildDeterministicDataQualityIssues(
  feed: AiSummaryFeed,
  enforcedItems: AiValidatedClinicalItem[],
): string[] {
  const issues: string[] = []

  if (feed.masterDataValidation.primaryDiagnosis.status !== 'valid') {
    issues.push(`Diagnosis utama: ${feed.masterDataValidation.primaryDiagnosis.note}`)
  }

  for (const diagnosis of feed.masterDataValidation.secondaryDiagnoses) {
    if (diagnosis.status !== 'valid') issues.push(`Diagnosis sekunder ${diagnosis.code}: ${diagnosis.note}`)
  }

  if (feed.masterDataValidation.practitioner.status !== 'valid') {
    issues.push(`DPJP: ${feed.masterDataValidation.practitioner.note}`)
  }

  for (const item of enforcedItems) {
    if (item.status !== 'sesuai') issues.push(`${item.type === 'procedure' ? 'Tindakan' : 'Obat'} ${item.name}: ${item.masterDataValidation}`)
  }

  return mergeUnique(issues)
}

function buildMissingMasterData(items: AiValidatedClinicalItem[]): string[] {
  return items
    .filter((item) => item.masterDataValidation.toLowerCase().includes('tidak ditemukan') || item.masterDataValidation.toLowerCase().includes('tidak aktif'))
    .map((item) => `${item.type === 'procedure' ? 'Tindakan' : 'Obat'} ${item.code} - ${item.name}: ${item.masterDataValidation}`)
}

function getOverallStatus(input: { totalChecked: number; reviewCount: number; failedCount: number }): AiValidationStatus {
  if (input.totalChecked === 0) return 'data_kurang'
  if (input.failedCount > 0) return 'tidak_sesuai'
  if (input.reviewCount > 0) return 'perlu_review'
  return 'sesuai'
}

function parseCurrency(value: string): number {
  const numeric = Number(value.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function parseQuantity(value: string): number {
  const numeric = Number(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1
}

function formatRupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`
}

function mergeUnique(items: string[]): string[] {
  return [...new Set(items.filter((item) => item.trim().length > 0))]
}

function cleanJsonCandidate(rawText: string): string {
  const withoutFence = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  const firstBrace = withoutFence.indexOf('{')
  const lastBrace = withoutFence.lastIndexOf('}')

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return withoutFence.slice(firstBrace, lastBrace + 1)
  }

  return withoutFence
}

async function repairBrainJson(rawJson: string, parseError: unknown): Promise<string> {
  return await createSumoPodChatCompletion({
    temperature: 0,
    // Must match or exceed the original output token size so repair doesn't truncate.
    maxTokens: 8000,
    // CRITICAL: always cap budgetTokens for reasoning models (kimi-k2.6).
    // Without this cap, the model enters an unbounded thinking loop on repair calls
    // which causes Step 3 to hang indefinitely. 2000 is enough for JSON repair reasoning.
    budgetTokens: 2000,
    messages: [
      {
        role: 'system',
        content: 'You are a JSON repair engine. Return only valid JSON, no markdown, no comments. Do not alter clinical meaning. Fix unclosed strings, escape newlines/quotes, commas, and brackets so JSON.parse succeeds.',
      },
      {
        role: 'user',
        content: `The following JSON failed to parse with error: ${parseError instanceof Error ? parseError.message : 'unknown error'}\n\nRepair into valid complete JSON:\n${rawJson}`,
      },
    ],
  })
}

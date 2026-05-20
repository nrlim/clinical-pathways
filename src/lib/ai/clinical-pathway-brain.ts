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
    temperature: 0.1,   // Lower temp → more deterministic JSON, less retries
    maxTokens: 6000,    // Reduced from 10000; clinical JSON is well-structured, 6k is enough
    budgetTokens: 3000, // Cap Kimi reasoning chain → significantly faster (40-60s vs 90-120s)
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
  return `Anda adalah Brain AI Clinical Pathway untuk rumah sakit Indonesia.
Berpikir sebagai tim multidisiplin: DPJP, perawat, farmasi, case manager, coder INA-CBGs.

Aturan wajib:
- Feed yang dikirim SUDAH mengandung field "masterDataValidation" — hasil cross-check otomatis terhadap katalog Master Data lokal (ICD-10, FORNAS, INA-CBG).
- Gunakan status dari "masterDataValidation" sebagai DASAR utama validasi item. Jangan menebak atau mengabaikan informasi ini.
  · status "valid" → item terdaftar dan aktif di faskes, gunakan masterName/masterTariff sebagai referensi harga resmi.
  · status "not_found" → item tidak ada di katalog lokal; wajib tandai "perlu_review" dan catat di dataQualityIssues.
  · status "not_active" → item terdaftar tapi tidak aktif di faskes; wajib tandai "tidak_sesuai".
- Jangan mengarang data yang tidak ada di feed. Tulis kekurangan data di dataQualityIssues.
- Jangan buat diagnosis baru; differential boleh sebagai risiko.
- Validasi item terhadap diagnosis klinis; tandai tidak_sesuai/perlu_review jika perlu.
- Jika masterTariff tersedia dari masterDataValidation, gunakan sebagai referensi harga dasar di priceAssessment.
- Output adalah decision support, bukan pengganti instruksi dokter.
- Gunakan Bahasa Indonesia klinis.
- Kembalikan HANYA JSON valid tanpa markdown, tanpa penjelasan tambahan.`
}

function buildUserPrompt(feed: AiSummaryFeed): string {
  const schema = `{"executiveSummary":"str","clinicalSynopsis":"str","workingAssessment":"str","pathwayName":"str","careGoals":["str"],"validationDashboard":{"overallStatus":"sesuai|tidak_sesuai|perlu_review|data_kurang","score":0,"passedCount":0,"reviewCount":0,"failedCount":0,"totalFlaggedCost":0,"quickFindings":["str"],"validatedItems":[{"id":"str","type":"procedure|medication","code":"str","name":"str","status":"sesuai|tidak_sesuai|perlu_review|data_kurang","diagnosisRelation":"str","masterDataValidation":"str","unitCost":0,"quantity":0,"totalCost":0,"priceAssessment":"str","issue":"str","recommendedAction":"str"}]},"dayByDayPlan":[{"day":"str","focus":"str","assessments":["str"],"interventions":["str"],"medicationConsiderations":["str"],"monitoring":["str"],"dischargeCriteria":["str"]}],"conformanceAnalysis":{"diagnosisProcedureFit":"str","diagnosisMedicationFit":"str","inpatientJustification":"str","losAssessment":"str","costSignal":"str"},"riskStratification":[{"level":"rendah|sedang|tinggi|kritis","issue":"str","rationale":"str","recommendedAction":"str"}],"pathwayVariances":[{"area":"str","observedVariance":"str","potentialImpact":"str","recommendedFollowUp":"str"}],"dischargeReadiness":{"status":"belum_siap|perlu_review|siap|tidak_dinilai","criteriaMet":["str"],"blockers":["str"],"followUpPlan":"str","patientEducation":"str"},"masterDataMapping":{"patientReference":"str","suggestedResources":["str"],"missingMasterData":["str"]},"aiSummaryForClinician":"str","aiSummaryForCoder":"str","aiSummaryForPatient":"str","safetyNotes":["str"],"dataQualityIssues":["str"]}`

  return `Buat clinical pathway detail dari feed berikut. Kembalikan JSON valid dengan struktur ini persis:
${schema}

Instruksi analisis (wajib lengkap):
1. executiveSummary: ringkasan eksekutif klinis padat tapi menyeluruh mencakup kondisi, rencana, dan outlook pasien.
2. clinicalSynopsis: narasi klinis lengkap tentang perjalanan penyakit, status saat ini, dan faktor relevan.
3. dayByDayPlan: buat rencana per hari sesuai LOS dari feed — setiap hari WAJIB memiliki assessments, interventions, medicationConsiderations, monitoring, dan dischargeCriteria yang spesifik dan operasional (bukan generik).
4. validatedItems: validasi SETIAP item tindakan dan obat berdasarkan field "masterDataValidation" di feed.
   - Gunakan "id" dari item di feed (sama dengan id di masterDataValidation).
   - Jika status masterDataValidation = "valid": gunakan masterName sebagai name, masterTariff sebagai unitCost referensi.
   - Jika status = "not_found": set status validatedItem = "perlu_review", catat di issue dan dataQualityIssues.
   - Jika status = "not_active": set status validatedItem = "tidak_sesuai", catat di issue.
   - Sertakan diagnosisRelation, masterDataValidation (dari field note di masterDataValidation), priceAssessment, issue, dan recommendedAction.
5. Tandai "tidak_sesuai" jika item tidak berhubungan dengan diagnosis atau conformance=tidak di feed.
6. Hitung validationDashboard: score 0-100, passedCount/reviewCount/failedCount yang akurat, totalFlaggedCost dari semua item berstatus tidak_sesuai atau perlu_review.
7. riskStratification: identifikasi semua risiko klinis yang relevan dengan level dan rekomendasi spesifik. pathwayVariances: varians dari standar pathway. dischargeReadiness: status, kriteria terpenuhi, blocker, follow-up, dan edukasi pasien.
8. masterDataMapping: ringkasan item mana yang ditemukan/tidak ditemukan di master data lokal, dan apa yang perlu dilengkapi.
9. Buat 3 summary BERBEDA dengan gaya dan fokus yang tepat: untuk klinisi (klinis mendalam), coder/klaim (kode dan biaya), dan pasien (bahasa awam mudah dipahami).

Feed:
${JSON.stringify(feed)}`
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
    maxTokens: 5000,
    messages: [
      {
        role: 'system',
        content: 'Anda adalah JSON repair engine. Kembalikan hanya JSON valid, tanpa markdown, tanpa komentar. Jangan mengubah makna klinis. Perbaiki string yang tidak tertutup, escape newline/quote, koma, dan bracket agar JSON.parse berhasil.',
      },
      {
        role: 'user',
        content: `JSON berikut gagal diparse dengan error: ${parseError instanceof Error ? parseError.message : 'unknown error'}\n\nPerbaiki menjadi JSON valid lengkap:\n${rawJson}`,
      },
    ],
  })
}

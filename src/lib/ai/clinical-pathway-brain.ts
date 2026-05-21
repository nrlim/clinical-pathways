import type { AiSummaryFeed, SupportingDocument } from '@/types/clinical-pathway'
import type {
  AiClinicalPathwayBrainOutput,
  AiClinicalPathwayResponse,
  AiValidatedClinicalItem,
  AiValidationStatus,
} from '@/types/ai-clinical-pathway'
import { callAi } from './ai-router'

export async function generateClinicalPathwayBrain(feed: AiSummaryFeed): Promise<AiClinicalPathwayResponse> {
  const startedAt = Date.now()
  const aiResult = await callAi({
    temperature: 0.1,
    maxTokens: 8000,
    budgetTokens: 2500,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(feed) },
    ],
  })
  const latencyMs = Date.now() - startedAt

  const modelLabel = aiResult.usedFallback
    ? `${aiResult.model} (fallback via Vercel AI Gateway)`
    : aiResult.model

  return {
    result: await parseBrainOutput(aiResult.content, feed),
    rawText: aiResult.content,
    model: modelLabel,
    generatedAt: new Date().toISOString(),
    latencyMs,
  }
}

function buildSystemPrompt(): string {
  return `You are a SnapPath Brain AI for Indonesian hospitals.
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
  const schema = `{"executiveSummary":"str","clinicalSynopsis":"str","workingAssessment":"str","pathwayName":"str","careGoals":["str"],"validationDashboard":{"overallStatus":"sesuai|tidak_sesuai|perlu_review|data_kurang","score":0,"passedCount":0,"reviewCount":0,"failedCount":0,"totalFlaggedCost":0,"quickFindings":["str"],"validatedItems":[{"id":"str","type":"procedure|medication","code":"str","name":"str","status":"sesuai|tidak_sesuai|perlu_review|data_kurang","diagnosisRelation":"str","masterDataValidation":"str","unitCost":0,"quantity":0,"totalCost":0,"priceAssessment":"str","issue":"str","recommendedAction":"str"}],"documentVerification":[{"id":"str","name":"str","description":"str","required":true,"file_name":"str|null","file_size":"str|null","uploaded_at":"str|null","status":"available|missing","verification_status":"valid|invalid|unchecked","verification_note":"str"}]},"dayByDayPlan":[{"day":"str","focus":"str","assessments":["str"],"interventions":["str"],"medicationConsiderations":["str"],"monitoring":["str"],"dischargeCriteria":["str"]}],"conformanceAnalysis":{"diagnosisProcedureFit":"str","diagnosisMedicationFit":"str","inpatientJustification":"str","losAssessment":"str","costSignal":"str"},"riskStratification":[{"level":"rendah|sedang|tinggi|kritis","issue":"str","rationale":"str","recommendedAction":"str"}],"pathwayVariances":[{"area":"str","observedVariance":"str","potentialImpact":"str","recommendedFollowUp":"str"}],"dischargeReadiness":{"status":"belum_siap|perlu_review|siap|tidak_dinilai","criteriaMet":["str"],"blockers":["str"],"followUpPlan":"str","patientEducation":"str"},"masterDataMapping":{"patientReference":"str","suggestedResources":["str"],"missingMasterData":["str"]},"aiSummaryForClinician":"str","aiSummaryForCoder":"str","aiSummaryForPatient":"str","safetyNotes":["str"],"dataQualityIssues":["str"]}`

  const actualLos = calculateActualLos(feed.encounter.admission_date, feed.encounter.discharge_date)
  const expectedLos = feed.masterDataValidation.primaryDiagnosis.expectedLos
  const targetLos = Math.min(Math.max(Number(feed.encounter.expected_los) || expectedLos || actualLos || 3, 1), 7)

  const compressedFeed = buildCompressedFeed(feed)

  return `Generate a clinical pathway from the feed below. Return valid JSON matching this exact schema:
${schema}

Instructions:
1. executiveSummary: concise but complete clinical executive summary (condition, plan, outlook).
2. clinicalSynopsis: full clinical narrative (disease course, current status, relevant factors).
3. dayByDayPlan: Generate EXACTLY ${targetLos} entries — one per hospitalization day, labeled "Hari 1" through "Hari ${targetLos}". Days 1 through ${targetLos - 1} must contain active clinical content (assessments, interventions, medications, monitoring). "Hari ${targetLos}" is ALWAYS the discharge day (focus: "Discharge") with final assessment, discharge planning, take-home medications, and discharge criteria. Do NOT place discharge content on any day earlier than "Hari ${targetLos}". Every entry must have at least one non-empty array.
4. validatedItems: validate EVERY procedure/medication using "masterDataValidation" in feed. Use same "id" from feed. If status=valid: use masterName as name, masterTariff as unitCost reference. If status=not_found: mark perlu_review, log in issue+dataQualityIssues. If status=not_active: mark tidak_sesuai.
5. Mark "tidak_sesuai" if item is clinically unrelated to diagnosis or conformance=tidak.
6. Compute validationDashboard: accurate score 0-100, counts, totalFlaggedCost from all non-sesuai items.
7. riskStratification, pathwayVariances, dischargeReadiness: specific and actionable, not generic.
8. masterDataMapping: summarize found/missing items and what needs to be added.
9. Three distinct summaries: clinician (clinical depth), coder (codes & billing), patient (plain language).
10. documentVerification: Evaluate the supporting documents in feed against clinical context. For each document, if the file is uploaded (status = available), perform a semantic check: verify if the document's uploaded filename or contents match the patient name, NIK, guarantor, or diagnosis where applicable (e.g. check KTP against patient NIK/name, check SPRI against primary diagnosis/practitioner, check BPJS against guarantor/bpjs_number). Set verification_status to 'valid' or 'invalid' based on this check, and document the reason in verification_note. If the document is missing (status = missing), set verification_status to 'unchecked' and state in verification_note that the document is missing.

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
    documents: (feed.documents ?? []).map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      required: d.required,
      file_name: d.file_name,
      file_size: d.file_size,
      uploaded_at: d.uploaded_at,
      status: d.status,
    })),
    masterDataValidation: feed.masterDataValidation,
    thresholds: feed.thresholds,
  }
  return JSON.stringify(compressed)
}

function calculateActualLos(admissionDate: string, dischargeDate: string): number {
  if (!admissionDate || !dischargeDate) return 0
  const start = new Date(admissionDate)
  const end = new Date(dischargeDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays || 1
}

async function parseBrainOutput(rawText: string, feed: AiSummaryFeed): Promise<AiClinicalPathwayBrainOutput> {
  let parsed: AiClinicalPathwayBrainOutput | any

  try {
    parsed = tryParseJson(rawText)
  } catch (firstError) {
    try {
      const repaired = await repairBrainJson(rawText, firstError)
      parsed = tryParseJson(repaired)
    } catch (secondError) {
      console.error('[AI Router] Fatal JSON parse error even after repair:', secondError)
      // Ultimate fallback to prevent workflow crash
      parsed = {
        executiveSummary: "Gagal memproses respons AI karena keterbatasan token atau error format.",
        clinicalSynopsis: "",
        workingAssessment: "",
        pathwayName: "Error Processing Pathway",
        careGoals: [],
        validationDashboard: {
          overallStatus: 'data_kurang',
          score: 0,
          passedCount: 0,
          reviewCount: 0,
          failedCount: 0,
          totalFlaggedCost: 0,
          quickFindings: ["Respons AI terpotong dan tidak dapat diperbaiki secara otomatis."],
          validatedItems: [],
          documentVerification: []
        }
      }
    }
  }

  // --- WORKAROUND FOR AI NESTING HALLUCINATION ---
  // Kadang AI lupa menutup bracket validationDashboard sehingga field-field
  // yang seharusnya di root malah masuk ke dalam validationDashboard.
  const rootFields = [
    'dayByDayPlan', 'conformanceAnalysis', 'riskStratification', 'pathwayVariances',
    'dischargeReadiness', 'masterDataMapping', 'aiSummaryForClinician', 'aiSummaryForCoder',
    'aiSummaryForPatient', 'safetyNotes', 'dataQualityIssues'
  ];

  if (parsed.validationDashboard) {
    for (const field of rootFields) {
      if (parsed[field] === undefined && parsed.validationDashboard[field] !== undefined) {
        parsed[field] = parsed.validationDashboard[field]
        delete parsed.validationDashboard[field]
      }
    }
  }

  return enforceMasterDataValidation(parsed as AiClinicalPathwayBrainOutput, feed)
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
      validationNote: validation?.note ?? 'Tindakan belum memiliki hasil validasi katalog standar.',
      fallbackIssue: 'Tindakan perlu diverifikasi terhadap diagnosis, indikasi klinis, dan katalog standar RS.',
      thresholds: feed.thresholds,
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
      validationNote: validation?.note ?? 'Obat belum memiliki hasil validasi katalog standar.',
      fallbackIssue: 'Obat perlu diverifikasi terhadap diagnosis, formularium, dosis, rute, durasi, dan katalog standar RS.',
      thresholds: feed.thresholds,
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

  // --- Supporting Document Verification & Penalty Logic ---
  const aiDocs = output.validationDashboard?.documentVerification ?? []
  const aiDocsMap = new Map(aiDocs.map((d) => [d.id, d]))

  let missingRequiredCount = 0
  let invalidCount = 0
  const docDeterministicIssues: string[] = []
  const docQuickFindings: string[] = []

  const defaultDocs: SupportingDocument[] = [
    { id: 'ktp', name: 'KTP / NIK', description: 'Kartu Tanda Penduduk pasien untuk verifikasi identitas resmi', required: true, file_name: null, file_size: null, uploaded_at: null, status: 'missing' },
    { id: 'bpjs', name: 'Kartu BPJS / Asuransi', description: 'Kartu kepesertaan jaminan kesehatan aktif', required: true, file_name: null, file_size: null, uploaded_at: null, status: 'missing' },
    { id: 'rujukan', name: 'Surat Rujukan', description: 'Surat rujukan dari Faskes 1 (Puskesmas/Klinik) ke Rumah Sakit', required: false, file_name: null, file_size: null, uploaded_at: null, status: 'missing' },
    { id: 'spri', name: 'Surat Perintah Rawat Inap (SPRI)', description: 'Surat perintah rawat inap dari poliklinik spesialis', required: true, file_name: null, file_size: null, uploaded_at: null, status: 'missing' },
    { id: 'resume_medis', name: 'Resume Medis Terdahulu', description: 'Ringkasan riwayat medis pasien sebelumnya yang relevan', required: false, file_name: null, file_size: null, uploaded_at: null, status: 'missing' }
  ]

  const feedDocs = feed.documents ?? []
  const sourceDocs = defaultDocs.map(defaultDoc => {
    const found = feedDocs.find(d => d.id === defaultDoc.id)
    return found ? found : defaultDoc
  })
  const extraDocs = feedDocs.filter(d => !defaultDocs.some(def => def.id === d.id))
  const mergedDocs = [...sourceDocs, ...extraDocs]

  const enforcedDocuments = mergedDocs.map((doc) => {
    const aiDoc = aiDocsMap.get(doc.id)
    const hasFile = doc.file_name && doc.file_name.trim().length > 0

    let verification_status: 'valid' | 'invalid' | 'unchecked' = 'unchecked'
    let verification_note = doc.verification_note || ''

    if (!hasFile) {
      if (doc.required) {
        missingRequiredCount++
        verification_status = 'unchecked'
        verification_note = 'Dokumen wajib ini belum diunggah.'
        docDeterministicIssues.push(`DOKUMEN PENDUKUNG HILANG: Dokumen wajib ${doc.name} tidak diunggah.`)
        docQuickFindings.push(`Dokumen wajib ${doc.name} tidak diunggah (Status: Perlu Review).`)
      } else {
        verification_status = 'unchecked'
        verification_note = 'Dokumen opsional belum diunggah.'
      }
    } else {
      // Document is uploaded. Look at AI's verification status
      const aiStatus = aiDoc?.verification_status || 'valid'
      verification_status = aiStatus
      verification_note = aiDoc?.verification_note || 'Dokumen terunggah.'

      if (verification_status === 'invalid') {
        invalidCount++
        docDeterministicIssues.push(`DOKUMEN TIDAK VALID: Dokumen ${doc.name} dinyatakan tidak valid oleh AI: ${verification_note}`)
        docQuickFindings.push(`Dokumen ${doc.name} dinyatakan TIDAK VALID oleh AI (Status: Tidak Sesuai).`)
      }
    }

    return {
      ...doc,
      status: hasFile ? 'available' as const : 'missing' as const,
      verification_status,
      verification_note,
    }
  })

  const baseScore = totalChecked > 0 ? Math.max(0, Math.round((passedCount / totalChecked) * 100)) : 100
  // Opsi B: Skor murni klinis, tidak ada pemotongan penalti poin dari dokumen
  const score = baseScore

  let overallStatus = getOverallStatus({ totalChecked, reviewCount, failedCount })
  if (invalidCount > 0) {
    overallStatus = 'tidak_sesuai'
  } else if (missingRequiredCount > 0 && overallStatus !== 'tidak_sesuai') {
    overallStatus = 'perlu_review'
  }

  const deterministicIssues = [
    ...buildDeterministicDataQualityIssues(feed, enforcedItems),
    ...docDeterministicIssues,
  ]
  const missingMasterData = buildMissingMasterData(enforcedItems)

  // Determine actual vs standard expected LOS based on primary diagnosis expectedLos
  const actualLosVal = calculateActualLos(feed.encounter.admission_date, feed.encounter.discharge_date)
  const standardLos = feed.masterDataValidation.primaryDiagnosis.expectedLos

  let losAssessmentText = output.conformanceAnalysis?.losAssessment || ''

  if (standardLos != null && standardLos > 0) {
    const diff = actualLosVal - standardLos
    const overchargeThreshold = feed.thresholds?.losOverchargePct ?? 20
    const underchargeThreshold = feed.thresholds?.losUnderchargePct ?? 30
    if (diff > 0) {
      const pct = (diff / standardLos) * 100
      if (pct > overchargeThreshold) {
        const msg = `OVERSTAY: Durasi rawat inap (${actualLosVal} hari) melebihi standar klinis yang ditetapkan (${standardLos} hari). Terdapat deviasi sebesar ${pct.toFixed(0)}%, melewati ambang batas toleransi (${overchargeThreshold}%).`
        losAssessmentText = `${msg} ${losAssessmentText}`.trim()
        deterministicIssues.push(msg)
      } else {
        losAssessmentText = `Durasi rawat inap (${actualLosVal} hari) melebihi standar klinis (${standardLos} hari). Deviasi sebesar ${pct.toFixed(0)}% masih berada dalam ambang batas toleransi (${overchargeThreshold}%). ${losAssessmentText}`.trim()
      }
    } else if (diff < 0) {
      const pct = (Math.abs(diff) / standardLos) * 100
      if (pct > underchargeThreshold) {
        const msg = `UNDERSTAY: Durasi rawat inap (${actualLosVal} hari) lebih singkat dari standar klinis yang ditetapkan (${standardLos} hari). Terdapat deviasi sebesar ${pct.toFixed(0)}%, melewati ambang batas toleransi (${underchargeThreshold}%).`
        losAssessmentText = `${msg} ${losAssessmentText}`.trim()
        deterministicIssues.push(msg)
      } else {
        losAssessmentText = `Durasi rawat inap (${actualLosVal} hari) lebih singkat dari standar klinis (${standardLos} hari). Deviasi sebesar ${pct.toFixed(0)}% masih berada dalam ambang batas toleransi (${underchargeThreshold}%). ${losAssessmentText}`.trim()
      }
    } else {
      losAssessmentText = `Durasi rawat inap (${actualLosVal} hari) telah sesuai dengan standar klinis yang ditetapkan (${standardLos} hari). ${losAssessmentText}`.trim()
    }
  } else {
    losAssessmentText = `Referensi standar LOS tidak tersedia di katalog untuk diagnosa ${feed.diagnosis.primary_diagnosis_code}. LOS aktual: ${actualLosVal} hari. ${losAssessmentText}`.trim()
  }

  const conformanceAnalysis = output.conformanceAnalysis ? {
    ...output.conformanceAnalysis,
    losAssessment: losAssessmentText,
  } : {
    diagnosisProcedureFit: '',
    diagnosisMedicationFit: '',
    inpatientJustification: '',
    losAssessment: losAssessmentText,
    costSignal: '',
  }

  // Strip days where every clinical array is empty (AI sometimes pads to 7 regardless of actual LOS)
  const filteredDayByDayPlan = (output.dayByDayPlan ?? []).filter((day) => {
    const hasContent =
      (day.assessments?.length ?? 0) > 0 ||
      (day.interventions?.length ?? 0) > 0 ||
      (day.medicationConsiderations?.length ?? 0) > 0 ||
      (day.monitoring?.length ?? 0) > 0 ||
      (day.dischargeCriteria?.length ?? 0) > 0
    return hasContent
  })

  return {
    ...output,
    dayByDayPlan: filteredDayByDayPlan,
    conformanceAnalysis,
    validationDashboard: {
      ...output.validationDashboard,
      overallStatus,
      score,
      passedCount,
      reviewCount,
      failedCount,
      totalFlaggedCost,
      actualLos: actualLosVal,
      expectedLos: standardLos ?? undefined,
      quickFindings: mergeUnique([
        ...(output.validationDashboard?.quickFindings ?? []),
        `Coverage katalog standar lokal: ${feed.masterDataValidation.summary.coverageRate}% (${feed.masterDataValidation.summary.validCount}/${feed.masterDataValidation.summary.totalChecked} item valid).`,
        ...(missingMasterData.length > 0 ? [`${missingMasterData.length} item belum ditemukan/aktif di katalog standar lokal.`] : []),
        ...docQuickFindings,
      ]),
      validatedItems: enforcedItems,
      documentVerification: enforcedDocuments,
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
  thresholds?: {
    procedureOverchargePct: number
    procedureUnderchargePct: number
    medicationOverchargePct: number
    medicationUnderchargePct: number
  }
}

function buildEnforcedItem(input: EnforcedItemInput): AiValidatedClinicalItem {
  const actualUnitCost = parseCurrency(input.inputUnitCost)
  const quantity = parseQuantity(input.inputQuantity)
  const submittedTotalCost = actualUnitCost * quantity
  const masterTariff = input.masterTariff
  let enforcedStatus = getEnforcedStatus(input.validationStatus, input.conformance)
  const name = input.masterName ?? input.aiItem?.name ?? input.inputName
  const masterPriceText = masterTariff != null ? formatRupiah(masterTariff) : 'tidak tersedia'

  // Determine if price deviation exceeds configured thresholds
  let isPriceOut = false
  if (masterTariff != null && masterTariff > 0) {
    const diff = actualUnitCost - masterTariff
    const overchargePct = input.type === 'procedure'
      ? (input.thresholds?.procedureOverchargePct ?? 20)
      : (input.thresholds?.medicationOverchargePct ?? 25)
    const underchargePct = input.type === 'procedure'
      ? (input.thresholds?.procedureUnderchargePct ?? 20)
      : (input.thresholds?.medicationUnderchargePct ?? 25)

    if (diff > 0) {
      const pct = (diff / masterTariff) * 100
      if (pct > overchargePct) isPriceOut = true
    } else if (diff < 0) {
      const pct = (Math.abs(diff) / masterTariff) * 100
      if (pct > underchargePct) isPriceOut = true
    }
  }

  // Elevate status if threshold is exceeded
  if (enforcedStatus === 'sesuai' && isPriceOut) {
    enforcedStatus = 'perlu_review'
  }

  const priceAssessment = buildPriceAssessment({
    actualUnitCost,
    masterTariff,
    type: input.type,
    aiPriceAssessment: input.aiItem?.priceAssessment,
    thresholds: input.thresholds,
  })

  return {
    id: input.id,
    type: input.type,
    code: input.aiItem?.code || input.code,
    name,
    status: enforcedStatus,
    diagnosisRelation: input.aiItem?.diagnosisRelation ?? 'Relasi klinis dinilai berdasarkan diagnosis utama, conformance input, dan validasi katalog standar.',
    masterDataValidation: input.validationNote,
    unitCost: masterTariff ?? actualUnitCost,
    quantity,
    totalCost: submittedTotalCost,
    priceAssessment: `${priceAssessment} Referensi master: ${masterPriceText}. Biaya input: ${formatRupiah(actualUnitCost)} x ${quantity}.`,
    issue: buildIssue(input, enforcedStatus, isPriceOut),
    recommendedAction: buildRecommendedAction(input.validationStatus, enforcedStatus, input.aiItem?.recommendedAction),
  }
}

function getEnforcedStatus(
  validationStatus: string,
  conformance: string,
): AiValidationStatus {
  if (validationStatus === 'not_active') return 'tidak_sesuai'
  if (validationStatus === 'not_found') return 'perlu_review'
  if (conformance.toLowerCase() === 'tidak') return 'tidak_sesuai'
  return 'sesuai'
}

function buildIssue(input: EnforcedItemInput, status: AiValidationStatus, isPriceOut?: boolean): string {
  if (input.validationStatus === 'not_found') return `${input.inputName} tidak ditemukan di katalog standar lokal. ${input.fallbackIssue}`
  if (input.validationStatus === 'not_active') return `${input.masterName ?? input.inputName} terdaftar tetapi tidak aktif di katalog standar lokal.`
  if (input.conformance.toLowerCase() === 'tidak') return input.aiItem?.issue || `${input.inputName} ditandai tidak sesuai pada input, sehingga perlu justifikasi klinis/administratif.`
  if (isPriceOut) return `Harga menyimpang di luar batas threshold toleransi. ${input.fallbackIssue}`
  if (status !== 'sesuai') return input.aiItem?.issue || input.fallbackIssue
  return input.aiItem?.issue || 'Tidak ada isu mayor berdasarkan katalog standar dan conformance input.'
}

function buildRecommendedAction(
  validationStatus: string,
  status: AiValidationStatus,
  aiRecommendedAction?: string,
): string {
  if (validationStatus === 'not_found') return 'Verifikasi manual, lengkapi katalog bila item memang digunakan rutin, dan pastikan indikasi klinis terdokumentasi.'
  if (validationStatus === 'not_active') return 'Gunakan alternatif aktif di katalog standar atau aktifkan kembali item melalui proses tata kelola layanan.'
  if (status === 'tidak_sesuai') return aiRecommendedAction || 'Minta justifikasi DPJP/case manager atau koreksi item agar sesuai pathway.'
  if (status === 'perlu_review' || status === 'data_kurang') return aiRecommendedAction || 'Lengkapi data klinis, dosis/frekuensi, indikasi, dan bukti penunjang sebelum finalisasi klaim/pathway.'
  return aiRecommendedAction || 'Pertahankan rencana dan monitoring sesuai clinical pathway.'
}

function buildPriceAssessment(input: {
  actualUnitCost: number
  masterTariff: number | null
  type: 'procedure' | 'medication'
  aiPriceAssessment?: string
  thresholds?: {
    procedureOverchargePct: number
    procedureUnderchargePct: number
    medicationOverchargePct: number
    medicationUnderchargePct: number
  }
}): string {
  if (input.masterTariff == null || input.masterTariff <= 0) {
    return input.aiPriceAssessment || 'Tarif master belum tersedia sehingga kewajaran harga perlu review manual.'
  }

  const diff = input.actualUnitCost - input.masterTariff
  const overchargePct = input.type === 'procedure'
    ? (input.thresholds?.procedureOverchargePct ?? 20)
    : (input.thresholds?.medicationOverchargePct ?? 25)
  const underchargePct = input.type === 'procedure'
    ? (input.thresholds?.procedureUnderchargePct ?? 20)
    : (input.thresholds?.medicationUnderchargePct ?? 25)

  if (diff > 0) {
    const pct = (diff / input.masterTariff) * 100
    if (pct > overchargePct) {
      return `OVERCHARGE: Tarif yang diinputkan melebihi batas standar wajar. Terdapat kelebihan biaya sebesar ${formatRupiah(diff)} (${pct.toFixed(0)}%), yang melewati ambang toleransi maksimal (${overchargePct}%).`
    }
    return `Tarif yang diinputkan lebih tinggi ${formatRupiah(diff)} (${pct.toFixed(0)}%) dari standar katalog. Nilai ini masih dalam ambang batas toleransi yang diizinkan (${overchargePct}%).`
  }
  if (diff < 0) {
    const pct = (Math.abs(diff) / input.masterTariff) * 100
    if (pct > underchargePct) {
      return `UNDERCHARGE: Tarif yang diinputkan berada di bawah standar wajar. Terdapat selisih biaya sebesar ${formatRupiah(Math.abs(diff))} (${pct.toFixed(0)}%), yang melewati ambang toleransi minimal (${underchargePct}%).`
    }
    return `Tarif yang diinputkan lebih rendah ${formatRupiah(Math.abs(diff))} (${pct.toFixed(0)}%) dari standar katalog. Nilai ini masih dalam ambang batas toleransi yang diizinkan (${underchargePct}%).`
  }
  return 'Tarif yang diinputkan telah sesuai dengan referensi standar katalog rumah sakit.'
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

function tryParseJson(rawText: string): any {
  let base = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  const firstBrace = base.indexOf('{')
  if (firstBrace >= 0) base = base.slice(firstBrace)

  // 1. Try normal parse with finding last brace
  const lastBrace = base.lastIndexOf('}')
  if (lastBrace > 0) {
    try { return JSON.parse(base.slice(0, lastBrace + 1)) } catch (e) { }
  }

  // 2. Try raw parse
  try { return JSON.parse(base) } catch (e) { }

  // 3. Brute force bracket closing for truncated JSON
  const endings = ['}', ']}', '}]}', '}}', '}}}', ']', '"]}', '"}', '"]}]}', '""}']
  for (const suffix of endings) {
    try { return JSON.parse(base + suffix) } catch (e) { }
  }

  // 4. Try removing trailing comma
  if (base.endsWith(',')) {
    const stripped = base.slice(0, -1)
    for (const suffix of endings) {
      try { return JSON.parse(stripped + suffix) } catch (e) { }
    }
  }

  throw new Error('Unparseable JSON')
}

async function repairBrainJson(rawJson: string, parseError: unknown): Promise<string> {
  const repairInput = {
    temperature: 0,
    // Must match or exceed the original output token size so repair doesn't truncate.
    maxTokens: 8000,
    // CRITICAL: always cap budgetTokens for reasoning models (kimi-k2.6).
    // Without this cap, the model enters an unbounded thinking loop on repair calls
    // which causes Step 3 to hang indefinitely. 2000 is enough for JSON repair reasoning.
    budgetTokens: 2000,
    messages: [
      {
        role: 'system' as const,
        content: 'You are a JSON repair engine. Return only valid JSON, no markdown, no comments. Do not alter clinical meaning. Fix unclosed strings, escape newlines/quotes, commas, and brackets so JSON.parse succeeds.',
      },
      {
        role: 'user' as const,
        content: `The following JSON failed to parse with error: ${parseError instanceof Error ? parseError.message : 'unknown error'}\n\nRepair into valid complete JSON:\n${rawJson}`,
      },
    ],
  }
  const result = await callAi(repairInput)
  return result.content

}

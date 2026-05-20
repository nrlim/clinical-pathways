import type { ClinicalPathwayForm, ClinicalMasterData, AiSummaryFeed } from '@/types/clinical-pathway'
import { validateFormAgainstMasterData } from '@/lib/clinical-pathway/master-data-validator'
import { getThresholds } from '@/lib/settings'

export function buildManualMasterData(form: ClinicalPathwayForm): ClinicalMasterData {
  return {
    patient: {
      mrNumber: form.patient.mr_number,
      name: form.patient.patient_name,
      gender: form.patient.gender,
      birthDate: form.patient.birth_date,
      nik: form.patient.nik,
    },
    practitioner: form.encounter.practitioner_name
      ? { mrNumber: '', name: form.encounter.practitioner_name }
      : null,
    organization: form.encounter.organization_id
      ? { id: form.encounter.organization_id, name: form.encounter.organization_id }
      : null,
    source: 'local',
    fetchedAt: new Date().toISOString(),
    warnings: [],
  }
}

export async function buildAiSummaryFeed(
  form: ClinicalPathwayForm,
  masterData: ClinicalMasterData = buildManualMasterData(form),
): Promise<AiSummaryFeed> {
  // Cross-check all form items against the Master Data database tables
  const masterDataValidation = await validateFormAgainstMasterData(form)
  // Fetch thresholds configurations
  const thresholds = await getThresholds()

  return {
    patient: form.patient,
    encounter: form.encounter,
    diagnosis: form.diagnosis,
    procedures: form.procedures,
    medications: form.medications,
    inpatient: form.inpatient,
    outcome: form.outcome,
    masterDataSnapshot: masterData,
    masterDataValidation,
    thresholds,
  }
}


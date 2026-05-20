/**
 * Master Data Validator
 *
 * Cross-checks clinical form inputs against the MasterDiagnosis, MasterProcedure,
 * MasterMedication, and MasterPractitioner tables in the database (via Prisma).
 *
 * No hardcoded data. All lookups are direct DB queries.
 * Called server-side only (inside API routes).
 */

import { prisma } from '@/lib/db/prisma'
import type { ClinicalPathwayForm } from '@/types/clinical-pathway'

// ─── Validation Result Types ──────────────────────────────────────────────────

export type ValidationStatus = 'valid' | 'not_found' | 'not_active'

export interface DiagnosisValidation {
  code: string
  name: string
  status: ValidationStatus
  masterName: string | null
  expectedLos: number | null
  note: string
}

export interface ProcedureValidation {
  index: number
  id: string
  code: string
  name: string
  status: ValidationStatus
  masterName: string | null
  masterUnit: string | null
  masterTariff: number | null
  note: string
}

export interface MedicationValidation {
  index: number
  id: string
  code: string
  name: string
  status: ValidationStatus
  masterName: string | null
  masterUnit: string | null
  masterTariff: number | null
  formulary: string
  note: string
}

export interface PractitionerValidation {
  name: string
  status: ValidationStatus
  note: string
}

export interface MasterDataValidationResult {
  primaryDiagnosis: DiagnosisValidation
  secondaryDiagnoses: DiagnosisValidation[]
  procedures: ProcedureValidation[]
  medications: MedicationValidation[]
  practitioner: PractitionerValidation
  summary: {
    totalChecked: number
    validCount: number
    notFoundCount: number
    notActiveCount: number
    /** Percentage of items found and valid in local master data */
    coverageRate: number
  }
}

// ─── Main Validator (async — uses Prisma DB) ──────────────────────────────────

export async function validateFormAgainstMasterData(
  form: ClinicalPathwayForm,
): Promise<MasterDataValidationResult> {

  const [
    primaryDiagnosis,
    secondaryDiagnoses,
    procedures,
    medications,
    practitioner,
  ] = await Promise.all([
    validateDiagnosis(form.diagnosis.primary_diagnosis_code, form.diagnosis.primary_diagnosis_name),
    Promise.all(form.diagnosis.secondary_diagnoses.map((sec) => validateDiagnosis(sec.code, sec.name))),
    Promise.all(form.procedures.map((proc, idx) => validateProcedure(proc, idx))),
    Promise.all(form.medications.map((med, idx) => validateMedication(med, idx))),
    validatePractitioner(form.encounter.practitioner_name),
  ])

  // Summary
  const allStatuses: ValidationStatus[] = [
    primaryDiagnosis.status,
    ...secondaryDiagnoses.map((d) => d.status),
    ...procedures.map((p) => p.status),
    ...medications.map((m) => m.status),
    practitioner.status,
  ]

  const totalChecked = allStatuses.length
  const validCount = allStatuses.filter((s) => s === 'valid').length
  const notFoundCount = allStatuses.filter((s) => s === 'not_found').length
  const notActiveCount = allStatuses.filter((s) => s === 'not_active').length
  const coverageRate = totalChecked > 0 ? Math.round((validCount / totalChecked) * 100) : 100

  return {
    primaryDiagnosis,
    secondaryDiagnoses,
    procedures,
    medications,
    practitioner,
    summary: { totalChecked, validCount, notFoundCount, notActiveCount, coverageRate },
  }
}

// ─── Individual field validators ──────────────────────────────────────────────

async function validateDiagnosis(code: string, name: string): Promise<DiagnosisValidation> {
  const trimmed = code.trim().toUpperCase()

  if (!trimmed) {
    return { code, name, status: 'not_found', masterName: null, expectedLos: null, note: 'Kode diagnosa tidak diisi.' }
  }

  const master = await prisma.masterDiagnosis.findFirst({
    where: { code: { equals: trimmed } },
  })

  if (!master) {
    return {
      code, name, status: 'not_found', masterName: null, expectedLos: null,
      note: `Kode ICD-10 "${code}" tidak ditemukan di Master Data. Perlu verifikasi manual.`,
    }
  }

  if (!master.isActive) {
    return {
      code, name, status: 'not_active', masterName: master.name, expectedLos: master.expectedLos ? Number(master.expectedLos) : null,
      note: `Diagnosa "${master.name}" tidak aktif di sistem Master Data.`,
    }
  }

  const expectedLos = master.expectedLos ? Number(master.expectedLos) : null
  return {
    code, name, status: 'valid', masterName: master.name, expectedLos,
    note: `Ditemukan: ${master.name}. Standar LOS: ${expectedLos != null ? `${expectedLos} hari` : 'tidak diset'}. ${master.description ?? ''}`,
  }
}

async function validateProcedure(
  proc: ClinicalPathwayForm['procedures'][number],
  index: number,
): Promise<ProcedureValidation> {
  const trimmed = proc.icd9_code.trim()

  if (!trimmed) {
    return {
      index, id: proc.id, code: proc.icd9_code, name: proc.name,
      status: 'not_found', masterName: null, masterUnit: null, masterTariff: null,
      note: 'Kode tindakan tidak diisi.',
    }
  }

  const master = await prisma.masterProcedure.findFirst({
    where: { code: { equals: trimmed, mode: 'insensitive' } },
  })

  if (!master) {
    return {
      index, id: proc.id, code: proc.icd9_code, name: proc.name,
      status: 'not_found', masterName: null, masterUnit: null, masterTariff: null,
      note: `Kode tindakan "${proc.icd9_code}" tidak ditemukan di Master Data.`,
    }
  }

  if (!master.isActive) {
    return {
      index, id: proc.id, code: proc.icd9_code, name: proc.name,
      status: 'not_active', masterName: master.name, masterUnit: master.unit ?? null, masterTariff: null,
      note: `Tindakan "${master.name}" tidak aktif di Master Data.`,
    }
  }

  const tariff = master.baseTariff ? Number(master.baseTariff) : null
  return {
    index, id: proc.id, code: proc.icd9_code, name: proc.name,
    status: 'valid', masterName: master.name, masterUnit: master.unit ?? null, masterTariff: tariff,
    note: `Ditemukan: ${master.name}. Tarif dasar: ${tariff != null ? `Rp ${tariff.toLocaleString('id-ID')}` : 'tidak tersedia'}.`,
  }
}

async function validateMedication(
  med: ClinicalPathwayForm['medications'][number],
  index: number,
): Promise<MedicationValidation> {
  const nameTrimmed = med.drug_name.trim()

  if (!nameTrimmed) {
    return {
      index, id: med.id, code: '-', name: med.drug_name,
      status: 'not_found', masterName: null, masterUnit: null, masterTariff: null,
      formulary: med.formulary || 'Tidak Diketahui',
      note: 'Nama obat tidak diisi.',
    }
  }

  // Match by name (case-insensitive) or code
  const master = await prisma.masterMedication.findFirst({
    where: {
      OR: [
        { name: { contains: nameTrimmed, mode: 'insensitive' } },
        { code: { equals: nameTrimmed, mode: 'insensitive' } },
      ],
    },
  })

  if (!master) {
    return {
      index, id: med.id, code: '-', name: med.drug_name,
      status: 'not_found', masterName: null, masterUnit: null, masterTariff: null,
      formulary: med.formulary || 'Tidak Diketahui',
      note: `Obat "${med.drug_name}" tidak ditemukan di katalog Master Data. Perlu verifikasi formularium.`,
    }
  }

  if (!master.isActive) {
    return {
      index, id: med.id, code: master.code, name: med.drug_name,
      status: 'not_active', masterName: master.name, masterUnit: master.unit ?? null, masterTariff: null,
      formulary: med.formulary || 'Tidak Diketahui',
      note: `Obat "${master.name}" tidak aktif di Master Data.`,
    }
  }

  const tariff = master.baseTariff ? Number(master.baseTariff) : null
  const tags = (master.tags as string[] | null) ?? []
  const formulary = med.formulary || (tags.includes('fornas') ? 'Formularium Nasional' : 'Formularium RS')

  return {
    index, id: med.id, code: master.code, name: med.drug_name,
    status: 'valid', masterName: master.name, masterUnit: master.unit ?? null, masterTariff: tariff,
    formulary,
    note: `Ditemukan: ${master.name}. ${master.description ?? ''} Tarif dasar: ${tariff != null ? `Rp ${tariff.toLocaleString('id-ID')}` : 'tidak tersedia'}.`,
  }
}

async function validatePractitioner(practitionerName: string): Promise<PractitionerValidation> {
  const trimmed = practitionerName.trim()

  if (!trimmed) {
    return { name: practitionerName, status: 'not_found', note: 'Nama dokter DPJP tidak diisi.' }
  }

  const master = await prisma.masterPractitioner.findFirst({
    where: {
      isActive: true,
      name: { contains: trimmed, mode: 'insensitive' },
    },
  })

  if (!master) {
    return {
      name: practitionerName, status: 'not_found',
      note: `Dokter "${practitionerName}" tidak ditemukan di registri Master Data. Data akan menggunakan input manual.`,
    }
  }

  return {
    name: practitionerName, status: 'valid',
    note: `Ditemukan: ${master.name} (${master.specialization ?? 'Tidak diketahui'}).`,
  }
}

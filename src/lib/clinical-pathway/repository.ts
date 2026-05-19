import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import type { ClinicalPathwayForm } from '@/types/clinical-pathway'
import type { AiClinicalPathwayResponse } from '@/types/ai-clinical-pathway'
import type { AiSummaryFeed, ClinicalMasterData } from '@/types/clinical-pathway'

export interface MasterDataMismatch {
  field: string
  formValue: string
  masterDataValue: string
  severity: 'info' | 'warning' | 'danger'
}

export async function saveClinicalPathwaySummary(input: {
  form: ClinicalPathwayForm
  masterData: ClinicalMasterData
  feed: AiSummaryFeed
  brain: AiClinicalPathwayResponse
}) {
  const patient = input.form.patient
  const diagnosis = input.form.diagnosis
  const result = input.brain.result
  const masterPatient = input.masterData.patient
  const mismatches = buildMasterDataMismatches(input.form, input.masterData)

  const summary = await prisma.clinicalPathwaySummary.create({
    data: {
      patientName: patient.patient_name || masterPatient?.name || 'Pasien tanpa nama',
      nik: patient.nik,
      mrNumber: patient.mr_number || masterPatient?.mrNumber || null,
      diagnosisCode: diagnosis.primary_diagnosis_code,
      diagnosisName: diagnosis.primary_diagnosis_name,
      pathwayName: result?.pathwayName || `Pathway - ${diagnosis.primary_diagnosis_code}`,
      validationScore: result?.validationDashboard?.score ?? 0,
      overallStatus: result?.validationDashboard?.overallStatus ?? 'data_kurang',
      totalFlaggedCost: new Prisma.Decimal(result?.validationDashboard?.totalFlaggedCost || 0),
      aiModel: input.brain.model,
      formData: input.form as unknown as Prisma.InputJsonValue,
      masterData: input.masterData as unknown as Prisma.InputJsonValue,
      aiFeed: input.feed as unknown as Prisma.InputJsonValue,
      brainResult: result as unknown as Prisma.InputJsonValue,
      rawText: input.brain.rawText,
      generatedAt: new Date(input.brain.generatedAt),
    },
  })

  return summary
}

export interface ListClinicalPathwaysInput {
  search?: string
  sort?: string
  page?: number
  pageSize?: number
}

export async function listClinicalPathwaySummaries(input?: ListClinicalPathwaysInput) {
  const { search = '', sort = 'createdAt_desc', page = 1, pageSize = 12 } = input || {}

  const where: Prisma.ClinicalPathwaySummaryWhereInput = search
    ? {
        OR: [
          { patientName: { contains: search } }, // Note: Prisma SQLite doesn't support mode: 'insensitive' natively without workarounds, but default is case-insensitive for sqlite LIKE in most configs, or we just rely on default contains.
          { nik: { contains: search } },
          { diagnosisName: { contains: search } },
          { pathwayName: { contains: search } },
        ],
      }
    : {}

  let orderBy: Prisma.ClinicalPathwaySummaryOrderByWithRelationInput = { createdAt: 'desc' }
  if (sort === 'createdAt_asc') orderBy = { createdAt: 'asc' }
  else if (sort === 'score_desc') orderBy = { validationScore: 'desc' }
  else if (sort === 'score_asc') orderBy = { validationScore: 'asc' }

  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.clinicalPathwaySummary.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        patientName: true,
        nik: true,
        mrNumber: true,
        diagnosisCode: true,
        diagnosisName: true,
        pathwayName: true,
        validationScore: true,
        overallStatus: true,
        totalFlaggedCost: true,
        aiModel: true,
        generatedAt: true,
        createdAt: true,
      },
    }),
    prisma.clinicalPathwaySummary.count({ where }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getClinicalPathwaySummary(id: string) {
  return await prisma.clinicalPathwaySummary.findUnique({ where: { id } })
}

function buildMasterDataMismatches(
  form: ClinicalPathwayForm,
  masterData: ClinicalMasterData,
): MasterDataMismatch[] {
  const mismatches: MasterDataMismatch[] = []
  const patient = masterData.patient

  if (!patient) {
    return [{
      field: 'patient',
      formValue: form.patient.patient_name || form.patient.nik,
      masterDataValue: 'Tidak ditemukan',
      severity: 'danger',
    }]
  }

  compareField(mismatches, 'Nama pasien', form.patient.patient_name, patient.name)
  compareField(mismatches, 'Tanggal lahir', form.patient.birth_date, patient.birthDate)
  compareField(mismatches, 'Jenis kelamin', form.patient.gender, patient.gender)
  compareField(mismatches, 'MR Number', form.patient.mr_number, patient.mrNumber, 'info')

  // Only flag organization mismatch when Master Data was actually queried (not manual input)
  if (masterData.source === 'local' && !masterData.organization) {
    const orgWarning = masterData.warnings.find((w) => w.toLowerCase().includes('organization'))
    mismatches.push({
      field: 'Organization',
      formValue: 'Local Master Data',
      masterDataValue: orgWarning ?? 'Organization tidak ditemukan di Master Data',
      severity: 'warning',
    })
  }

  return mismatches
}

function compareField(
  mismatches: MasterDataMismatch[],
  field: string,
  formValue: string,
  masterDataValue: string,
  severity: MasterDataMismatch['severity'] = 'warning',
) {
  if (!formValue || !masterDataValue) return
  if (formValue.trim().toLowerCase() !== masterDataValue.trim().toLowerCase()) {
    mismatches.push({ field, formValue, masterDataValue, severity })
  }
}

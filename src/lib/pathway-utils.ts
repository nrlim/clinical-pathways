import type { PathwaySummary, ClinicalPathwayForm, ProcedureItem, MedicationItem } from '@/types/clinical-pathway'

export function computeSummary(form: ClinicalPathwayForm): PathwaySummary {
  // Cost calculations
  const totalProcedureCost = form.procedures.reduce((acc, p) => {
    const cost = parseFloat(p.unit_cost.replace(/\D/g, '') || '0')
    const qty = parseFloat(p.quantity || '1')
    return acc + cost * qty
  }, 0)

  const totalMedicationCost = form.medications.reduce((acc, m) => {
    const cost = parseFloat(m.unit_cost.replace(/\D/g, '') || '0')
    const qty = parseFloat(m.quantity || '1')
    return acc + cost * qty
  }, 0)

  // Conformance rates
  const procedureConformanceRate = computeConformanceRate(form.procedures)
  const medicationConformanceRate = computeConformanceRate(form.medications)

  // LOS
  const actualLOS = computeLOS(
    form.encounter.admission_date,
    form.encounter.discharge_date,
  )
  const expectedLOS = form.encounter.expected_los ? parseInt(form.encounter.expected_los, 10) || null : null

  return {
    totalProcedureCost,
    totalMedicationCost,
    totalCost: totalProcedureCost + totalMedicationCost,
    actualLOS,
    expectedLOS,
    procedureConformanceRate,
    medicationConformanceRate,
    inpatientJustified: form.inpatient.is_inpatient_indicated,
  }
}

function computeConformanceRate(
  items: Array<ProcedureItem | MedicationItem>,
): number {
  if (items.length === 0) return 0
  const sesuai = items.filter((i) => i.conformance === 'sesuai').length
  return Math.round((sesuai / items.length) * 100)
}

function computeLOS(admission: string, discharge: string): number | null {
  if (!admission || !discharge) return null
  const a = new Date(admission)
  const d = new Date(discharge)
  if (isNaN(a.getTime()) || isNaN(d.getTime())) return null
  const diff = d.getTime() - a.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}

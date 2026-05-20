// ============================================================
// SNAPPATH — DOMAIN TYPES
// ============================================================

export type Gender = 'male' | 'female'
export type EncounterClass = 'inpatient' | 'outpatient' | 'emergency'
export type Outcome = 'improved' | 'referred' | 'deceased' | 'dama' | 'ongoing'
export type Conformance = 'sesuai' | 'tidak' | 'review'
export type WardClass = 'I' | 'II' | 'III' | 'VIP' | 'ICU' | 'ICCU' | 'HCU' | 'Isolasi'

// ─── Section 1: Patient Identification ────────────────────
export interface PatientSection {
  patient_name: string
  nik: string
  birth_date: string
  gender: Gender | ''
  mr_number: string
  address: string
  phone: string
  guarantor: 'BPJS' | 'Asuransi' | 'Umum' | 'JKN' | ''
  bpjs_number: string
}

// ─── Section 2: Encounter / Episode ───────────────────────
export interface EncounterSection {
  organization_id: string
  encounter_class: EncounterClass | ''
  admission_date: string
  admission_time: string
  discharge_date: string
  discharge_time: string
  ward: WardClass | ''
  room_number: string
  bed_number: string
  practitioner_name: string
  dpjp_number: string           // Nomor SIP dokter
  referring_facility: string    // Fasilitas perujuk (jika ada)
  expected_los: string          // expected length of stay (hari)
}

// ─── Section 3: Diagnosis ──────────────────────────────────
export interface DiagnosisSection {
  primary_diagnosis_code: string
  primary_diagnosis_name: string
  secondary_diagnoses: SecondaryDiagnosis[]
  severity: 'ringan' | 'sedang' | 'berat' | 'sangat_berat' | ''
  comorbidities: string
}

export interface SecondaryDiagnosis {
  id: string
  code: string
  name: string
}

// ─── Section 4: Tindakan (Procedures) ─────────────────────
export interface ProcedureItem {
  id: string
  icd9_code: string             // ICD-9-CM kode tindakan
  name: string
  category: string              // Bedah / Non-bedah / Diagnostik / Rehabilitasi
  performed_date: string
  performed_by: string
  conformance: Conformance | ''  // Apakah sesuai dengan diagnosa?
  unit_cost: string              // Biaya satuan (Rp)
  quantity: string
  tariff_type: 'INA-CBGs' | 'Non-INA-CBGs' | 'Umum' | ''
  notes: string
}

// ─── Section 5: Obat (Medications) ────────────────────────
export interface MedicationItem {
  id: string
  drug_name: string
  generic_name: string
  route: string                  // Oral / IV / IM / SC / Topikal
  dosage: string                 // e.g. "500mg"
  frequency: string              // e.g. "3x1"
  duration_days: string
  formulary: 'Formularium Nasional' | 'Formularium RS' | 'Non-Formularium' | ''
  conformance: Conformance | ''  // Apakah sesuai dengan diagnosa?
  unit_cost: string              // Biaya per unit (Rp)
  quantity: string
  notes: string
}

// ─── Section 6: Rawat Inap Justifikasi ────────────────────
export interface InpatientJustification {
  is_inpatient_indicated: boolean | null  // Apakah rawat inap sesuai diagnosa?
  justification_reason: string
  clinical_criteria_met: string[]         // Kriteria klinis yang terpenuhi
  los_conformance: Conformance | ''       // Apakah lama rawat sesuai?
  los_deviation_reason: string            // Jika tidak sesuai, alasannya
  discharge_criteria: string             // Kriteria pemulangan
  discharge_condition: 'Membaik' | 'Stabil' | 'Meninggal' | 'DAMA' | 'Dirujuk' | ''
}

// ─── Section 7: Outcome & Summary ─────────────────────────
export interface OutcomeSection {
  outcome: Outcome | ''
  readmission_risk: 'rendah' | 'sedang' | 'tinggi' | ''
  clinical_notes: string
  follow_up_plan: string
  education_given: string       // Edukasi yang diberikan ke pasien
  pathway_variance: string      // Varians dari pathway standar
}

// ─── Section 8: Supporting Documents ───────────────────────
export interface SupportingDocument {
  id: string
  name: string
  description: string
  required: boolean
  file_name: string | null
  file_size: string | null
  uploaded_at: string | null
  status: 'available' | 'missing'
  verification_status?: 'valid' | 'invalid' | 'unchecked'
  verification_note?: string
  /** Path of the file inside the Supabase Storage bucket (e.g. documents/ktp/1234_ktp.pdf) */
  storage_path?: string
  /** Public CDN URL of the file returned by Supabase Storage */
  public_url?: string
}

// ─── Root Form State ───────────────────────────────────────
export interface ClinicalPathwayForm {
  patient: PatientSection
  encounter: EncounterSection
  diagnosis: DiagnosisSection
  procedures: ProcedureItem[]
  medications: MedicationItem[]
  inpatient: InpatientJustification
  outcome: OutcomeSection
  documents: SupportingDocument[]
}

// ─── Computed Summary ──────────────────────────────────────
export interface PathwaySummary {
  totalProcedureCost: number
  totalMedicationCost: number
  totalCost: number
  actualLOS: number | null
  expectedLOS: number | null
  procedureConformanceRate: number   // % sesuai diagnosa
  medicationConformanceRate: number  // % sesuai diagnosa
  inpatientJustified: boolean | null
}

// ─── AI Feed & Validation Types ──────────────────────────────────────────────

export interface MasterDataPatient {
  mrNumber: string
  name: string
  gender: 'male' | 'female' | 'other' | 'unknown' | ''
  birthDate: string
  nik: string
}

export interface MasterDataPractitioner {
  mrNumber: string
  name: string
}

export interface MasterDataOrganization {
  id: string
  name: string
}

export interface ClinicalMasterData {
  patient: MasterDataPatient | null
  practitioner: MasterDataPractitioner | null
  organization: MasterDataOrganization | null
  source: 'local' | 'manual'
  fetchedAt: string
  warnings: string[]
}

export interface AiSummaryFeed {
  patient: ClinicalPathwayForm['patient']
  encounter: ClinicalPathwayForm['encounter']
  diagnosis: ClinicalPathwayForm['diagnosis']
  procedures: ClinicalPathwayForm['procedures']
  medications: ClinicalPathwayForm['medications']
  inpatient: ClinicalPathwayForm['inpatient']
  outcome: ClinicalPathwayForm['outcome']
  documents?: SupportingDocument[]
  masterDataSnapshot: ClinicalMasterData
  /**
   * Pre-computed cross-check results from local master data catalog.
   * Tells the AI which items are valid, not found, or inactive BEFORE reasoning.
   */
  masterDataValidation: {
    primaryDiagnosis: {
      code: string; status: string; masterName: string | null; expectedLos: number | null; note: string
    }
    secondaryDiagnoses: Array<{
      code: string; status: string; masterName: string | null; expectedLos: number | null; note: string
    }>
    procedures: Array<{
      id: string; code: string; status: string; masterName: string | null;
      masterTariff: number | null; note: string
    }>
    medications: Array<{
      id: string; name: string; status: string; masterName: string | null;
      masterTariff: number | null; formulary: string; note: string
    }>
    practitioner: { name: string; status: string; note: string }
    summary: {
      totalChecked: number; validCount: number; notFoundCount: number;
      notActiveCount: number; coverageRate: number
    }
  }
  thresholds?: {
    procedureOverchargePct: number
    procedureUnderchargePct: number
    medicationOverchargePct: number
    medicationUnderchargePct: number
    losOverchargePct: number
    losUnderchargePct: number
  }
}

export interface ClinicalPathwaySubmission {
  form: ClinicalPathwayForm
  aiFeed: AiSummaryFeed
  rawResponseText: string
  latencyMs?: number
}

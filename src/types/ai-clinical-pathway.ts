export interface AiClinicalPathwayDayPlan {
  day: string
  focus: string
  assessments: string[]
  interventions: string[]
  medicationConsiderations: string[]
  monitoring: string[]
  dischargeCriteria: string[]
}

export interface AiClinicalRiskItem {
  level: 'rendah' | 'sedang' | 'tinggi' | 'kritis'
  issue: string
  rationale: string
  recommendedAction: string
}

export type AiValidationStatus = 'sesuai' | 'tidak_sesuai' | 'perlu_review' | 'data_kurang'

export interface AiValidatedClinicalItem {
  id: string
  type: 'procedure' | 'medication'
  code: string
  name: string
  status: AiValidationStatus
  diagnosisRelation: string
  masterDataValidation: string
  unitCost: number
  quantity: number
  totalCost: number
  priceAssessment: string
  issue: string
  recommendedAction: string
}

export interface AiClinicalVarianceItem {
  area: string
  observedVariance: string
  potentialImpact: string
  recommendedFollowUp: string
}

export interface AiValidationDashboard {
  overallStatus: AiValidationStatus
  score: number
  passedCount: number
  reviewCount: number
  failedCount: number
  totalFlaggedCost: number
  actualLos?: number
  expectedLos?: number
  quickFindings: string[]
  validatedItems: AiValidatedClinicalItem[]
}

export interface AiClinicalPathwayBrainOutput {
  executiveSummary: string
  clinicalSynopsis: string
  workingAssessment: string
  pathwayName: string
  careGoals: string[]
  validationDashboard: AiValidationDashboard
  dayByDayPlan: AiClinicalPathwayDayPlan[]
  conformanceAnalysis: {
    diagnosisProcedureFit: string
    diagnosisMedicationFit: string
    inpatientJustification: string
    losAssessment: string
    costSignal: string
  }
  riskStratification: AiClinicalRiskItem[]
  pathwayVariances: AiClinicalVarianceItem[]
  dischargeReadiness: {
    status: 'belum_siap' | 'perlu_review' | 'siap' | 'tidak_dinilai'
    criteriaMet: string[]
    blockers: string[]
    followUpPlan: string
    patientEducation: string
  }
  masterDataMapping: {
    patientReference: string
    suggestedResources: string[]
    missingMasterData: string[]
  }
  aiSummaryForClinician: string
  aiSummaryForCoder: string
  aiSummaryForPatient: string
  safetyNotes: string[]
  dataQualityIssues: string[]
}

export interface AiClinicalPathwayResponse {
  result: AiClinicalPathwayBrainOutput
  rawText: string
  model: string
  generatedAt: string
  latencyMs: number
}

'use client'

import { useState, useMemo, useRef } from 'react'
import { FileText, FolderOpen, Database, ChevronLeft, ChevronRight, Download, Zap, Clock, BarChart2, ClipboardCheck, BrainCircuit, DownloadCloud, Inbox, Filter, Search, RefreshCw, Edit2 } from 'lucide-react'
import { PatientSectionForm, EncounterSectionForm } from '@/components/pathway/PatientEncounterSections'
import { DiagnosisSectionForm, ProcedureSectionForm, MedicationSectionForm, InpatientJustificationForm } from '@/components/pathway/ClinicalSections'
import { AiClinicalPathwayReport, OutcomeSectionForm, SummaryPanel } from '@/components/pathway/OutcomeSummary'
import { MasterDataCrosscheck } from '@/components/pathway/MasterDataCrosscheck'
import { MasterDataPanel } from '@/components/master-data/MasterDataPanel'
import { WorkflowProgressTracker, WorkflowBubble } from '@/components/workflow/WorkflowProgressTracker'
import { computeSummary, formatRupiah } from '@/lib/pathway-utils'
import type { ClinicalPathwayForm, ClinicalMasterData, AiSummaryFeed } from '@/types/clinical-pathway'
import type { AiClinicalPathwayBrainOutput, AiClinicalPathwayResponse } from '@/types/ai-clinical-pathway'
import type { WorkflowStepState } from '@/components/workflow/WorkflowProgressTracker'

type AppView = 'form' | 'history' | 'master-data'


interface ClinicalPathwayRecordListItem {
  id: string
  patientName: string
  nik: string
  mrNumber: string | null
  diagnosisCode: string
  diagnosisName: string
  pathwayName: string
  validationScore: number
  overallStatus: string
  totalFlaggedCost: string
  aiModel: string
  generatedAt: string
  createdAt: string
}

interface ClinicalPathwayRecordDetail extends ClinicalPathwayRecordListItem {
  brainResult: AiClinicalPathwayBrainOutput
  formData: any
  masterData: any
  aiFeed: any
}



const STEPS = [
  { id: 1, label: 'Identitas', sublabel: 'Data Pasien' },
  { id: 2, label: 'Encounter', sublabel: 'Episode Rawat' },
  { id: 3, label: 'Diagnosis', sublabel: 'ICD-10' },
  { id: 4, label: 'Tindakan', sublabel: 'Prosedur' },
  { id: 5, label: 'Obat', sublabel: 'Medikasi' },
  { id: 6, label: 'Rawat Inap', sublabel: 'Justifikasi' },
  { id: 7, label: 'Outcome', sublabel: 'Catatan Klinis' },
]

const INITIAL: ClinicalPathwayForm = {
  patient: {
    patient_name: '', nik: '', birth_date: '', gender: '',
    mr_number: '', address: '', phone: '', guarantor: '', bpjs_number: '',
  },
  encounter: {
    organization_id: '', encounter_class: '', admission_date: '', admission_time: '',
    discharge_date: '', discharge_time: '', ward: '', room_number: '',
    bed_number: '', practitioner_name: '', dpjp_number: '',
    referring_facility: '', expected_los: '',
  },
  diagnosis: {
    primary_diagnosis_code: '', primary_diagnosis_name: '',
    secondary_diagnoses: [], severity: '', comorbidities: '',
  },
  procedures: [],
  medications: [],
  inpatient: {
    is_inpatient_indicated: null, justification_reason: '',
    clinical_criteria_met: [], los_conformance: '',
    los_deviation_reason: '', discharge_criteria: '', discharge_condition: '',
  },
  outcome: {
    outcome: '', readmission_risk: '', clinical_notes: '',
    follow_up_plan: '', education_given: '', pathway_variance: '',
  },
}

// Workflow step definitions for the progress tracker
const WORKFLOW_STEPS = [
  { id: 'buildFeed',       label: 'Build AI Feed',         sublabel: 'Menyusun data form dan master data' },
  { id: 'validateMaster', label: 'Validasi Master Data',   sublabel: 'Cross-check diagnosa, tindakan, obat' },
  { id: 'callBrainAi',    label: 'Brain AI Generation',    sublabel: 'Memanggil SumoPod AI (maks. 3x retry)' },
  { id: 'saveToDb',       label: 'Simpan Hasil',           sublabel: 'Menyimpan ke database' },
]

const POLL_INTERVAL_MS = 2000 // 2-second polling interval

export default function ClinicalPathwayPage() {
  const [form, setForm] = useState<ClinicalPathwayForm>(INITIAL)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [masterData, setMasterData] = useState<ClinicalMasterData | null>(null)
  const [submitMessage, setSubmitMessage] = useState('')
  const [brainResponse, setBrainResponse] = useState<AiClinicalPathwayResponse | null>(null)
  const [feedData, setFeedData] = useState<AiSummaryFeed | null>(null)
  const [view, setView] = useState<AppView>('form')
  const [summaryTab, setSummaryTab] = useState<'summary' | 'crosscheck' | 'clinical'>('summary')
  const [historyRecords, setHistoryRecords] = useState<ClinicalPathwayRecordListItem[]>([])
  const [recordsMessage, setRecordsMessage] = useState('')

  const [historySearch, setHistorySearch] = useState('')
  const [historySort, setHistorySort] = useState('createdAt_desc')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)

  // Workflow polling state
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(null)
  const [workflowStableRunId, setWorkflowStableRunId] = useState<string | null>(null)
  const [workflowStepStates, setWorkflowStepStates] = useState<Record<string, WorkflowStepState>>({})
  const [workflowCurrentStep, setWorkflowCurrentStep] = useState(0)
  const [workflowError, setWorkflowError] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const summary = useMemo(() => computeSummary(form), [form])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        const data = json.form_data || json
        
        if (!data.patient || !data.encounter) {
          throw new Error('Format JSON tidak valid (missing patient/encounter).')
        }

        setForm(data)
        setStep(7)
      } catch (err) {
        alert('Gagal mengimpor file JSON: ' + (err instanceof Error ? err.message : 'Unknown error'))
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  async function loadHistoryRecords(page = historyPage, search = historySearch, sort = historySort) {
    setRecordsMessage('')
    try {
      const response = await fetch(`/api/clinical-pathways?page=${page}&search=${encodeURIComponent(search)}&sort=${sort}`)
      const payload = await response.json() as { items?: ClinicalPathwayRecordListItem[]; totalPages?: number; page?: number; message?: string }
      if (!response.ok || !payload.items) throw new Error(payload.message ?? 'Gagal mengambil riwayat.')
      setHistoryRecords(payload.items)
      setHistoryPage(payload.page || 1)
      setHistoryTotalPages(payload.totalPages || 1)
    } catch (error) {
      setRecordsMessage(error instanceof Error ? error.message : 'Gagal mengambil riwayat.')
    }
  }



  async function openSavedClinicalPathway(id: string) {
    setRecordsMessage('')
    try {
      const response = await fetch(`/api/clinical-pathways/${id}`)
      const payload = await response.json() as { record?: ClinicalPathwayRecordDetail; message?: string }
      if (!response.ok || !payload.record) throw new Error(payload.message ?? 'Gagal membuka clinical pathway.')
      setBrainResponse({
        result: payload.record.brainResult,
        rawText: '',
        model: payload.record.aiModel,
        generatedAt: payload.record.generatedAt,
        latencyMs: 0,
      })
      if (payload.record.formData) {
        setForm(payload.record.formData)
      }
      if (payload.record.masterData) {
        setMasterData(payload.record.masterData as any)
      }
      if (payload.record.aiFeed) {
        setFeedData(payload.record.aiFeed as any)
      }
      setSubmitMessage(`Membuka hasil Brain AI tersimpan untuk ${payload.record.patientName}.`)
      setSubmitted(true)
    } catch (error) {
      setRecordsMessage(error instanceof Error ? error.message : 'Gagal membuka clinical pathway.')
    }
  }

  // Generic section updater
  function updateSection<K extends keyof ClinicalPathwayForm>(
    section: K, field: string, value: unknown,
  ) {
    setForm(prev => ({
      ...prev,
      [section]: { ...(prev[section] as object), [field]: value },
    }))
  }

  // lookupMasterData removed

  /**
   * Advances the workflow step tracker UI based on elapsed time.
   * We use a time-based heuristic since the Workflow SDK status endpoint
   * only returns "running" | "completed" | "failed", not the current step name.
   */
  function advanceStepByTime(startedAt: number) {
    const elapsed = Date.now() - startedAt
    // Approximate step transitions based on typical timing:
    // Step 0 (buildFeed): 0-3s
    // Step 1 (validateMaster): 3-8s
    // Step 2 (callBrainAi): 8-120s (AI call)
    // Step 3 (saveToDb): last few seconds
    if (elapsed < 3000) {
      setWorkflowCurrentStep(0)
      setWorkflowStepStates({ buildFeed: 'running', validateMaster: 'waiting', callBrainAi: 'waiting', saveToDb: 'waiting' })
    } else if (elapsed < 8000) {
      setWorkflowCurrentStep(1)
      setWorkflowStepStates({ buildFeed: 'done', validateMaster: 'running', callBrainAi: 'waiting', saveToDb: 'waiting' })
    } else {
      setWorkflowCurrentStep(2)
      setWorkflowStepStates({ buildFeed: 'done', validateMaster: 'done', callBrainAi: 'running', saveToDb: 'waiting' })
    }
  }

  function stopPolling() {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  async function pollWorkflowStatus(runId: string, stableRunId: string, startedAt: number) {
    try {
      const url = `/api/workflow/status?runId=${encodeURIComponent(runId)}&stableRunId=${encodeURIComponent(stableRunId)}`
      const res = await fetch(url)
      const data = await res.json() as {
        status: 'running' | 'completed' | 'failed' | 'not_found'
        brain?: AiClinicalPathwayResponse
        feed?: AiSummaryFeed
        savedRecordId?: string
        error?: string
      }

      if (data.status === 'completed' && data.brain) {
        stopPolling()
        // Show saveToDb as running briefly, then complete
        setWorkflowCurrentStep(3)
        setWorkflowStepStates({ buildFeed: 'done', validateMaster: 'done', callBrainAi: 'done', saveToDb: 'running' })
        setIsMinimized(false) // auto-expand on completion
        setTimeout(() => {
          setWorkflowCurrentStep(4) // beyond last step = all done
          setWorkflowStepStates({ buildFeed: 'done', validateMaster: 'done', callBrainAi: 'done', saveToDb: 'done' })
          setBrainResponse(data.brain!)
          if (data.feed) setFeedData(data.feed)
          setSubmitMessage(`Brain AI berhasil membuat clinical pathway detail dengan model ${data.brain!.model}.`)
          setIsSubmitting(false)
          setSubmitted(true)
        }, 800)
        return
      }

      if (data.status === 'failed' || data.status === 'not_found') {
        stopPolling()
        setWorkflowError(true)
        setIsMinimized(false) // auto-expand on error so user sees what happened
        setWorkflowStepStates(prev => {
          const updated = { ...prev }
          const runningKey = Object.keys(prev).find(k => prev[k] === 'running')
          if (runningKey) updated[runningKey] = 'error'
          return updated
        })
        setSubmitMessage(data.error ?? 'Workflow gagal. Silakan coba lagi.')
        setIsSubmitting(false)
        return
      }

      // Still running — advance the step indicator based on elapsed time
      advanceStepByTime(startedAt)
      pollTimerRef.current = setTimeout(() => void pollWorkflowStatus(runId, stableRunId, startedAt), POLL_INTERVAL_MS)
    } catch {
      // Network error — keep polling
      advanceStepByTime(startedAt)
      pollTimerRef.current = setTimeout(() => void pollWorkflowStatus(runId, stableRunId, startedAt), POLL_INTERVAL_MS)
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setIsMinimized(false)
    setSubmitMessage('')
    setWorkflowError(false)
    setWorkflowRunId(null)
    setWorkflowStableRunId(null)
    setWorkflowCurrentStep(0)
    setWorkflowStepStates({ buildFeed: 'running', validateMaster: 'waiting', callBrainAi: 'waiting', saveToDb: 'waiting' })

    const startedAt = Date.now()

    try {
      const response = await fetch('/api/ai/clinical-pathway-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, summary, masterData }),
      })
      const payload = await response.json() as { runId?: string; stableRunId?: string; message?: string }

      if (!response.ok || !payload.runId) {
        throw new Error(payload.message ?? 'Gagal memulai workflow clinical pathway.')
      }

      setWorkflowRunId(payload.runId)
      setWorkflowStableRunId(payload.stableRunId ?? payload.runId)
      // Start polling with both IDs
      const sId = payload.stableRunId ?? payload.runId
      pollTimerRef.current = setTimeout(() => void pollWorkflowStatus(payload.runId!, sId, startedAt), POLL_INTERVAL_MS)
    } catch (error) {
      setWorkflowError(true)
      setWorkflowStepStates({ buildFeed: 'error', validateMaster: 'waiting', callBrainAi: 'waiting', saveToDb: 'waiting' })
      setSubmitMessage(error instanceof Error ? error.message : 'Gagal memulai workflow.')
      setIsSubmitting(false)
    }
  }

  if (submitted && view !== 'form') {
    // If the user submits, we want to stay in the 'form' view to see the dashboard.
    // However, if they switch view tabs, we let them navigate seamlessly.
  }
  return (

    <div className="page-bg">
      <div className={`app-layout-grid ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
        {/* Left Navigation Sidebar */}
        <aside className="app-sidebar-nav">
          <div className="app-sidebar-sticky-wrapper" style={{ position: 'relative' }}>
            {/* Toggle button — ear on right edge */}
            <button 
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? 'Tutup Sidebar' : 'Buka Sidebar'}
            >
              {isSidebarOpen 
                ? <ChevronLeft size={11} strokeWidth={2.5} /> 
                : <ChevronRight size={11} strokeWidth={2.5} />}
            </button>

            <div className="app-sidebar-inner">
              {/* Brand */}
              <div className="app-sidebar-header">
                <div className="app-sidebar-brand">
                  <div className="app-sidebar-logo-glow">CP</div>
                  <div className="app-sidebar-title">
                    Clinical Pathway
                    <span>Satu Sehat Portal</span>
                  </div>
                </div>
              </div>

              <div className="app-sidebar-menu-label">Navigasi</div>

              <nav className="app-sidebar-menu">
                <button 
                  type="button" 
                  className={`app-sidebar-item ${view === 'form' ? 'active' : ''}`}
                  onClick={() => setView('form')}
                >
                  <span className="app-sidebar-item-icon"><FileText /></span>
                  <span>Input Form</span>
                </button>
                <button 
                  type="button" 
                  className={`app-sidebar-item ${view === 'history' ? 'active' : ''}`}
                  onClick={() => { setView('history'); void loadHistoryRecords() }}
                >
                  <span className="app-sidebar-item-icon"><FolderOpen /></span>
                  <span>Clinical Pathways</span>
                </button>
                <button 
                  type="button" 
                  className={`app-sidebar-item ${view === 'master-data' ? 'active' : ''}`}
                  onClick={() => setView('master-data')}
                >
                  <span className="app-sidebar-item-icon"><Database /></span>
                  <span>Master Data</span>
                </button>
              </nav>
            </div>

          </div>

        </aside>

        {/* Main Content Area */}
        <main className="page-content animate-in">
          {view === 'history' && (
            <HistoryPanel 
              records={historyRecords} 
              message={recordsMessage} 
              onOpen={(id) => {
                setView('form');
                void openSavedClinicalPathway(id);
              }} 
              search={historySearch}
              onSearchChange={(val) => setHistorySearch(val)}
              sort={historySort}
              onSortChange={(val) => { setHistorySort(val); void loadHistoryRecords(1, historySearch, val) }}
              page={historyPage}
              totalPages={historyTotalPages}
              onPageChange={(p) => void loadHistoryRecords(p, historySearch, historySort)}
              onSearchSubmit={() => void loadHistoryRecords(1, historySearch, historySort)}
            />
          )}
          {view === 'master-data' && (
            <MasterDataPanel />
          )}
          {view === 'form' && (
            submitted ? (
              <div className="fade-in animate-in">
                <div className="page-title-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100))',
                      border: '1px solid var(--color-primary-200)',
                      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-600)'
                    }}>
                      <FileText size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        AI Clinical <span style={{ background: 'linear-gradient(90deg, var(--color-primary-600), var(--color-info-500))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pathway Report</span>
                      </h2>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {submitMessage || 'Laporan hasil evaluasi kesesuaian klinis.'}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <button className="btn btn-ghost" style={{ cursor: 'pointer', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '10px 18px', fontWeight: 600, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => {
                        setView('history')
                        void loadHistoryRecords()
                      }}>
                      <ChevronLeft size={16} /> Kembali
                    </button>
                    <button className="btn btn-primary" style={{ cursor: 'pointer', padding: '10px 18px', fontWeight: 600, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => {
                        setForm(INITIAL)
                        setStep(1)
                        setSubmitMessage('')
                        setBrainResponse(null)
                        setSubmitted(false)
                        setSummaryTab('summary')
                      }}>
                      + Input Baru
                    </button>
                  </div>
                </div>

                {brainResponse && (
                  <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-6)', marginTop: 'var(--space-2)' }}>
                    {brainResponse.latencyMs > 0 && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(20, 184, 166, 0.15)',
                        border: '1px solid var(--color-primary-500)',
                        borderRadius: 'var(--radius-full)', padding: '4px 14px',
                        fontSize: '0.8rem',
                        color: 'var(--color-primary-500)',
                        fontWeight: 700,
                      }}>
                        <Zap size={14} /> {(brainResponse.latencyMs / 1000).toFixed(1)}s Latency
                      </span>
                    )}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-full)', padding: '4px 14px',
                      fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500,
                    }}>
                      <Clock size={14} /> {new Date(brainResponse.generatedAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                <div className="card-glass" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div className="summary-tabs-container" style={{ marginBottom: 'var(--space-6)' }}>
                      <div className="summary-tabs">
                        <button 
                          type="button"
                          className={`summary-tab ${summaryTab === 'summary' ? 'active' : ''}`}
                          onClick={() => setSummaryTab('summary')}
                        >
                          <span className="summary-tab-icon"><BarChart2 size={16} /></span> Ringkasan Validasi
                        </button>
                        <button 
                          type="button"
                          className={`summary-tab ${summaryTab === 'crosscheck' ? 'active' : ''}`}
                          onClick={() => setSummaryTab('crosscheck')}
                        >
                          <span className="summary-tab-icon"><ClipboardCheck size={16} /></span> Master Data Crosscheck
                        </button>
                        <button 
                          type="button"
                          className={`summary-tab ${summaryTab === 'clinical' ? 'active' : ''}`}
                          onClick={() => setSummaryTab('clinical')}
                        >
                          <span className="summary-tab-icon"><BrainCircuit size={16} /></span> Clinical Insight & Plan
                        </button>
                      </div>
                    </div>

                    {summaryTab === 'summary' && (
                      <div className="fade-in animate-in">
                        <SummaryPanel summary={summary} brainResult={brainResponse?.result} aiFeed={feedData || undefined} />
                      </div>
                    )}

                    {summaryTab === 'crosscheck' && (
                      <div className="fade-in animate-in">
                        <MasterDataCrosscheck
                          form={form}
                          procedureLookups={Object.fromEntries(
                            (feedData?.masterDataValidation?.procedures ?? []).map((p) => [
                              p.code,
                              p.status !== 'not_found'
                                ? { name: p.masterName ?? p.code, code: p.code, baseTariff: p.masterTariff ?? null }
                                : null,
                            ])
                          )}
                          medicationLookups={Object.fromEntries(
                            (feedData?.masterDataValidation?.medications ?? []).map((m) => [
                              m.name,
                              m.status !== 'not_found'
                                ? { name: m.masterName ?? m.name, code: m.id, baseTariff: m.masterTariff ?? null }
                                : null,
                            ])
                          )}
                        />
                      </div>
                    )}

                    {summaryTab === 'clinical' && brainResponse && (
                      <div className="fade-in animate-in">
                        <AiClinicalPathwayReport result={brainResponse.result} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'contents' }}>
                <div className="form-workspace">
                  {/* Header Row: Title & Import JSON */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-10)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100))',
                        border: '1px solid var(--color-primary-200)',
                        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-600)'
                      }}>
                        <ClipboardCheck size={24} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Formulir <span style={{ background: 'linear-gradient(90deg, var(--color-primary-600), var(--color-info-500))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Clinical Pathway</span>
                        </h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          Lengkapi seluruh tahapan informasi medis pasien di bawah ini.
                        </p>
                      </div>
                    </div>
                    
                    <label className="stepper-import-btn" title="Import Sample JSON" style={{ margin: 0, marginBottom: '2px' }}>
                      <DownloadCloud size={15} />
                      <span>Import JSON</span>
                      <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>
                  </div>

                  {/* Stepper */}
                  <nav className="stepper" aria-label="Form steps">
                    {STEPS.map(s => (
                      <button key={s.id} type="button"
                        className={`stepper-item ${step === s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}
                        onClick={() => setStep(s.id)}
                        aria-current={step === s.id ? 'step' : undefined}>
                        <div className="stepper-num">
                          {step > s.id ? '✓' : s.id}
                        </div>
                        <div>
                          <div className="stepper-label">{s.label}</div>
                          <div className="stepper-sublabel">{s.sublabel}</div>
                        </div>
                      </button>
                    ))}
                  </nav>

                  {/* Step content */}
                  <form id="pathway-form" onSubmit={e => { e.preventDefault(); if (step < 7) setStep(s => s + 1) }}>
                    {step === 1 && (
                      <PatientSectionForm
                        data={form.patient}
                        onChange={(f, v) => updateSection('patient', f, v)}
                      />
                    )}
                    {step === 2 && (
                      <EncounterSectionForm
                        data={form.encounter}
                        onChange={(f, v) => updateSection('encounter', f, v)}
                      />
                    )}
                    {step === 3 && (
                      <DiagnosisSectionForm
                        data={form.diagnosis}
                        onChange={(f, v) => updateSection('diagnosis', f, v)}
                      />
                    )}
                    {step === 4 && (
                      <ProcedureSectionForm
                        items={form.procedures}
                        onChange={items => setForm(p => ({ ...p, procedures: items }))}
                      />
                    )}
                    {step === 5 && (
                      <MedicationSectionForm
                        items={form.medications}
                        onChange={items => setForm(p => ({ ...p, medications: items }))}
                      />
                    )}
                    {step === 6 && (
                      <InpatientJustificationForm
                        data={form.inpatient}
                        onChange={(f, v) => updateSection('inpatient', f, v)}
                      />
                    )}
                    {step === 7 && (
                      <OutcomeSectionForm
                        data={form.outcome}
                        onChange={(f, v) => updateSection('outcome', f, v)}
                      />
                    )}
                  </form>
                </div>

                {/* Navigation bar — direct child of main for proper sticky bottom */}
                <div className="form-nav">
                  <button type="button" className="btn btn-ghost"
                    onClick={() => setStep(s => Math.max(1, s - 1))}
                    disabled={step === 1}>
                    ← Sebelumnya
                  </button>
                  <span className="step-indicator">Langkah {step} dari {STEPS.length}</span>
                  {step < 7 ? (
                    <button type="submit" form="pathway-form" className="btn btn-primary">
                      Selanjutnya
                    </button>
                  ) : (
                    <div className="submit-cluster">
                      {submitMessage && <span className="submit-message" role="alert">{submitMessage}</span>}
                      <button type="button" className="btn btn-success"
                        onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Memanggil Brain AI...' : 'Generate AI Summary'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </main>
      </div>

      {/* Workflow tracker — floating card (no backdrop) */}
      {isSubmitting && !isMinimized && (
        <div className="workflow-floating-overlay">
          <WorkflowProgressTracker
            steps={WORKFLOW_STEPS}
            stepStates={workflowStepStates}
            currentStepIndex={workflowCurrentStep}
            isError={workflowError}
            errorMessage={submitMessage}
            onMinimize={() => setIsMinimized(true)}
          />
        </div>
      )}

      {/* Floating bubble shown when minimized */}
      {isSubmitting && isMinimized && (
        <WorkflowBubble
          currentStepIndex={workflowCurrentStep}
          totalSteps={WORKFLOW_STEPS.length}
          stepLabel={WORKFLOW_STEPS[Math.min(workflowCurrentStep, WORKFLOW_STEPS.length - 1)]?.sublabel ?? ''}
          isError={workflowError}
          onExpand={() => setIsMinimized(false)}
        />
      )}
    </div>
  )
}

function HistoryPanel({
  records,
  message,
  onOpen,
  search,
  onSearchChange,
  sort,
  onSortChange,
  page,
  totalPages,
  onPageChange,
  onSearchSubmit,
}: {
  records: ClinicalPathwayRecordListItem[]
  message: string
  onOpen: (id: string) => void
  search: string
  onSearchChange: (val: string) => void
  sort: string
  onSortChange: (val: string) => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onSearchSubmit: () => void
}) {
  return (
    <section className="records-panel" style={{ width: '100%' }}>
      <div className="page-title-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100))',
            border: '1px solid var(--color-primary-200)',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-600)'
          }}>
            <Database size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Riwayat <span style={{ background: 'linear-gradient(90deg, var(--color-primary-600), var(--color-info-500))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Clinical Pathway</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Daftar hasil analisis form medis yang telah tersimpan di sistem.
            </p>
          </div>
        </div>
      </div>
      
      <div className="table-responsive" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflowX: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        
        {/* Unified Tools & Filter Header */}
        <div style={{ padding: 'var(--space-5)', borderBottom: '2px solid var(--bg-base)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Filter size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Tools & Filter</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Menampilkan {records.length} riwayat sesuai filter aktif.</p>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ padding: '6px 16px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid var(--border-default)', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)' }} onClick={() => { onSearchChange(''); onSortChange('createdAt_desc'); }}>
              <RefreshCw size={14} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} /> Reset
            </button>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            <form 
              style={{ position: 'relative', flex: '1 1 300px', minWidth: '250px' }}
              onSubmit={(e) => { e.preventDefault(); onSearchSubmit(); }}
            >
              <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Cari NIK, pasien, atau pathway..." 
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ paddingLeft: '44px', margin: 0, width: '100%', borderRadius: 'var(--radius-md)' }}
              />
            </form>
            
            <select 
              className="form-select" 
              value={sort} 
              onChange={(e) => onSortChange(e.target.value)}
              style={{ margin: 0, minWidth: '220px', borderRadius: 'var(--radius-md)' }}
            >
              <option value="createdAt_desc">Urutkan: Terbaru</option>
              <option value="createdAt_asc">Urutkan: Terlama</option>
              <option value="score_desc">Score: Tinggi - Rendah</option>
              <option value="score_asc">Score: Rendah - Tinggi</option>
            </select>
          </div>
        </div>

        {message && <div style={{ padding: 'var(--space-4) var(--space-5)', background: 'var(--color-info-50)', color: 'var(--color-info-700)', borderBottom: '1px solid var(--color-info-200)', fontSize: '0.9rem', fontWeight: 500 }}>{message}</div>}

        <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-base)', borderBottom: '2px solid var(--border-strong)' }}>
              <th style={{ padding: 'var(--space-4) var(--space-5)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID PASIEN</th>
              <th style={{ padding: 'var(--space-4) var(--space-5)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KATEGORI & DIAGNOSIS</th>
              <th style={{ padding: 'var(--space-4) var(--space-5)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SNIPPET KONTEN</th>
              <th style={{ padding: 'var(--space-4) var(--space-5)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>TINGKAT / STATUS</th>
              <th style={{ padding: 'var(--space-4) var(--space-5)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>OPSI</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const scoreColor = record.validationScore >= 80 ? 'var(--color-success-700)' : record.validationScore >= 50 ? 'var(--color-warning-700)' : 'var(--color-danger-700)';
              const scoreBg = record.validationScore >= 80 ? 'var(--color-success-50)' : record.validationScore >= 50 ? 'var(--color-warning-50)' : 'var(--color-danger-50)';
              const isWarning = record.validationScore < 80;
              
              return (
                <tr key={record.id} onClick={() => onOpen(record.id)} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all var(--transition-fast)' }}>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '0.9rem' }}>{record.patientName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{record.nik}</div>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', verticalAlign: 'top' }}>
                    <div style={{ display: 'inline-block', padding: '2px 8px', background: 'var(--color-success-50)', color: 'var(--color-success-700)', border: '1px solid var(--color-success-200)', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', fontWeight: 700, marginBottom: '6px' }}>
                      {record.diagnosisCode}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{record.diagnosisName}</div>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '0.85rem' }}>{record.pathwayName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Biaya: <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{formatRupiah(Number(record.totalFlaggedCost) || 0)}</span> • Tgl: {new Date(record.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', verticalAlign: 'top', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', padding: '4px 12px', background: scoreBg, color: scoreColor, borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      {isWarning ? 'REVIEW' : 'SESUAI'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', verticalAlign: 'top', textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary-600)', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-primary-100)' }}>
                      <Edit2 size={12} style={{ marginRight: '6px', display: 'inline-block' }} /> Detail
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {records.length === 0 && (
          <div className="empty-state" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
            <div className="empty-icon" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-3)', display: 'flex', justifyContent: 'center' }}><Inbox size={48} /></div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Belum ada history</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Data clinical pathway yang telah dianalisis akan muncul di sini.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Menampilkan halaman <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> dari <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => onPageChange(page - 1)} 
                disabled={page <= 1}
                style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, background: 'var(--bg-surface)' }}
              >
                <ChevronLeft size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} /> Prev
              </button>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => onPageChange(page + 1)} 
                disabled={page >= totalPages}
                style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, background: 'var(--bg-surface)' }}
              >
                Next <ChevronRight size={16} style={{ marginLeft: '6px', verticalAlign: 'text-bottom' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}



function BrainAiLoading() {
  const stages = [
    'Membaca form klinis',
    'Validasi diagnosis, tindakan, dan obat',
    'Mencocokkan master data lokal',
    'Menyusun visual clinical pathway',
  ]

  return (
    <div className="brain-loading-backdrop" role="status" aria-live="polite" aria-label="Brain AI sedang memproses clinical pathway">
      <div className="brain-loading-card">
        <div className="brain-loading-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <div className="brain-loading-kicker">Brain AI sedang bekerja</div>
          <h2>Memproses clinical pathway dan validasi master data</h2>
          <p>
            Sistem sedang menganalisis data pasien, diagnosis, tindakan, obat, biaya,
            dan master data untuk membuat summary visual yang siap direview klinisi.
          </p>
        </div>
        <div className="brain-loading-progress">
          <div />
        </div>
        <div className="brain-loading-steps">
          {stages.map((stage) => (
            <div key={stage} className="brain-loading-step">
              <span />
              {stage}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

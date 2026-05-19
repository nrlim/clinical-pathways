'use client'

import { useState, useMemo } from 'react'
import { PatientSectionForm, EncounterSectionForm } from '@/components/pathway/PatientEncounterSections'
import { DiagnosisSectionForm, ProcedureSectionForm, MedicationSectionForm, InpatientJustificationForm } from '@/components/pathway/ClinicalSections'
import { AiClinicalPathwayReport, OutcomeSectionForm, SummaryPanel } from '@/components/pathway/OutcomeSummary'
import { MasterDataCrosscheck } from '@/components/pathway/MasterDataCrosscheck'
import { MasterDataPanel } from '@/components/master-data/MasterDataPanel'
import { computeSummary } from '@/lib/pathway-utils'
import type { ClinicalPathwayForm, ClinicalMasterData, AiSummaryFeed } from '@/types/clinical-pathway'
import type { AiClinicalPathwayBrainOutput, AiClinicalPathwayResponse } from '@/types/ai-clinical-pathway'

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

  async function handleSubmit() {
    setIsSubmitting(true)
    setSubmitMessage('')
    try {
      const response = await fetch('/api/ai/clinical-pathway-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, summary, masterData }),
      })
      const payload = await response.json() as { brain?: AiClinicalPathwayResponse; feed?: AiSummaryFeed; message?: string }
      if (!response.ok || !payload.brain) {
        throw new Error(payload.message ?? 'Brain AI gagal membuat clinical pathway.')
      }

      setBrainResponse(payload.brain)
      if (payload.feed) setFeedData(payload.feed)
      setSubmitMessage(`Brain AI berhasil membuat clinical pathway detail dengan model ${payload.brain.model}.`)
      setSubmitted(true)
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'Gagal memanggil Brain AI.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="page-bg" style={{ minHeight: '100vh', padding: 'var(--space-10) 0' }}>
        <div className="page-content">
          <div className="form-card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🧠</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-primary-600)' }}>
              AI Summary Generated
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              {submitMessage}
            </p>
            {brainResponse && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>

                {brainResponse.latencyMs > 0 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: brainResponse.latencyMs < 15000
                      ? 'var(--color-success-100)' : brainResponse.latencyMs < 30000
                      ? 'var(--color-warning-100)' : 'var(--color-danger-100)',
                    border: `1px solid ${brainResponse.latencyMs < 15000
                      ? 'var(--color-success-500)' : brainResponse.latencyMs < 30000
                      ? 'var(--color-warning-500)' : 'var(--color-danger-500)'}`,
                    borderRadius: 'var(--radius-full)', padding: '4px 14px',
                    fontSize: '0.8rem',
                    color: brainResponse.latencyMs < 15000
                      ? 'var(--color-success-700)' : brainResponse.latencyMs < 30000
                      ? 'var(--color-warning-700)' : 'var(--color-danger-700)',
                    fontWeight: 700,
                  }}>
                    ⚡ {(brainResponse.latencyMs / 1000).toFixed(1)}s
                  </span>
                )}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'var(--color-neutral-100)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)', padding: '4px 14px',
                  fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500,
                }}>
                  🕐 {new Date(brainResponse.generatedAt).toLocaleString('id-ID')}
                </span>
              </div>
            )}
            
            <div style={{ textAlign: 'left', marginBottom: 'var(--space-8)' }}>
              
              <div className="summary-tabs-container">
                <div className="summary-tabs">
                  <button 
                    className={`summary-tab ${summaryTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setSummaryTab('summary')}
                  >
                    <span className="summary-tab-icon">📊</span> Ringkasan Validasi
                  </button>
                  <button 
                    className={`summary-tab ${summaryTab === 'crosscheck' ? 'active' : ''}`}
                    onClick={() => setSummaryTab('crosscheck')}
                  >
                    <span className="summary-tab-icon">📋</span> Master Data Crosscheck
                  </button>
                  <button 
                    className={`summary-tab ${summaryTab === 'clinical' ? 'active' : ''}`}
                    onClick={() => setSummaryTab('clinical')}
                  >
                    <span className="summary-tab-icon">🧠</span> Clinical Insight & Plan
                  </button>
                </div>
              </div>

              {summaryTab === 'summary' && (
                <div className="fade-in">
                  <SummaryPanel summary={summary} brainResult={brainResponse?.result} />
                </div>
              )}

              {summaryTab === 'crosscheck' && (
                <div className="fade-in">
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
                <div className="fade-in">
                  <AiClinicalPathwayReport result={brainResponse.result} />
                </div>
              )}

            </div>

            <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
              onClick={() => {
                setForm(INITIAL)
                setStep(1)
                setSubmitMessage('')
                setBrainResponse(null)
                setSubmitted(false)
                setSummaryTab('summary')
              }}>
              + Input Pathway Baru
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-bg">
      {/* Header */}
      <header className="page-header">
        <div className="page-header-brand">
          <div className="brand-logo">CP</div>
          <div>
            <div className="brand-name">Clinical Pathway</div>
            <div className="brand-sub">Master Data Integration</div>
          </div>
        </div>
        <div className="page-header-actions">
          <button type="button" className={`header-tab ${view === 'form' ? 'active' : ''}`} onClick={() => setView('form')}>Input Form</button>
          <button type="button" className={`header-tab ${view === 'history' ? 'active' : ''}`} onClick={() => { setView('history'); void loadHistoryRecords() }}>Clinical Pathways</button>
          <button type="button" className={`header-tab ${view === 'master-data' ? 'active' : ''}`} onClick={() => setView('master-data')}>Master Data</button>
        </div>
      </header>

      <div className="page-content">
        {view === 'history' && (
          <HistoryPanel 
            records={historyRecords} 
            message={recordsMessage} 
            onOpen={openSavedClinicalPathway} 
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
          <>
        {/* Title */}
        <div className="page-title-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1>Input Clinical Pathway</h1>
            <p>
              Digitalisasi rekam medis dengan validasi tindakan, obat, rawat inap terhadap diagnosa.
            </p>
          </div>
          <div>
            <label className="btn btn-ghost" style={{ cursor: 'pointer', border: '1px dashed var(--color-primary-500)', color: 'var(--color-primary-600)', background: 'var(--color-primary-50)' }}>
              📥 Import Sample JSON
              <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        <div className="ocr-banner" style={{ marginTop: '0', marginBottom: 'var(--space-8)' }}>
            <div>
              <div className="ocr-banner-title">Feed AI Summary dari Master Data</div>
              <div className="ocr-banner-desc">
                Data form akan dikemas sebagai feed terstruktur untuk AI summary dan resource AI validator.
              </div>
            </div>
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
        <form onSubmit={e => { e.preventDefault(); if (step < 7) setStep(s => s + 1) }}>
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

          {/* Navigation */}
          <div className="form-nav">
            <button type="button" className="btn btn-ghost"
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}>
              ← Sebelumnya
            </button>
            <span className="step-indicator">Langkah {step} dari {STEPS.length}</span>
            {step < 7 ? (
              <button type="submit" className="btn btn-primary">
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
        </form>
          </>
        )}
      </div>
      {isSubmitting && <BrainAiLoading />}
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
  const formatRupiah = (val: string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  }

  return (
    <section className="records-panel" style={{ width: '100%' }}>
      <div className="page-title-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'inline-block', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
            Database Penyimpanan Klinis
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-2)', letterSpacing: '-0.02em' }}>
            History Clinical Pathways
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '800px' }}>
            Daftar hasil analisis Brain AI yang tersimpan. Buka kembali pathway untuk melihat detail evaluasi klinis, crosscheck master data, dan justifikasi rawat inap.
          </p>
        </div>
      </div>
      
      <div className="records-controls" style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <form 
          style={{ display: 'flex', gap: 'var(--space-2)', flex: '1 1 300px' }}
          onSubmit={(e) => { e.preventDefault(); onSearchSubmit(); }}
        >
          <input 
            type="text" 
            className="form-input" 
            placeholder="Cari NIK, Pasien, atau Pathway..." 
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ margin: 0, flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 var(--space-4)' }}>Cari</button>
        </form>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Urutkan:</span>
          <select 
            className="form-select" 
            value={sort} 
            onChange={(e) => onSortChange(e.target.value)}
            style={{ margin: 0, minWidth: '180px' }}
          >
            <option value="createdAt_desc">Terbaru</option>
            <option value="createdAt_asc">Terlama</option>
            <option value="score_desc">Score (Tinggi - Rendah)</option>
            <option value="score_asc">Score (Rendah - Tinggi)</option>
          </select>
        </div>
      </div>

      {message && <div className="records-alert" style={{ marginBottom: 'var(--space-6)' }}>{message}</div>}
      
      <div className="modern-records-list">
        {records.map((record) => {
          const scoreColor = record.validationScore >= 80 ? 'var(--color-success-500)' : record.validationScore >= 50 ? 'var(--color-warning-500)' : 'var(--color-danger-500)';
          
          return (
            <article key={record.id} className="modern-record-card" onClick={() => onOpen(record.id)}>
              <div className="modern-record-header">
                <div className="modern-record-patient">
                  <div className="avatar">{record.patientName.charAt(0).toUpperCase()}</div>
                  <div className="patient-info">
                    <div className="patient-name">{record.patientName}</div>
                    <div className="patient-ids">
                      <span>NIK: {record.nik}</span>
                      {record.mrNumber && <span> • MRN: {record.mrNumber}</span>}
                    </div>
                  </div>
                </div>
                <div className="modern-record-score" style={{ color: scoreColor }}>
                  <div className="score-value">{record.validationScore}</div>
                  <div className="score-label">Score</div>
                </div>
              </div>

              <div className="modern-record-body">
                <div className="pathway-info">
                  <div className="pathway-name">{record.pathwayName}</div>
                  <div className="diagnosis-info">
                    <span className="diag-code">{record.diagnosisCode}</span>
                    <span className="diag-name">{record.diagnosisName}</span>
                  </div>
                </div>
                
                <div className="modern-record-meta">
                  <div className="meta-item">
                    <span className="meta-label">Status</span>
                    <span className={`status-badge ${record.overallStatus === 'sesuai' ? 'success' : record.overallStatus.includes('review') ? 'warning' : 'danger'}`}>
                      {record.overallStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Flagged Cost</span>
                    <span className="meta-value cost">{formatRupiah(record.totalFlaggedCost)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Dibuat</span>
                    <span className="meta-value date">{new Date(record.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              <div className="modern-record-footer" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-primary btn-sm">Lihat Detail →</button>
              </div>
            </article>
          )
        })}
        
        {records.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Belum ada history</h3>
            <p>Data clinical pathway yang telah dianalisis akan muncul di sini.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => onPageChange(page - 1)} 
            disabled={page <= 1}
          >
            &laquo; Prev
          </button>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Halaman {page} dari {totalPages}
          </span>
          <button 
            className="btn btn-outline" 
            onClick={() => onPageChange(page + 1)} 
            disabled={page >= totalPages}
          >
            Next &raquo;
          </button>
        </div>
      )}
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

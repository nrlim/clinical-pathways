'use client'

import { SectionHeader } from '@/components/ui/PathwayPrimitives'
import { formatRupiah } from '@/lib/pathway-utils'
import type { OutcomeSection, PathwaySummary } from '@/types/clinical-pathway'
import type { AiClinicalPathwayBrainOutput, AiValidationStatus } from '@/types/ai-clinical-pathway'

// ─── Section 7: Outcome ────────────────────────────────────
export function OutcomeSectionForm({
  data, onChange,
}: {
  data: OutcomeSection
  onChange: (field: keyof OutcomeSection, value: string) => void
}) {
  return (
    <div className="form-card">
      <SectionHeader icon="OC" iconColor="cyan"
        title="Outcome & Catatan Klinis"
        desc="Hasil akhir episode, rencana tindak lanjut, dan varians dari pathway standar"
      />
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Outcome Pasien <span className="required">*</span></label>
          <select className="form-select" value={data.outcome}
            onChange={e => onChange('outcome', e.target.value)} required>
            <option value="">Pilih outcome...</option>
            <option value="improved">Membaik / Sembuh</option>
            <option value="referred">Dirujuk ke Faskes Lain</option>
            <option value="deceased">Meninggal Dunia</option>
            <option value="dama">DAMA (Pulang Atas Permintaan)</option>
            <option value="ongoing">Masih dalam Perawatan</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Risiko Readmisi</label>
          <select className="form-select" value={data.readmission_risk}
            onChange={e => onChange('readmission_risk', e.target.value)}>
            <option value="">Pilih tingkat risiko...</option>
            <option value="rendah">Rendah (&lt;30 hari)</option>
            <option value="sedang">Sedang (30–90 hari)</option>
            <option value="tinggi">Tinggi (&gt;90 hari)</option>
          </select>
        </div>
        <div className="form-group col-span-2">
          <label className="form-label">Varians Pathway</label>
          <input className="form-input"
            placeholder="Deviasi dari clinical pathway standar yang terjadi selama perawatan"
            value={data.pathway_variance}
            onChange={e => onChange('pathway_variance', e.target.value)} />
        </div>
        <div className="form-group col-span-2">
          <label className="form-label">Rencana Tindak Lanjut (Follow-Up)</label>
          <textarea className="form-textarea"
            placeholder="Rencana kontrol, terapi lanjutan, atau rujukan..."
            value={data.follow_up_plan}
            onChange={e => onChange('follow_up_plan', e.target.value)} />
        </div>
        <div className="form-group col-span-2">
          <label className="form-label">Edukasi Pasien</label>
          <textarea className="form-textarea"
            placeholder="Edukasi yang diberikan kepada pasien dan keluarga..."
            value={data.education_given}
            onChange={e => onChange('education_given', e.target.value)} />
        </div>
        <div className="form-group col-span-2">
          <label className="form-label">Catatan Klinis</label>
          <textarea className="form-textarea" style={{ minHeight: '120px' }}
            placeholder="Catatan tambahan dari DPJP mengenai perjalanan klinis pasien..."
            value={data.clinical_notes}
            onChange={e => onChange('clinical_notes', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

// ─── Summary Panel ─────────────────────────────────────────
export function SummaryPanel({
  summary,
  brainResult,
}: {
  summary: PathwaySummary
  brainResult?: AiClinicalPathwayBrainOutput
}) {
  const conformance = (rate: number) =>
    rate >= 80 ? 'sesuai' : rate >= 50 ? 'review' : 'tidak'

  const aiStatusLabel: Record<AiValidationStatus, string> = {
    sesuai: 'Baik',
    perlu_review: 'Perlu Review',
    tidak_sesuai: 'Tidak Sesuai',
    data_kurang: 'Data Kurang',
  }

  const aiStatusBadge: Record<AiValidationStatus, string> = {
    sesuai: 'sesuai',
    perlu_review: 'review',
    tidak_sesuai: 'tidak',
    data_kurang: 'review',
  }

  const hasAi = !!brainResult
  const db = brainResult?.validationDashboard
  const totalItems = hasAi && db ? db.passedCount + db.reviewCount + db.failedCount : 0
  const aiPassRate = totalItems > 0 ? Math.round((db!.passedCount / totalItems) * 100) : 0

  return (
    <div className="form-card" style={{ background: 'var(--bg-elevated)' }}>
      <SectionHeader icon="SM" iconColor="blue"
        title="Ringkasan Clinical Pathway"
        desc={
          hasAi
            ? 'Hasil validasi item-by-item dari Brain AI — mencerminkan analisis tindakan dan obat secara akurat'
            : 'Kalkulasi otomatis biaya, LOS, dan kesesuaian berdasarkan input form (belum divalidasi AI)'
        }
      />

      {/* Source tag */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
          background: hasAi ? 'var(--color-primary-50)' : 'var(--color-neutral-100)',
          border: `1px solid ${hasAi ? 'var(--color-primary-100)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-full)',
          color: hasAi ? 'var(--color-primary-700)' : 'var(--text-muted)',
          fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px',
        }}>
          {hasAi ? '🧠 Data dari Brain AI' : '📋 Data dari Input Form'}
        </span>
      </div>

      {/* Cost + LOS stats */}
      <div className="summary-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="summary-card">
          <div className="summary-value">{formatRupiah(summary.totalProcedureCost)}</div>
          <div className="summary-label">Total Biaya Tindakan</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{formatRupiah(summary.totalMedicationCost)}</div>
          <div className="summary-label">Total Biaya Obat</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{formatRupiah(summary.totalCost)}</div>
          <div className="summary-label">Total Biaya Episode</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">
            {summary.actualLOS !== null ? `${summary.actualLOS} hari` : '—'}
          </div>
          <div className="summary-label">Aktual LOS</div>
        </div>

        {/* AI-derived or form-computed validation counts */}
        {hasAi && db ? (
          <>
            <div className="summary-card" style={{ borderColor: 'var(--color-success-500)' }}>
              <div className="summary-value" style={{ color: 'var(--color-success-500)' }}>{db.passedCount}</div>
              <div className="summary-label">Item Sesuai (AI)</div>
            </div>
            <div className="summary-card" style={{ borderColor: db.failedCount > 0 ? 'var(--color-danger-500)' : 'var(--color-warning-500)' }}>
              <div className="summary-value" style={{ color: db.failedCount > 0 ? 'var(--color-danger-500)' : 'var(--color-warning-500)' }}>
                {db.reviewCount + db.failedCount}
              </div>
              <div className="summary-label">Perlu Review / Tidak Sesuai</div>
            </div>
          </>
        ) : (
          <>
            <div className="summary-card">
              <div className="summary-value">{summary.procedureConformanceRate}%</div>
              <div className="summary-label">Kesesuaian Tindakan</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{summary.medicationConformanceRate}%</div>
              <div className="summary-label">Kesesuaian Obat</div>
            </div>
          </>
        )}
      </div>

      {/* AI Validation Score bar */}
      {hasAi && db && (
        <div style={{
          background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Validation Score Brain AI</span>
            <span style={{
              fontSize: '1.25rem', fontWeight: 700,
              color: db.score >= 80 ? 'var(--color-success-500)' : db.score >= 50 ? 'var(--color-warning-500)' : 'var(--color-danger-500)',
            }}>{db.score} / 100</span>
          </div>
          <div style={{ background: 'var(--color-neutral-200)', borderRadius: 'var(--radius-full)', height: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.max(0, Math.min(100, db.score))}%`,
              background: db.score >= 80
                ? 'linear-gradient(90deg, var(--color-success-500), var(--color-primary-500))'
                : db.score >= 50
                ? 'linear-gradient(90deg, var(--color-warning-500), var(--color-accent-400))'
                : 'linear-gradient(90deg, var(--color-danger-500), var(--color-accent-400))',
              borderRadius: 'inherit', height: '100%',
              transition: 'width 600ms ease',
            }} />
          </div>
          {db.totalFlaggedCost > 0 && (
            <div style={{ marginTop: 'var(--space-3)', fontSize: '0.82rem', color: 'var(--color-danger-500)', fontWeight: 600 }}>
              ⚠ {formatRupiah(db.totalFlaggedCost)} perlu ditinjau (item tidak sesuai / perlu review)
            </div>
          )}
        </div>
      )}

      {/* Conformance breakdown */}
      <div style={{ marginBottom: 'var(--space-2)' }}>
        <label className="form-label" style={{ display: 'block', marginBottom: 'var(--space-4)' }}>
          Evaluasi Kesesuaian
          {hasAi && <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>(dari validasi AI per item)</span>}
        </label>
        <div className="conformance-breakdown">
          {hasAi && db ? (
            <>
              <div className="conformance-row">
                <span className="conformance-row-label">Tindakan &amp; Obat sesuai diagnosa</span>
                <div className="conformance-row-stat">
                  <span>{db.passedCount} dari {totalItems} item</span>
                  <span className={`conformance-badge ${conformance(aiPassRate)}`}>
                    {aiPassRate}% {aiPassRate >= 80 ? 'Baik' : aiPassRate >= 50 ? 'Perlu Review' : 'Tidak Sesuai'}
                  </span>
                </div>
              </div>
              <div className="conformance-row">
                <span className="conformance-row-label">Item perlu review</span>
                <div className="conformance-row-stat">
                  <span>{db.reviewCount} item</span>
                  <span className={`conformance-badge ${db.reviewCount > 0 ? 'review' : 'sesuai'}`}>
                    {db.reviewCount > 0 ? 'Ada Item Review' : 'Tidak Ada'}
                  </span>
                </div>
              </div>
              <div className="conformance-row">
                <span className="conformance-row-label">Item tidak sesuai diagnosa</span>
                <div className="conformance-row-stat">
                  <span>{db.failedCount} item</span>
                  <span className={`conformance-badge ${db.failedCount > 0 ? 'tidak' : 'sesuai'}`}>
                    {db.failedCount > 0 ? 'Ada Ketidaksesuaian' : 'Tidak Ada'}
                  </span>
                </div>
              </div>
              <div className="conformance-row">
                <span className="conformance-row-label">Status keseluruhan AI</span>
                <div className="conformance-row-stat">
                  <span className={`conformance-badge ${aiStatusBadge[db.overallStatus]}`}>
                    {aiStatusLabel[db.overallStatus]}
                  </span>
                </div>
              </div>
              <div className="conformance-row">
                <span className="conformance-row-label">Rawat inap sesuai indikasi</span>
                <div className="conformance-row-stat">
                  <span className={`conformance-badge ${summary.inpatientJustified === true ? 'sesuai' : summary.inpatientJustified === false ? 'tidak' : 'review'}`}>
                    {summary.inpatientJustified === true ? 'Sesuai Indikasi'
                      : summary.inpatientJustified === false ? 'Tidak Sesuai'
                      : 'Belum Dinilai'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="conformance-row">
                <span className="conformance-row-label">Tindakan sesuai diagnosa</span>
                <div className="conformance-row-stat">
                  <span>{summary.procedureConformanceRate}%</span>
                  <span className={`conformance-badge ${conformance(summary.procedureConformanceRate)}`}>
                    {summary.procedureConformanceRate >= 80 ? 'Baik'
                      : summary.procedureConformanceRate >= 50 ? 'Perlu Review' : 'Tidak Sesuai'}
                  </span>
                </div>
              </div>
              <div className="conformance-row">
                <span className="conformance-row-label">Obat sesuai diagnosa</span>
                <div className="conformance-row-stat">
                  <span>{summary.medicationConformanceRate}%</span>
                  <span className={`conformance-badge ${conformance(summary.medicationConformanceRate)}`}>
                    {summary.medicationConformanceRate >= 80 ? 'Baik'
                      : summary.medicationConformanceRate >= 50 ? 'Perlu Review' : 'Tidak Sesuai'}
                  </span>
                </div>
              </div>
              <div className="conformance-row">
                <span className="conformance-row-label">Rawat inap sesuai indikasi</span>
                <div className="conformance-row-stat">
                  <span className={`conformance-badge ${summary.inpatientJustified === true ? 'sesuai' : summary.inpatientJustified === false ? 'tidak' : 'review'}`}>
                    {summary.inpatientJustified === true ? 'Sesuai Indikasi'
                      : summary.inpatientJustified === false ? 'Tidak Sesuai'
                      : 'Belum Dinilai'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function AiClinicalPathwayReport({ result }: { result: AiClinicalPathwayBrainOutput }) {
  return (
    <div className="form-card ai-report-card">
      <SectionHeader icon="AI" iconColor="violet"
        title="Brain AI Clinical Pathway"
        desc="Clinical pathway, risiko, varians, dan summary multidisiplin dari SumoPod AI"
      />

      <div className="ai-report-section ai-report-hero">
        <div className="ai-kicker">{result.pathwayName}</div>
        <h3>{result.executiveSummary}</h3>
        <p>{result.clinicalSynopsis}</p>
      </div>

      <AiVisualSnapshot result={result} />

      <div className="ai-report-grid ai-reason-grid">
        <article className="ai-report-section reason-card">
          <h4>Assessment Kerja</h4>
          <p>{result.workingAssessment}</p>
        </article>
        <article className="ai-report-section reason-card">
          <h4>Reasoning Validasi</h4>
          <div className="reason-stack">
            <ReasonPill label="Tindakan" text={result.conformanceAnalysis.diagnosisProcedureFit} />
            <ReasonPill label="Obat" text={result.conformanceAnalysis.diagnosisMedicationFit} />
            <ReasonPill label="Rawat inap" text={result.conformanceAnalysis.inpatientJustification} />
            <ReasonPill label="LOS" text={result.conformanceAnalysis.losAssessment} />
            <ReasonPill label="Biaya" text={result.conformanceAnalysis.costSignal} />
          </div>
        </article>
      </div>

      <AiValidationBoard result={result} />

      <div className="ai-report-section">
        <h4>Tujuan Perawatan</h4>
        <div className="ai-chip-list">
          {result.careGoals.map((goal) => <span key={goal} className="ai-chip">{goal}</span>)}
        </div>
      </div>

      <div className="ai-report-section" style={{ marginTop: 'var(--space-8)' }}>
        <h4 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>Clinical Pathway (Day-by-Day Timeline)</h4>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>Alur perawatan klinis berurutan yang direkomendasikan berdasarkan standar dan kondisi pasien.</p>
        <div className="ai-timeline">
          {result.dayByDayPlan.map((plan) => (
            <article key={`${plan.day}-${plan.focus}`} className="ai-day-card">
              <div className="ai-day-header">
                <span className="ai-day-badge">{plan.day}</span>
                <h5 className="ai-day-focus">{plan.focus}</h5>
              </div>
              <div className="ai-day-grid">
                <AiPathwayBox icon="🩺" title="Assessment" items={plan.assessments} />
                <AiPathwayBox icon="⚕️" title="Intervensi" items={plan.interventions} />
                <AiPathwayBox icon="💊" title="Obat" items={plan.medicationConsiderations} />
                <AiPathwayBox icon="📊" title="Monitoring" items={plan.monitoring} />
                <AiPathwayBox icon="✅" title="Kriteria Pulang" items={plan.dischargeCriteria} />
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="ai-report-grid visual-card-grid">
        <article className="ai-report-section visual-risk-panel">
          <h4>Peta Risiko Klinis</h4>
          <div className="risk-lane">
            {result.riskStratification.map((risk) => (
              <div key={`${risk.level}-${risk.issue}`} className={`risk-tile ${risk.level}`}>
                <div className="risk-level">{risk.level}</div>
                <strong>{risk.issue}</strong>
                <p>{risk.rationale}</p>
                <span>{risk.recommendedAction}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="ai-report-section visual-risk-panel">
          <h4>Varians Pathway</h4>
          <div className="variance-map">
            {result.pathwayVariances.map((variance) => (
              <div key={`${variance.area}-${variance.observedVariance}`} className="variance-node">
                <div className="variance-area">{variance.area}</div>
                <strong>{variance.observedVariance}</strong>
                <p>{variance.potentialImpact}</p>
                <span>{variance.recommendedFollowUp}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="ai-report-section discharge-board">
        <div className="discharge-status-card">
          <span>Status Pulang</span>
          <strong>{result.dischargeReadiness.status.replaceAll('_', ' ')}</strong>
        </div>
        <div className="discharge-content">
          <AiList title="Kriteria terpenuhi" items={result.dischargeReadiness.criteriaMet} />
          <AiList title="Blocker" items={result.dischargeReadiness.blockers} />
          <div className="mini-summary-card"><strong>Follow-up</strong><p>{result.dischargeReadiness.followUpPlan}</p></div>
          <div className="mini-summary-card"><strong>Edukasi</strong><p>{result.dischargeReadiness.patientEducation}</p></div>
        </div>
      </div>

      <div className="audience-summary-board">
        <AudienceCard label="Klinisi" accent="green" text={result.aiSummaryForClinician} />
        <AudienceCard label="Coder / Klaim" accent="amber" text={result.aiSummaryForCoder} />
        <AudienceCard label="Pasien" accent="blue" text={result.aiSummaryForPatient} />
        <article className="audience-card internal-card">
          <div className="audience-icon">MD</div>
          <h4>Mapping Master Data</h4>
          <p><strong>Patient:</strong> {result.masterDataMapping.patientReference}</p>
          <AiList title="Resource disarankan" items={result.masterDataMapping.suggestedResources} />
          <AiList title="Master data kurang" items={result.masterDataMapping.missingMasterData} />
        </article>
      </div>

      <div className="ai-report-grid">
        <article className="ai-report-section">
          <h4>Safety Notes</h4>
          <AiList items={result.safetyNotes} />
        </article>
        <article className="ai-report-section">
          <h4>Isu Kualitas Data</h4>
          <AiList items={result.dataQualityIssues} />
        </article>
      </div>
    </div>
  )
}

function AiVisualSnapshot({ result }: { result: AiClinicalPathwayBrainOutput }) {
  const dashboard = result.validationDashboard
  const highRiskCount = result.riskStratification.filter((risk) => risk.level === 'tinggi' || risk.level === 'kritis').length
  const readinessLabel = result.dischargeReadiness.status.replaceAll('_', ' ')

  return (
    <div className="visual-snapshot">
      <div className={`snapshot-score ${dashboard.overallStatus}`}>
        <span>Validation Score</span>
        <strong>{dashboard.score}</strong>
        <div className="score-track"><div style={{ width: `${Math.max(0, Math.min(100, dashboard.score))}%` }} /></div>
      </div>
      <div className="snapshot-card">
        <span>Item ditandai</span>
        <strong>{dashboard.reviewCount + dashboard.failedCount}</strong>
        <p>{formatRupiah(dashboard.totalFlaggedCost)} butuh perhatian</p>
      </div>
      <div className="snapshot-card">
        <span>Risiko tinggi</span>
        <strong>{highRiskCount}</strong>
        <p>Dari {result.riskStratification.length} risiko klinis</p>
      </div>
      <div className="snapshot-card">
        <span>Discharge</span>
        <strong>{readinessLabel}</strong>
        <p>{result.dischargeReadiness.blockers.length} blocker</p>
      </div>
    </div>
  )
}

function ReasonPill({ label, text }: { label: string; text: string }) {
  return (
    <div className="reason-pill">
      <span>{label}</span>
      <p>{text}</p>
    </div>
  )
}

function AudienceCard({ label, accent, text }: { label: string; accent: 'green' | 'amber' | 'blue'; text: string }) {
  return (
    <article className={`audience-card ${accent}`}>
      <div className="audience-icon">{label.slice(0, 2).toUpperCase()}</div>
      <h4>{label}</h4>
      <p>{text}</p>
    </article>
  )
}

function AiValidationBoard({ result }: { result: AiClinicalPathwayBrainOutput }) {
  const dashboard = result.validationDashboard
  const statusLabel = {
    sesuai: 'Sesuai',
    tidak_sesuai: 'Tidak sesuai',
    perlu_review: 'Perlu review',
    data_kurang: 'Data kurang',
  }

  return (
    <div className="ai-report-section validation-board">
      <div className="validation-header">
        <div>
          <h4>Validasi Tindakan & Obat terhadap Diagnosis</h4>
          <p>Menandai item yang tidak sesuai, perlu review master data/formularium, dan nilai biaya terdampak.</p>
        </div>
        <div className={`validation-score ${dashboard.overallStatus}`}>
          <strong>{dashboard.score}</strong>
          <span>{statusLabel[dashboard.overallStatus]}</span>
        </div>
      </div>

      <div className="validation-metrics">
        <div><strong>{dashboard.passedCount}</strong><span>Sesuai</span></div>
        <div><strong>{dashboard.reviewCount}</strong><span>Review</span></div>
        <div><strong>{dashboard.failedCount}</strong><span>Tidak sesuai</span></div>
        <div><strong>{formatRupiah(dashboard.totalFlaggedCost)}</strong><span>Biaya ditandai</span></div>
      </div>

      <div className="ai-chip-list validation-findings">
        {dashboard.quickFindings.map((finding) => <span key={finding} className="ai-chip">{finding}</span>)}
      </div>

      <div className="validation-item-grid">
        {dashboard.validatedItems.map((item) => (
          <article key={`${item.type}-${item.id}`} className={`validation-item ${item.status}`}>
            <div className="validation-item-top">
              <span className="validation-type">{item.type === 'procedure' ? 'Tindakan' : 'Obat'}</span>
              <span className={`validation-status ${item.status}`}>{statusLabel[item.status]}</span>
            </div>
            <h5>{item.name || item.code || 'Item tanpa nama'}</h5>
            <div className="validation-code">Kode: {item.code || '—'} · ID: {item.id || '—'}</div>
            <div className="validation-price">
              <strong>{formatRupiah(item.totalCost)}</strong>
              <span>{formatRupiah(item.unitCost)} × {item.quantity}</span>
            </div>
            <p><strong>Relasi diagnosis:</strong> {item.diagnosisRelation}</p>
            <p><strong>Master Data:</strong> {item.masterDataValidation}</p>
            <p><strong>Harga:</strong> {item.priceAssessment}</p>
            <p><strong>Catatan:</strong> {item.issue}</p>
            <span className="validation-action">{item.recommendedAction}</span>
          </article>
        ))}
      </div>
    </div>
  )
}

function AiList({ title, items }: { title?: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="ai-list-block">
      {title && <span>{title}</span>}
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  )
}

function AiPathwayBox({ icon, title, items }: { icon: string; title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="ai-pathway-box">
      <div className="ai-pathway-box-header">
        <span className="ai-pathway-box-icon">{icon}</span>
        <span>{title}</span>
      </div>
      <ul className="ai-pathway-list">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { SectionHeader } from '@/components/ui/PathwayPrimitives'
import { BrainCircuit, ClipboardCheck, AlertTriangle, Stethoscope, Activity, Pill, BarChart2, CheckCircle2, DollarSign, CalendarDays, ShieldCheck, FileWarning, Database, Info } from 'lucide-react'
import { formatRupiah } from '@/lib/pathway-utils'
import type { OutcomeSection, PathwaySummary, AiSummaryFeed, SupportingDocument } from '@/types/clinical-pathway'
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
            placeholder="Deviasi dari SnapPath standar yang terjadi selama perawatan"
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

// ─── Score Donut SVG Gauge ──────────────────────────────────
export function ScoreCircularGauge({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = size * 0.08
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  let color = 'var(--color-primary-500)'
  let glow = 'rgba(20, 184, 166, 0.25)'
  if (score < 50) {
    color = 'var(--color-danger-500)'
    glow = 'rgba(239, 68, 68, 0.25)'
  } else if (score < 80) {
    color = 'var(--color-warning-500)'
    glow = 'rgba(245, 158, 11, 0.25)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', filter: `drop-shadow(0 4px 6px ${glow})` }}>
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Foreground Indicator */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
        />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: `${size * 0.23}px`, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: `${size * 0.08}px`, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Score</span>
      </div>
    </div>
  )
}

// ─── ConformanceRow helper ──────────────────────────────────
function ConformanceRow({ label, value, badge, badgeLabel }: { label: string; value: string; badge: string; badgeLabel: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px var(--space-4)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
      <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
        {value && <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>}
        <span className={`conformance-badge ${badge}`}>{badgeLabel}</span>
      </div>
    </div>
  )
}

// ─── Summary Panel ─────────────────────────────────────────
export function SummaryPanel({
  summary,
  brainResult,
  aiFeed,
}: {
  summary: PathwaySummary
  brainResult?: AiClinicalPathwayBrainOutput
  aiFeed?: AiSummaryFeed
}) {
  const [showScoreInfo, setShowScoreInfo] = useState(false)
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

  // Data Coverage / Read Accuracy
  const dataAccuracy = aiFeed?.masterDataValidation?.summary?.coverageRate ?? 0

  // Use AI's evaluated LOS if AI data exists, otherwise fallback to form summary
  const expectedLOSVal = db?.expectedLos != null ? db.expectedLos : summary.expectedLOS
  const actualLOSVal = db?.actualLos != null ? db.actualLos : summary.actualLOS

  const underChargeRate = expectedLOSVal != null && actualLOSVal != null && expectedLOSVal > 0
    ? Math.max(0, ((expectedLOSVal - actualLOSVal) / expectedLOSVal) * 100)
    : null
  const overChargeRate = expectedLOSVal != null && actualLOSVal != null && expectedLOSVal > 0
    ? Math.max(0, ((actualLOSVal - expectedLOSVal) / expectedLOSVal) * 100)
    : null
  const isOverCharge = actualLOSVal != null && expectedLOSVal != null
    ? actualLOSVal > expectedLOSVal
    : false

  return (
    <div className="form-card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
      <SectionHeader icon="SM" iconColor="blue"
        title="Ringkasan SnapPath"
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
          background: hasAi ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${hasAi ? 'var(--color-primary-500)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-full)',
          color: hasAi ? 'var(--color-primary-500)' : 'var(--text-secondary)',
          fontSize: '0.75rem', fontWeight: 700, padding: '3px 12px',
        }}>
          {hasAi ? <><BrainCircuit size={14} /> Data dari Brain AI</> : <><ClipboardCheck size={14} /> Data dari Input Form</>}
        </span>
      </div>

      {/* ── ZONE 1: Hero Score Banner (only when AI data exists) ── */}
      {hasAi && db && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          gap: 'var(--space-6)',
          background: 'linear-gradient(135deg, var(--bg-base) 0%, rgba(20,184,166,0.04) 100%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          marginBottom: 'var(--space-6)',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            <ScoreCircularGauge score={db.score} size={110} />
            <span className={`status-badge ${aiStatusBadge[db.overallStatus]}`} style={{ fontSize: '0.75rem', padding: '4px 14px' }}>
              {aiStatusLabel[db.overallStatus]}
            </span>
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '6px' }}>Validation Score</p>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '10px' }}>
              {db.score}<span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>/100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                {db.passedCount} dari {totalItems} item obat/tindakan lolos secara deterministik berdasarkan parameter master data lokal, konfirmasi dokter, dan threshold harga. Tingkat validitas: <strong style={{ color: 'var(--text-primary)' }}>{aiPassRate}%</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowScoreInfo(!showScoreInfo)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: showScoreInfo ? 'var(--color-primary-500)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                title="Info AI Score"
              >
                <Info size={16} />
              </button>
            </div>

            {showScoreInfo && (
              <div className="fade-in animate-in" style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Parameter Scoring Deterministik:</strong>
                <span>1. Keaktifan di Master Data Lokal</span>
                <span>2. Konfirmasi Manual Dokter</span>
                <span>3. Toleransi Threshold Harga</span>
                <span style={{ fontStyle: 'italic', opacity: 0.8 }}>(Opini obyektif AI tidak memengaruhi skor ini)</span>
              </div>
            )}
            {db.totalFlaggedCost > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', padding: '5px 12px', fontSize: '0.82rem', color: 'var(--color-danger-500)', fontWeight: 700 }}>
                <AlertTriangle size={14} /> {formatRupiah(db.totalFlaggedCost)} perlu ditinjau
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ZONE 2: Cost & LOS KPIs — fixed strip ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>Ringkasan Biaya &amp; Durasi</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ width: '28px', height: '28px', background: 'rgba(99,102,241,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', flexShrink: 0 }}>
                <Activity size={15} />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tindakan</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{formatRupiah(summary.totalProcedureCost)}</div>
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ width: '28px', height: '28px', background: 'rgba(168,85,247,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', flexShrink: 0 }}>
                <Pill size={15} />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Obat</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{formatRupiah(summary.totalMedicationCost)}</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.12), rgba(20,184,166,0.04))', border: '1px solid var(--color-primary-500)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ width: '28px', height: '28px', background: 'rgba(20,184,166,0.15)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-600)', flexShrink: 0 }}>
                <DollarSign size={15} />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary-700)' }}>Grand Total</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-primary-700)', lineHeight: 1 }}>{formatRupiah(summary.totalCost)}</div>
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ width: '28px', height: '28px', background: 'rgba(245,158,11,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                <CalendarDays size={15} />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Aktual LOS</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {actualLOSVal !== null ? `${actualLOSVal} hari` : '—'}
            </div>
          </div>
        </div>

        {/* ── Undercharge / Overcharge Tag ── */}
        {expectedLOSVal != null && actualLOSVal != null && expectedLOSVal !== actualLOSVal && (
          <div style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: isOverCharge ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: `1px solid ${isOverCharge ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
            color: isOverCharge ? 'var(--color-danger-600)' : 'var(--color-warning-600)'
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 800 }}>{isOverCharge ? '↑' : '↓'}</span>
            <span>{isOverCharge ? 'Overstay LOS' : 'Understay LOS'}</span>
            <strong style={{ fontSize: '0.85rem' }}>{isOverCharge ? overChargeRate?.toFixed(1) : underChargeRate?.toFixed(1)}%</strong>
            <span style={{ fontSize: '0.75rem', opacity: 0.75, marginLeft: '4px' }}>(Aktual {actualLOSVal}h vs Standar {expectedLOSVal}h)</span>
          </div>
        )}
      </div>

      {/* ── ZONE 3: Conformance Breakdown — clean checklist rows ── */}
      <div>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>Evaluasi Kesesuaian Klinis</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {hasAi && db ? (
            <>
              <ConformanceRow label="Tindakan & Obat sesuai diagnosa" value={`${db.passedCount} dari ${totalItems} item`} badge={aiPassRate >= 80 ? 'sesuai' : aiPassRate >= 50 ? 'review' : 'tidak'} badgeLabel={`${aiPassRate}% — ${aiPassRate >= 80 ? 'Baik' : aiPassRate >= 50 ? 'Perlu Review' : 'Tidak Sesuai'}`} />
              <ConformanceRow label="Item perlu review" value={`${db.reviewCount} item`} badge={db.reviewCount > 0 ? 'review' : 'sesuai'} badgeLabel={db.reviewCount > 0 ? 'Ada Item Review' : 'Tidak Ada'} />
              <ConformanceRow label="Item tidak sesuai diagnosa" value={`${db.failedCount} item`} badge={db.failedCount > 0 ? 'tidak' : 'sesuai'} badgeLabel={db.failedCount > 0 ? 'Ada Ketidaksesuaian' : 'Tidak Ada'} />
              <ConformanceRow label="Status keseluruhan AI" value="" badge={aiStatusBadge[db.overallStatus]} badgeLabel={aiStatusLabel[db.overallStatus]} />
              <ConformanceRow label="Rawat inap sesuai indikasi" value="" badge={summary.inpatientJustified === true ? 'sesuai' : summary.inpatientJustified === false ? 'tidak' : 'review'} badgeLabel={summary.inpatientJustified === true ? 'Sesuai Indikasi' : summary.inpatientJustified === false ? 'Tidak Sesuai' : 'Belum Dinilai'} />
            </>
          ) : (
            <>
              <ConformanceRow label="Tindakan sesuai diagnosa" value={`${summary.procedureConformanceRate}%`} badge={conformance(summary.procedureConformanceRate)} badgeLabel={summary.procedureConformanceRate >= 80 ? 'Baik' : summary.procedureConformanceRate >= 50 ? 'Perlu Review' : 'Tidak Sesuai'} />
              <ConformanceRow label="Obat sesuai diagnosa" value={`${summary.medicationConformanceRate}%`} badge={conformance(summary.medicationConformanceRate)} badgeLabel={summary.medicationConformanceRate >= 80 ? 'Baik' : summary.medicationConformanceRate >= 50 ? 'Perlu Review' : 'Tidak Sesuai'} />
              <ConformanceRow label="Rawat inap sesuai indikasi" value="" badge={summary.inpatientJustified === true ? 'sesuai' : summary.inpatientJustified === false ? 'tidak' : 'review'} badgeLabel={summary.inpatientJustified === true ? 'Sesuai Indikasi' : summary.inpatientJustified === false ? 'Tidak Sesuai' : 'Belum Dinilai'} />
            </>
          )}
        </div>
      </div>

      {/* ── ZONE 4: Validasi Berkas & Dokumen Pendukung ── */}
      <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-5)' }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
          Validasi Berkas &amp; Dokumen Pendukung
        </p>
        
        {/* Document list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {(db?.documentVerification || aiFeed?.documents || []).map((doc) => {
            const hasFile = doc.file_name && doc.file_name.trim().length > 0
            
            // Check status styling
            let statusBadgeClass = 'review'
            let statusLabel = 'Belum Diunggah'
            if (hasFile) {
              if (doc.verification_status === 'valid') {
                statusBadgeClass = 'sesuai'
                statusLabel = 'Valid (AI)'
              } else if (doc.verification_status === 'invalid') {
                statusBadgeClass = 'tidak'
                statusLabel = 'Tidak Valid (AI)'
              } else {
                statusBadgeClass = 'sesuai'
                statusLabel = 'Terunggah'
              }
            } else {
              if (doc.required) {
                statusBadgeClass = 'tidak'
                statusLabel = 'Wajib & Hilang'
              } else {
                statusBadgeClass = 'review'
                statusLabel = 'Opsional'
              }
            }

            return (
              <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px var(--space-4)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {doc.name} {doc.required && <span style={{ color: 'var(--color-danger-500)', fontSize: '0.75rem', fontWeight: 600 }}>(Wajib)</span>}
                  </span>
                  {hasFile ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }} title={doc.file_name ?? undefined}>
                      📄 {doc.file_name}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-danger-400)', fontWeight: 500 }}>
                      ⚠️ File belum diunggah
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                  <span className={`conformance-badge ${statusBadgeClass}`} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                    {statusLabel}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Document Status Warning */}
        {hasAi && db && db.documentVerification && (() => {
          const missingCount = db.documentVerification.filter(d => d.required && (!d.file_name || d.file_name.trim().length === 0)).length
          const invalidCount = db.documentVerification.filter(d => d.verification_status === 'invalid').length

          if (missingCount > 0 || invalidCount > 0) {
            return (
              <div style={{
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: 'var(--color-danger-600)'
              }}>
                <AlertTriangle size={15} />
                <span>Status Dokumen: </span>
                <strong style={{ fontSize: '0.85rem' }}>Perlu Dilengkapi / Direviu</strong>
                <span style={{ fontSize: '0.75rem', opacity: 0.75, marginLeft: '4px' }}>(Terdapat {missingCount} berkas wajib hilang &amp; {invalidCount} berkas tidak valid)</span>
              </div>
            )
          }
          return null
        })()}
      </div>
    </div>
  )
}

// ─── SectionLabel: compact emoji + label, no font-size hierarchy abuse ─────
function SectionLabel({ icon, text, desc, color }: { icon: string; text: string; desc?: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.88rem', lineHeight: 1 }}>{icon}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: color || 'var(--text-muted)' }}>{text}</span>
      </div>
      {desc && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, paddingLeft: '24px' }}>{desc}</p>}
    </div>
  )
}

// ─── InfoBlock: list of items in a tinted bordered box ─────────────────────
function InfoBlock({ title, items, accentColor, bgColor }: { title: string; items: string[]; accentColor: string; bgColor: string }) {
  const safeItems = Array.isArray(items) ? items : []
  return (
    <div style={{ background: bgColor, border: `1px solid ${accentColor}30`, borderLeft: `3px solid ${accentColor}`, borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, color: accentColor, marginBottom: '8px' }}>{title}</div>
      {safeItems.length === 0
        ? <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>—</p>
        : <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {safeItems.map((item, i) => <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{item}</li>)}
        </ul>
      }
    </div>
  )
}

export function AiClinicalPathwayReport({ result }: { result: AiClinicalPathwayBrainOutput }) {
  return (
    <div className="form-card ai-report-card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--color-primary-100)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <SectionHeader icon="AI" iconColor="violet"
        title="Brain AI SnapPath"
        desc="Clinical Pathway, Risiko, Varians, dan Summary Multidisiplin dari AI"
      />

      {/* ── 1. Narrative Banner — pathway name + executive summary as prose ── */}
      <div style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.12) 0%, rgba(9,13,24,0.5) 100%)', border: '1px solid rgba(20,184,166,0.25)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-5)', alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary-400)', fontWeight: 700, marginBottom: '8px' }}>{result.pathwayName || 'Pathway Tanpa Nama'}</div>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 12px' }}>{result.executiveSummary || 'Executive summary belum tersedia.'}</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{result.clinicalSynopsis || 'Clinical synopsis belum tersedia.'}</p>
        </div>
        <AiVisualSnapshot result={result} />
      </div>

      {/* ── 2. Working Assessment + Reasoning — side-by-side readable cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        {/* Assessment */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          <SectionLabel icon="🩺" text="Assessment Kerja" />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{result.workingAssessment || 'Belum tersedia.'}</p>
        </div>

        {/* Reasoning Validasi */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          <SectionLabel icon="🔍" text="Reasoning Validasi" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ReasonPill label="Tindakan" text={result.conformanceAnalysis?.diagnosisProcedureFit || 'Belum dinilai'} />
            <ReasonPill label="Obat" text={result.conformanceAnalysis?.diagnosisMedicationFit || 'Belum dinilai'} />
            <ReasonPill label="Rawat Inap" text={result.conformanceAnalysis?.inpatientJustification || 'Belum dinilai'} />
          </div>
        </div>
      </div>

      {/* ── 3. Care Goals — chip list with label ── */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <SectionLabel icon="🎯" text="Tujuan Perawatan" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {Array.isArray(result.careGoals) && result.careGoals.length > 0 ? result.careGoals.map((goal, i) => (
            <span key={i} style={{ fontSize: '0.82rem', background: 'rgba(20,184,166,0.1)', color: 'var(--color-primary-600)', border: '1px solid rgba(20,184,166,0.2)', padding: '5px 14px', borderRadius: 'var(--radius-md)', fontWeight: 600, lineHeight: 1 }}>{goal}</span>
          )) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Tidak ada data tujuan perawatan.</p>
          )}
        </div>
      </div>

      {/* ── 4. Day-by-day Timeline ── */}
      <div>
        <SectionLabel icon="📅" text="Clinical Pathway — Day-by-Day Timeline" desc="Alur perawatan klinis berurutan berdasarkan standar dan kondisi pasien." />
        <div className="ai-timeline">
          {(result.dayByDayPlan || [])
            .filter((plan) =>
              (plan.assessments?.length ?? 0) > 0 ||
              (plan.interventions?.length ?? 0) > 0 ||
              (plan.medicationConsiderations?.length ?? 0) > 0 ||
              (plan.monitoring?.length ?? 0) > 0 ||
              (plan.dischargeCriteria?.length ?? 0) > 0
            )
            .map((plan) => (
            <article key={`${plan.day}-${plan.focus}`} className="ai-day-card">
              <div className="ai-day-header">
                <span className="ai-day-badge">{plan.day}</span>
                <h5 className="ai-day-focus">{plan.focus}</h5>
              </div>
              <div className="ai-day-grid">
                <AiPathwayBox icon={<Stethoscope size={16} />} title="Assessment" items={plan.assessments} />
                <AiPathwayBox icon={<Activity size={16} />} title="Intervensi" items={plan.interventions} />
                <AiPathwayBox icon={<Pill size={16} />} title="Obat" items={plan.medicationConsiderations} />
                <AiPathwayBox icon={<BarChart2 size={16} />} title="Monitoring" items={plan.monitoring} />
                <AiPathwayBox icon={<CheckCircle2 size={16} />} title="Kriteria Pulang" items={plan.dischargeCriteria} />
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* ── 6. Risk & Variance — side-by-side panels ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          <SectionLabel icon="⚠️" text="Peta Risiko Klinis" />
          <div className="risk-lane">
            {(result.riskStratification || []).length > 0 ? (result.riskStratification || []).map((risk, i) => (
              <div key={i} className={`risk-tile ${risk.level}`}>
                <div className="risk-level">{risk.level}</div>
                <strong>{risk.issue}</strong>
                <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{risk.rationale}</p>
                <span>Rencana: {risk.recommendedAction}</span>
              </div>
            )) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-6)' }}>Tidak terdeteksi risiko klinis spesifik.</p>
            )}
          </div>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          <SectionLabel icon="📊" text="Varians Pathway" />
          <div className="variance-map">
            {(result.pathwayVariances || []).map((variance, i) => (
              <div key={i} className="variance-node">
                <div className="variance-area">{variance.area}</div>
                <strong>{variance.observedVariance}</strong>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.5 }}>{variance.potentialImpact}</p>
                <span>Tindak Lanjut: {variance.recommendedFollowUp}</span>
              </div>
            ))}
            {(result.pathwayVariances || []).length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-6)' }}>Tidak terdeteksi deviasi dari jalur pathway standar.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── 7. Discharge Readiness ── */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          <div style={{ flexShrink: 0, padding: '8px 20px', borderRadius: 'var(--radius-md)', border: `1px solid ${result.dischargeReadiness?.status === 'siap' ? 'var(--color-success-500)' : 'var(--color-warning-500)'}`, background: result.dischargeReadiness?.status === 'siap' ? 'rgba(34,197,94,0.07)' : 'rgba(245,158,11,0.07)', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.07em', marginBottom: '4px' }}>Status Pemulangan</span>
            <span style={{ display: 'block', fontWeight: 800, color: result.dischargeReadiness?.status === 'siap' ? 'var(--color-success-600)' : 'var(--color-warning-600)', textTransform: 'capitalize', fontSize: '1rem' }}>{result.dischargeReadiness?.status?.replaceAll('_', ' ') || 'Belum Dinilai'}</span>
          </div>
          <div>
            <SectionLabel icon="🏥" text="Discharge Readiness Assessment" />
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>Kesiapan klinis pasien untuk dipulangkan dari fasilitas kesehatan.</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <InfoBlock title="Kriteria Terpenuhi" items={result.dischargeReadiness?.criteriaMet || []} accentColor="var(--color-success-500)" bgColor="rgba(34,197,94,0.05)" />
          <InfoBlock title="Blocker Pemulangan" items={result.dischargeReadiness?.blockers || []} accentColor="var(--color-danger-500)" bgColor="rgba(239,68,68,0.05)" />
          <div style={{ gridColumn: 'span 2', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--color-primary-500)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, color: 'var(--color-primary-500)', marginBottom: '6px' }}>Rencana Tindak Lanjut</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{result.dischargeReadiness?.followUpPlan || '—'}</p>
          </div>
          <div style={{ gridColumn: 'span 2', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--color-info-500)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, color: 'var(--color-info-500)', marginBottom: '6px' }}>Edukasi Pasien</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{result.dischargeReadiness?.patientEducation || '—'}</p>
          </div>
        </div>
      </div>

      {/* ── 8. Audience Summaries — labeled quote-style cards ── */}
      <div>
        <SectionLabel icon="👥" text="Summary Multidisiplin" desc="Ringkasan klinis dirancang untuk masing-masing peran penanggung jawab pelayanan." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
          <AudienceCard label="Klinisi" accent="clinician" text={result.aiSummaryForClinician || 'Belum tersedia.'} />
          <AudienceCard label="Coder / Klaim" accent="coder" text={result.aiSummaryForCoder || 'Belum tersedia.'} />
          <AudienceCard label="Pasien" accent="patient" text={result.aiSummaryForPatient || 'Belum tersedia.'} />
          <article className="audience-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.12)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>MD</div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Mapping Katalog Standar</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Ref: </span>{result.masterDataMapping?.patientReference || '—'}</p>
            <AiList title="Resource disarankan" items={result.masterDataMapping?.suggestedResources || []} />
            <AiList title="Katalog standar kurang" items={result.masterDataMapping?.missingMasterData || []} />
          </article>
        </div>
      </div>

      {/* ── 9. Safety & Data Quality — alert-style banners ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderLeft: '4px solid var(--color-danger-500)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
          <SectionLabel icon="🚨" text="Safety Notes" color="var(--color-danger-500)" />
          <AiList items={result.safetyNotes} />
        </div>
        <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderLeft: '4px solid var(--color-warning-500)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
          <SectionLabel icon="🔎" text="Isu Kualitas Data" color="var(--color-warning-500)" />
          <AiList items={result.dataQualityIssues} />
        </div>
      </div>
    </div>
  )
}

function AiVisualSnapshot({ result }: { result: AiClinicalPathwayBrainOutput }) {
  const dashboard = result.validationDashboard
  const highRiskCount = result.riskStratification?.filter((risk) => risk.level === 'tinggi' || risk.level === 'kritis')?.length || 0
  const readinessLabel = result.dischargeReadiness?.status?.replaceAll('_', ' ') || 'Belum Dinilai'

  return (
    <div className="visual-snapshot" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
      <div className={`snapshot-score ${dashboard.overallStatus}`} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 'var(--space-4)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-card)' }}>
        <ScoreCircularGauge score={dashboard.score} size={70} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>Validation Score</span>
          <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 800 }}>{dashboard.score} / 100</strong>
          <span style={{ fontSize: '0.7rem', color: dashboard.score >= 80 ? 'var(--color-success-500)' : 'var(--color-warning-500)', fontWeight: 600 }}>
            {dashboard.score >= 80 ? 'Kesesuaian Tinggi' : 'Perlu Atensi'}
          </span>
        </div>
      </div>
      <div className="snapshot-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>Item Ditandai</span>
        <strong style={{ fontSize: '1.5rem', color: dashboard.reviewCount + dashboard.failedCount > 0 ? 'var(--color-danger-500)' : 'var(--text-primary)', fontWeight: 800, lineHeight: 1.2 }}>{dashboard.reviewCount + dashboard.failedCount}</strong>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{formatRupiah(dashboard.totalFlaggedCost)} butuh perhatian</p>
      </div>
      <div className="snapshot-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>Risiko Tinggi</span>
        <strong style={{ fontSize: '1.5rem', color: highRiskCount > 0 ? 'var(--color-danger-500)' : 'var(--text-primary)', fontWeight: 800, lineHeight: 1.2 }}>{highRiskCount}</strong>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Dari {result.riskStratification?.length || 0} risiko terdeteksi</p>
      </div>
      <div className="snapshot-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>Discharge Readiness</span>
        <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800, lineHeight: 1.2, textTransform: 'capitalize' }}>{readinessLabel}</strong>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{result.dischargeReadiness?.blockers?.length || 0} blocker tersisa</p>
      </div>
    </div>
  )
}

function ReasonPill({ label, text }: { label: string; text: string }) {
  let badge = null
  let cleanText = text
  if (text.includes('OVERSTAY:')) {
    badge = <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'var(--color-danger-50)', color: 'var(--color-danger-600)', marginRight: '6px' }}>OVERSTAY</span>
    cleanText = text.replace('OVERSTAY: ', '')
  } else if (text.includes('UNDERSTAY:')) {
    badge = <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'var(--color-warning-50)', color: 'var(--color-warning-600)', marginRight: '6px' }}>UNDERSTAY</span>
    cleanText = text.replace('UNDERSTAY: ', '')
  }

  return (
    <div className="reason-pill" style={{ display: 'flex', gap: 'var(--space-3)', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.85rem' }}>
      <span style={{ fontWeight: 700, color: 'var(--color-primary-500)', minWidth: '90px', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{badge}{cleanText}</p>
      </div>
    </div>
  )
}

function AudienceCard({ label, accent, text }: { label: string; accent: 'clinician' | 'coder' | 'patient'; text: string }) {
  const colorClass = accent === 'clinician' ? 'green' : accent === 'coder' ? 'amber' : 'blue'
  return (
    <article className={`audience-card ${colorClass}`} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)' }}>
      <div className="audience-icon">
        {label.slice(0, 2).toUpperCase()}
      </div>
      <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 'var(--space-3)' }}>{label}</h4>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.45 }}>{text}</p>
    </article>
  )
}

export function AiValidationBoard({ result }: { result: AiClinicalPathwayBrainOutput }) {
  const dashboard = result.validationDashboard
  const statusLabel = {
    sesuai: 'Sesuai',
    tidak_sesuai: 'Tidak sesuai',
    perlu_review: 'Perlu review',
    data_kurang: 'Data kurang',
  }

  const procedures = dashboard?.validatedItems?.filter(item => item.type === 'procedure') || []
  const medications = dashboard?.validatedItems?.filter(item => item.type === 'medication') || []

  const renderItemCard = (item: NonNullable<typeof dashboard>['validatedItems'][0]) => (
    <article key={`${item.type}-${item.id}`} className={`validation-item ${item.status}`} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderTop: `3px solid ${item.status === 'sesuai' ? 'var(--color-success-500)' : item.status === 'tidak_sesuai' ? 'var(--color-danger-500)' : 'var(--color-warning-500)'}`, borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div className="validation-item-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="validation-type" style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>{item.type === 'procedure' ? 'Tindakan' : 'Obat'}</span>
        <span className={`validation-status ${item.status}`} style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>{statusLabel[item.status]}</span>
      </div>
      <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{item.name || item.code || 'Item tanpa nama'}</h5>
      <div className="validation-code" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Kode: {item.code || '—'} · ID: {item.id || '—'}</div>
      
      {(item.masterDataValidation?.toLowerCase().includes('tidak ditemukan') || item.issue?.toLowerCase().includes('tidak ditemukan')) && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-danger-50)', border: '1px solid var(--color-danger-200)', borderRadius: '4px', padding: '4px 8px', marginTop: '4px' }}>
          <AlertTriangle size={12} color="var(--color-danger-600)" />
          <strong style={{ fontSize: '0.65rem', color: 'var(--color-danger-600)', fontWeight: 800 }}>TIDAK TERDAFTAR DI MASTER DATA</strong>
        </div>
      )}

      <div className="validation-price" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px dashed var(--border-subtle)', borderBottom: '1px dashed var(--border-subtle)', padding: '4px 0', margin: '4px 0' }}>
        <strong style={{ fontSize: '0.9rem', color: 'var(--color-primary-500)' }}>{formatRupiah(item.totalCost)}</strong>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatRupiah(item.unitCost)} × {item.quantity}</span>
      </div>
      <div style={{ fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-surface)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
        <p style={{ margin: 0 }}><strong style={{ color: 'var(--text-primary)' }}>Relasi:</strong> {item.diagnosisRelation}</p>
        <p style={{ margin: 0 }}><strong style={{ color: 'var(--text-primary)' }}>Katalog:</strong> {item.masterDataValidation}</p>
        <p style={{ margin: 0 }}><strong style={{ color: 'var(--text-primary)' }}>Catatan:</strong> {item.issue}</p>
        {item.priceAssessment && (
          <div style={{ marginTop: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '6px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              {item.priceAssessment.includes('OVERCHARGE') && <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'var(--color-danger-50)', color: 'var(--color-danger-600)' }}>OVERCHARGE</span>}
              {item.priceAssessment.includes('UNDERCHARGE') && <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'var(--color-warning-50)', color: 'var(--color-warning-600)' }}>UNDERCHARGE</span>}
              <strong style={{ fontSize: '0.72rem', color: 'var(--text-primary)' }}>Evaluasi Biaya</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {item.priceAssessment.replace(/^(OVERCHARGE|UNDERCHARGE):\s*/, '')}
            </p>
          </div>
        )}
      </div>
      <span className="validation-action" style={{ display: 'block', fontSize: '0.74rem', background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)', padding: '6px', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--color-primary-600)', marginTop: 'auto', textAlign: 'center' }}>Rekomendasi: {item.recommendedAction}</span>
    </article>
  )



  return (
    <div className="ai-report-section validation-board" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
      <div className="validation-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Validasi Tindakan & Obat terhadap Diagnosis</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Menandai item yang tidak sesuai berdasarkan katalog standar RS, serta memberikan rekomendasi AI.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-5)' }}>
        {result.conformanceAnalysis?.losAssessment && <ReasonPill label="Analisis LOS" text={result.conformanceAnalysis.losAssessment} />}
        {result.conformanceAnalysis?.costSignal && <ReasonPill label="Sinyal Biaya" text={result.conformanceAnalysis.costSignal} />}
      </div>

      <div className="validation-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', textAlign: 'center' }}>
        <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}><strong style={{ display: 'block', fontSize: '1.15rem', color: 'var(--color-success-500)' }}>{dashboard.passedCount}</strong><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sesuai</span></div>
        <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}><strong style={{ display: 'block', fontSize: '1.15rem', color: 'var(--color-warning-500)' }}>{dashboard.reviewCount}</strong><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Review</span></div>
        <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}><strong style={{ display: 'block', fontSize: '1.15rem', color: 'var(--color-danger-500)' }}>{dashboard.failedCount}</strong><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tidak Sesuai</span></div>
        <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}><strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--color-accent-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatRupiah(dashboard.totalFlaggedCost)}</strong><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Biaya Ditandai</span></div>
      </div>

      <div className="ai-chip-list validation-findings" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: 'var(--space-5)' }}>
        {dashboard.quickFindings.map((finding) => <span key={finding} className="ai-chip" style={{ fontSize: '0.74rem', background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>{finding}</span>)}
      </div>

      {procedures.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h5 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>Evaluasi Tindakan / Prosedur</h5>
          <div className="validation-item-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {procedures.map(renderItemCard)}
          </div>
        </div>
      )}

      {medications.length > 0 && (
        <div>
          <h5 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>Evaluasi Obat / Medikasi</h5>
          <div className="validation-item-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {medications.map(renderItemCard)}
          </div>
        </div>
      )}
    </div>
  )
}

function AiList({ title, items }: { title?: string; items: string[] }) {
  const safeItems = Array.isArray(items) ? items : (typeof items === 'string' ? [items] : [])
  if (safeItems.length === 0) return null
  return (
    <div className="ai-list-block" style={{ fontSize: '0.8rem' }}>
      {title && <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>{title}</span>}
      <ul style={{ paddingLeft: '16px', margin: 0, color: 'var(--text-secondary)' }}>
        {safeItems.map((item, i) => <li key={i} style={{ marginBottom: '2px' }}>{item}</li>)}
      </ul>
    </div>
  )
}

function AiPathwayBox({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  const safeItems = Array.isArray(items) ? items : (typeof items === 'string' ? [items] : [])
  if (safeItems.length === 0) return null
  return (
    <div className="ai-pathway-box">
      <div className="ai-pathway-box-header">
        <span className="ai-pathway-box-icon">{icon}</span>
        <span>{title}</span>
      </div>
      <ul className="ai-pathway-list">
        {safeItems.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  )
}

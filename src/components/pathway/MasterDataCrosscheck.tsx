'use client'

import { formatRupiah } from '@/lib/pathway-utils'
import { SectionHeader } from '@/components/ui/PathwayPrimitives'
import { Database, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react'
import type { ClinicalPathwayForm, ProcedureItem, MedicationItem } from '@/types/clinical-pathway'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MasterLookup {
  name: string
  code: string
  baseTariff: number | null
  description?: string | null
}

// ─── Main Component ────────────────────────────────────────────────────────────
// Receives lookup results (already fetched from API) as props
// so this component stays pure client-side without catalog imports.

interface Props {
  form: ClinicalPathwayForm
  /** Pre-fetched lookup results from /api/master-data */
  procedureLookups: Record<string, MasterLookup | null>
  medicationLookups: Record<string, MasterLookup | null>
}

export function MasterDataCrosscheck({ form, procedureLookups, medicationLookups }: Props) {

  const procedures = form.procedures.map((p) => ({
    item: p,
    master: procedureLookups[p.icd9_code] ?? null,
  }))

  const medications = form.medications.map((m) => ({
    item: m,
    master: medicationLookups[m.drug_name] ?? null,
  }))

  let matchCount = 0
  let markupCount = 0
  let notFoundCount = 0

  const calculateStats = (row: { item: any, master: MasterLookup | null }) => {
    if (!row.master) {
      notFoundCount++
    } else {
      const inputPrice = parseInt(row.item.unit_cost.replace(/\D/g, '') || '0')
      const masterPrice = row.master.baseTariff ?? 0
      if (masterPrice > 0) {
        if (inputPrice === masterPrice) matchCount++
        else if (inputPrice > masterPrice) markupCount++
      }
    }
  }

  procedures.forEach(calculateStats)
  medications.forEach(calculateStats)

  return (
    <div className="form-card" style={{ background: 'var(--bg-elevated)', marginTop: 'var(--space-6)' }}>
      <SectionHeader icon="MD" iconColor="blue"
        title="Master Data Crosscheck"
        desc="Perbandingan otomatis input pengguna terhadap Master Data (tarif dasar dari database)"
      />

      {/* Visual Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tarif Sesuai</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{matchCount}</div>
          </div>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Markup Tarif</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-danger-600)' }}>{markupCount}</div>
          </div>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tidak Ditemukan</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-warning-600)' }}>{notFoundCount}</div>
          </div>
        </div>
      </div>

      {/* Tindakan Crosscheck */}
      <h4 style={{ marginBottom: 'var(--space-3)', fontSize: '1rem', color: 'var(--text-primary)' }}>Crosscheck Tindakan</h4>
      <div className="table-responsive" style={{ marginBottom: 'var(--space-6)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Current Input (Form)</th>
              <th>Harga Input</th>
              <th>Nama Standar (Master Data)</th>
              <th>Tarif Dasar (Master Data)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {procedures.map((row, i) => {
              const inputPrice = parseInt(row.item.unit_cost.replace(/\D/g, '') || '0')
              const masterPrice = row.master?.baseTariff ?? 0
              const diff = inputPrice - masterPrice

              let statusLabel = 'Tidak Ditemukan'
              let statusBadgeClass = 'status-badge neutral'
              let diffClass = ''
              let diffText = ''

              if (row.master) {
                if (masterPrice === 0) {
                  statusLabel = 'Tarif N/A'
                  statusBadgeClass = 'status-badge neutral'
                } else if (diff === 0) {
                  statusLabel = 'Sesuai'
                  statusBadgeClass = 'status-badge success'
                } else if (diff > 0) {
                  statusLabel = 'Markup'
                  statusBadgeClass = 'status-badge danger'
                  diffClass = 'diff-text danger'
                  diffText = `+${formatRupiah(diff)}`
                } else {
                  statusLabel = 'Undercharge'
                  statusBadgeClass = 'status-badge warning'
                  diffClass = 'diff-text warning'
                  diffText = `-${formatRupiah(Math.abs(diff))}`
                }
              }

              return (
                <tr key={i}>
                  <td style={{ background: 'var(--bg-base)', width: '25%' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{row.item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kode: <span style={{ fontFamily: 'monospace' }}>{row.item.icd9_code}</span></div>
                  </td>
                  <td style={{ background: 'var(--bg-base)', fontWeight: 700, color: 'var(--text-primary)', width: '15%' }}>
                    {formatRupiah(inputPrice)}
                  </td>
                  <td style={{ width: '30%' }}>
                    {row.master ? (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary-500)', marginBottom: '4px' }}>{row.master.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Kode MD: <span style={{ fontFamily: 'monospace' }}>{row.master.code}</span>
                        </div>
                      </>
                    ) : (
                      <span style={{ color: 'var(--color-danger-500)', fontStyle: 'italic', fontSize: '0.9rem', fontWeight: 600 }}>⚠ Tidak ditemukan di Master Data</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: row.master ? 'var(--text-primary)' : 'inherit', width: '15%' }}>
                    {row.master && masterPrice > 0 ? formatRupiah(masterPrice) : '-'}
                  </td>
                  <td style={{ width: '15%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <span className={statusBadgeClass}>{statusLabel}</span>
                      {diffText && <span className={diffClass}>{diffText}</span>}
                    </div>
                  </td>
                </tr>
              )
            })}
            {procedures.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada tindakan diinput</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Obat Crosscheck */}
      <h4 style={{ marginBottom: 'var(--space-3)', fontSize: '1rem', color: 'var(--text-primary)' }}>Crosscheck Obat</h4>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Current Input (Form)</th>
              <th>Harga Input</th>
              <th>Nama Standar (Master Data)</th>
              <th>Tarif Dasar (Master Data)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {medications.map((row, i) => {
              const inputPrice = parseInt(row.item.unit_cost.replace(/\D/g, '') || '0')
              const masterPrice = row.master?.baseTariff ?? 0
              const diff = inputPrice - masterPrice

              let statusLabel = 'Tidak Ditemukan'
              let statusBadgeClass = 'status-badge neutral'
              let diffClass = ''
              let diffText = ''

              if (row.master) {
                if (masterPrice === 0) {
                  statusLabel = 'Tarif N/A'
                  statusBadgeClass = 'status-badge neutral'
                } else if (diff === 0) {
                  statusLabel = 'Sesuai'
                  statusBadgeClass = 'status-badge success'
                } else if (diff > 0) {
                  statusLabel = 'Markup'
                  statusBadgeClass = 'status-badge danger'
                  diffClass = 'diff-text danger'
                  diffText = `+${formatRupiah(diff)}`
                } else {
                  statusLabel = 'Undercharge'
                  statusBadgeClass = 'status-badge warning'
                  diffClass = 'diff-text warning'
                  diffText = `-${formatRupiah(Math.abs(diff))}`
                }
              }

              return (
                <tr key={i}>
                  <td style={{ background: 'var(--bg-base)', width: '25%' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{row.item.drug_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.item.generic_name}</div>
                  </td>
                  <td style={{ background: 'var(--bg-base)', fontWeight: 700, color: 'var(--text-primary)', width: '15%' }}>
                    {formatRupiah(inputPrice)}
                  </td>
                  <td style={{ width: '30%' }}>
                    {row.master ? (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary-500)', marginBottom: '4px' }}>{row.master.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Kode MD: <span style={{ fontFamily: 'monospace' }}>{row.master.code}</span>
                        </div>
                      </>
                    ) : (
                      <span style={{ color: 'var(--color-danger-500)', fontStyle: 'italic', fontSize: '0.9rem', fontWeight: 600 }}>⚠ Tidak ditemukan di Master Data</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: row.master ? 'var(--text-primary)' : 'inherit', width: '15%' }}>
                    {row.master && masterPrice > 0 ? formatRupiah(masterPrice) : '-'}
                  </td>
                  <td style={{ width: '15%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <span className={statusBadgeClass}>{statusLabel}</span>
                      {diffText && <span className={diffClass}>{diffText}</span>}
                    </div>
                  </td>
                </tr>
              )
            })}
            {medications.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada obat diinput</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}

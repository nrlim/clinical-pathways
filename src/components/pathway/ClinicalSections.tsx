'use client'

import { SectionHeader } from '@/components/ui/PathwayPrimitives'
import { generateId } from '@/lib/pathway-utils'
import type {
  DiagnosisSection, SecondaryDiagnosis,
  ProcedureItem, MedicationItem,
  InpatientJustification, Conformance,
} from '@/types/clinical-pathway'

// ─── Section 3: Diagnosis ──────────────────────────────────
export function DiagnosisSectionForm({
  data, onChange,
}: {
  data: DiagnosisSection
  onChange: (field: keyof DiagnosisSection, value: unknown) => void
}) {
  const addSecondary = () => {
    onChange('secondary_diagnoses', [
      ...data.secondary_diagnoses,
      { id: generateId(), code: '', name: '' } satisfies SecondaryDiagnosis,
    ])
  }

  const updateSecondary = (id: string, field: keyof SecondaryDiagnosis, value: string) => {
    onChange('secondary_diagnoses', data.secondary_diagnoses.map(d =>
      d.id === id ? { ...d, [field]: value } : d
    ))
  }

  const removeSecondary = (id: string) => {
    onChange('secondary_diagnoses', data.secondary_diagnoses.filter(d => d.id !== id))
  }

  return (
    <div className="form-card">
      <SectionHeader icon="DX" iconColor="rose"
        title="Diagnosis"
        desc="Kode ICD-10 diagnosis primer & sekunder, tingkat keparahan, dan komorbiditas"
      />
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Kode ICD-10 Primer <span className="required">*</span></label>
          <input className="form-input" placeholder="e.g. J18.9" value={data.primary_diagnosis_code}
            onChange={e => onChange('primary_diagnosis_code', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Nama Diagnosis Primer <span className="required">*</span></label>
          <input className="form-input" placeholder="e.g. Pneumonia, unspecified"
            value={data.primary_diagnosis_name}
            onChange={e => onChange('primary_diagnosis_name', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Tingkat Keparahan <span className="required">*</span></label>
          <select className="form-select" value={data.severity}
            onChange={e => onChange('severity', e.target.value)} required>
            <option value="">Pilih tingkat...</option>
            <option value="ringan">Ringan</option>
            <option value="sedang">Sedang</option>
            <option value="berat">Berat</option>
            <option value="sangat_berat">Sangat Berat / Kritis</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Komorbiditas</label>
          <input className="form-input" placeholder="e.g. DM Tipe 2, Hipertensi"
            value={data.comorbidities}
            onChange={e => onChange('comorbidities', e.target.value)} />
        </div>
      </div>

      {/* Secondary Diagnoses */}
      <div style={{ marginTop: 'var(--space-6)' }}>
        <label className="form-label" style={{ display: 'block', marginBottom: 'var(--space-3)' }}>
          Diagnosis Sekunder
        </label>
        {data.secondary_diagnoses.map((dx) => (
          <div key={dx.id} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', alignItems: 'center' }}>
            <input className="form-input" style={{ width: '130px', flexShrink: 0 }}
              placeholder="Kode ICD-10" value={dx.code}
              onChange={e => updateSecondary(dx.id, 'code', e.target.value)} />
            <input className="form-input" placeholder="Nama diagnosis sekunder" value={dx.name}
              onChange={e => updateSecondary(dx.id, 'name', e.target.value)} />
            <button type="button" className="delete-row-btn" onClick={() => removeSecondary(dx.id)}
              aria-label="Hapus diagnosis sekunder">✕</button>
          </div>
        ))}
        <button type="button" className="add-row-btn" onClick={addSecondary}>
          + Tambah Diagnosis Sekunder
        </button>
      </div>
    </div>
  )
}

// ─── Section 4: Tindakan / Procedures ─────────────────────
export function ProcedureSectionForm({
  items, onChange,
}: {
  items: ProcedureItem[]
  onChange: (items: ProcedureItem[]) => void
}) {
  const add = () => onChange([...items, {
    id: generateId(), icd9_code: '', name: '', category: '', performed_date: '',
    performed_by: '', conformance: '', unit_cost: '', quantity: '1',
    tariff_type: '', notes: '',
  }])

  const update = (id: string, field: keyof ProcedureItem, value: string) =>
    onChange(items.map(i => i.id === id ? { ...i, [field]: value } : i))

  const remove = (id: string) => onChange(items.filter(i => i.id !== id))

  return (
    <div className="form-card">
      <SectionHeader icon="PR" iconColor="green"
        title="Tindakan Medis"
        desc="Validasi kesesuaian tindakan terhadap diagnosa dan tarif INA-CBGs"
      />

      <div style={{ overflowX: 'auto' }}>
        <table className="row-table">
          <thead className="row-table-head">
            <tr>
              <th style={{ minWidth: 90 }}>Kode ICD-9</th>
              <th style={{ minWidth: 180 }}>Nama Tindakan</th>
              <th style={{ minWidth: 120 }}>Kategori</th>
              <th style={{ minWidth: 120 }}>Tgl. Tindakan</th>
              <th style={{ minWidth: 140 }}>Pelaksana</th>
              <th style={{ minWidth: 110 }}>Kesesuaian Dx</th>
              <th style={{ minWidth: 130 }}>Biaya (Rp)</th>
              <th style={{ minWidth: 60 }}>Qty</th>
              <th style={{ minWidth: 130 }}>Tarif</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="row-table-body">
            {items.map(item => (
              <tr key={item.id}>
                <td><input className="form-input" placeholder="87.03" value={item.icd9_code}
                  onChange={e => update(item.id, 'icd9_code', e.target.value)} /></td>
                <td><input className="form-input" placeholder="Nama tindakan" value={item.name}
                  onChange={e => update(item.id, 'name', e.target.value)} /></td>
                <td>
                  <select className="form-select" value={item.category}
                    onChange={e => update(item.id, 'category', e.target.value)}>
                    <option value="">Pilih...</option>
                    <option>Bedah</option><option>Non-Bedah</option>
                    <option>Diagnostik</option><option>Rehabilitasi</option>
                    <option>Keperawatan</option>
                  </select>
                </td>
                <td><input type="date" className="form-input" value={item.performed_date}
                  onChange={e => update(item.id, 'performed_date', e.target.value)} /></td>
                <td><input className="form-input" placeholder="Nama pelaksana" value={item.performed_by}
                  onChange={e => update(item.id, 'performed_by', e.target.value)} /></td>
                <td>
                  <select className="form-select" value={item.conformance}
                    onChange={e => update(item.id, 'conformance', e.target.value as Conformance)}>
                    <option value="">Pilih...</option>
                    <option value="sesuai">Sesuai</option>
                    <option value="tidak">Tidak Sesuai</option>
                    <option value="review">Perlu Review</option>
                  </select>
                </td>
                <td><input className="form-input" placeholder="0" type="number" min="0"
                  value={item.unit_cost} onChange={e => update(item.id, 'unit_cost', e.target.value)} /></td>
                <td><input className="form-input" type="number" min="1" value={item.quantity}
                  onChange={e => update(item.id, 'quantity', e.target.value)} /></td>
                <td>
                  <select className="form-select" value={item.tariff_type}
                    onChange={e => update(item.id, 'tariff_type', e.target.value)}>
                    <option value="">Pilih...</option>
                    <option>INA-CBGs</option><option>Non-INA-CBGs</option><option>Umum</option>
                  </select>
                </td>
                <td><button type="button" className="delete-row-btn" onClick={() => remove(item.id)}>✕</button></td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Belum ada tindakan. Klik tombol di bawah untuk menambahkan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className="add-row-btn" onClick={add}>+ Tambah Tindakan</button>
    </div>
  )
}

// ─── Section 5: Obat / Medications ────────────────────────
export function MedicationSectionForm({
  items, onChange,
}: {
  items: MedicationItem[]
  onChange: (items: MedicationItem[]) => void
}) {
  const add = () => onChange([...items, {
    id: generateId(), drug_name: '', generic_name: '', route: '', dosage: '',
    frequency: '', duration_days: '', formulary: '', conformance: '',
    unit_cost: '', quantity: '1', notes: '',
  }])

  const update = (id: string, field: keyof MedicationItem, value: string) =>
    onChange(items.map(i => i.id === id ? { ...i, [field]: value } : i))

  const remove = (id: string) => onChange(items.filter(i => i.id !== id))

  return (
    <div className="form-card">
      <SectionHeader icon="RX" iconColor="violet"
        title="Obat & Medikasi"
        desc="Validasi kesesuaian obat terhadap diagnosa, formularium, dan harga satuan"
      />
      <div style={{ overflowX: 'auto' }}>
        <table className="row-table">
          <thead className="row-table-head">
            <tr>
              <th style={{ minWidth: 160 }}>Nama Obat</th>
              <th style={{ minWidth: 150 }}>Nama Generik</th>
              <th style={{ minWidth: 100 }}>Rute</th>
              <th style={{ minWidth: 90 }}>Dosis</th>
              <th style={{ minWidth: 80 }}>Frekuensi</th>
              <th style={{ minWidth: 70 }}>Hari</th>
              <th style={{ minWidth: 130 }}>Formularium</th>
              <th style={{ minWidth: 110 }}>Kesesuaian Dx</th>
              <th style={{ minWidth: 120 }}>Harga/unit (Rp)</th>
              <th style={{ minWidth: 60 }}>Qty</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="row-table-body">
            {items.map(item => (
              <tr key={item.id}>
                <td><input className="form-input" placeholder="Nama dagang" value={item.drug_name}
                  onChange={e => update(item.id, 'drug_name', e.target.value)} /></td>
                <td><input className="form-input" placeholder="Nama generik" value={item.generic_name}
                  onChange={e => update(item.id, 'generic_name', e.target.value)} /></td>
                <td>
                  <select className="form-select" value={item.route}
                    onChange={e => update(item.id, 'route', e.target.value)}>
                    <option value="">Pilih...</option>
                    <option>Oral</option><option>IV</option><option>IM</option>
                    <option>SC</option><option>Topikal</option><option>Inhalasi</option>
                    <option>Suppositoria</option>
                  </select>
                </td>
                <td><input className="form-input" placeholder="500mg" value={item.dosage}
                  onChange={e => update(item.id, 'dosage', e.target.value)} /></td>
                <td><input className="form-input" placeholder="3x1" value={item.frequency}
                  onChange={e => update(item.id, 'frequency', e.target.value)} /></td>
                <td><input className="form-input" type="number" min="1" placeholder="7"
                  value={item.duration_days} onChange={e => update(item.id, 'duration_days', e.target.value)} /></td>
                <td>
                  <select className="form-select" value={item.formulary}
                    onChange={e => update(item.id, 'formulary', e.target.value)}>
                    <option value="">Pilih...</option>
                    <option value="Formularium Nasional">Fornas</option>
                    <option value="Formularium RS">ForRS</option>
                    <option value="Non-Formularium">Non-Fornas</option>
                  </select>
                </td>
                <td>
                  <select className="form-select" value={item.conformance}
                    onChange={e => update(item.id, 'conformance', e.target.value as Conformance)}>
                    <option value="">Pilih...</option>
                    <option value="sesuai">Sesuai</option>
                    <option value="tidak">Tidak Sesuai</option>
                    <option value="review">Perlu Review</option>
                  </select>
                </td>
                <td><input className="form-input" type="number" min="0" placeholder="0"
                  value={item.unit_cost} onChange={e => update(item.id, 'unit_cost', e.target.value)} /></td>
                <td><input className="form-input" type="number" min="1"
                  value={item.quantity} onChange={e => update(item.id, 'quantity', e.target.value)} /></td>
                <td><button type="button" className="delete-row-btn" onClick={() => remove(item.id)}>✕</button></td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Belum ada obat. Klik tombol di bawah untuk menambahkan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className="add-row-btn" onClick={add}>+ Tambah Obat</button>
    </div>
  )
}

// ─── Section 6: Rawat Inap Justifikasi ────────────────────
export function InpatientJustificationForm({
  data, onChange,
}: {
  data: InpatientJustification
  onChange: (field: keyof InpatientJustification, value: unknown) => void
}) {
  const CRITERIA = [
    'Memerlukan monitoring ketat 24 jam',
    'Memerlukan tindakan invasif',
    'Kondisi tidak stabil / deteriorasi klinis',
    'Nyeri tidak terkontrol',
    'Dehidrasi berat / gangguan elektrolit',
    'Infeksi berat / sepsis',
    'Tidak dapat minum obat oral',
    'Risiko komplikasi tinggi',
  ]

  const toggleCriteria = (c: string) => {
    const current = data.clinical_criteria_met
    const next = current.includes(c) ? current.filter(x => x !== c) : [...current, c]
    onChange('clinical_criteria_met', next)
  }

  return (
    <div className="form-card">
      <SectionHeader icon="IP" iconColor="amber"
        title="Justifikasi Rawat Inap"
        desc="Validasi indikasi rawat inap terhadap diagnosa dan kesesuaian lama hari rawat"
      />

      {/* Indikasi rawat inap */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <label className="form-label" style={{ display: 'block', marginBottom: 'var(--space-3)' }}>
          Apakah rawat inap sesuai indikasi medis? <span className="required">*</span>
        </label>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {[
            { val: true, label: 'Sesuai Indikasi', cls: 'sesuai' },
            { val: false, label: 'Tidak Sesuai Indikasi', cls: 'tidak' },
          ].map(opt => (
            <button key={String(opt.val)} type="button"
              onClick={() => onChange('is_inpatient_indicated', opt.val)}
              className={`conformance-badge ${data.is_inpatient_indicated === opt.val ? opt.cls : ''}`}
              style={{
                padding: 'var(--space-2) var(--space-5)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                border: data.is_inpatient_indicated === opt.val ? undefined : '1px solid var(--border-default)',
                background: data.is_inpatient_indicated === opt.val ? undefined : 'transparent',
                color: data.is_inpatient_indicated === opt.val ? undefined : 'var(--text-muted)',
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kriteria klinis */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <label className="form-label" style={{ display: 'block', marginBottom: 'var(--space-3)' }}>
          Kriteria Klinis yang Terpenuhi
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {CRITERIA.map(c => {
            const checked = data.clinical_criteria_met.includes(c)
            return (
              <button key={c} type="button" onClick={() => toggleCriteria(c)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: checked ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--border-default)',
                  background: checked ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: checked ? 'var(--color-primary-400)' : 'var(--text-muted)',
                  transition: 'all var(--transition-fast)',
                  fontFamily: 'var(--font-sans)',
                }}>
                {checked ? '● ' : '○ '}{c}
              </button>
            )
          })}
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Kesesuaian Lama Rawat <span className="required">*</span></label>
          <select className="form-select" value={data.los_conformance}
            onChange={e => onChange('los_conformance', e.target.value)}>
            <option value="">Pilih...</option>
            <option value="sesuai">Sesuai Clinical Pathway</option>
            <option value="tidak">Melebihi / Di bawah standar</option>
            <option value="review">Perlu Review PIC</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Kondisi saat Pulang <span className="required">*</span></label>
          <select className="form-select" value={data.discharge_condition}
            onChange={e => onChange('discharge_condition', e.target.value)}>
            <option value="">Pilih kondisi...</option>
            <option>Membaik</option><option>Stabil</option>
            <option>Meninggal</option><option>DAMA</option><option>Dirujuk</option>
          </select>
        </div>
        <div className="form-group col-span-2">
          <label className="form-label">Alasan Deviasi LOS</label>
          <input className="form-input" placeholder="Jelaskan jika lama rawat tidak sesuai standar"
            value={data.los_deviation_reason}
            onChange={e => onChange('los_deviation_reason', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Justifikasi Rawat Inap</label>
          <textarea className="form-textarea" placeholder="Narasi justifikasi klinis rawat inap..."
            value={data.justification_reason}
            onChange={e => onChange('justification_reason', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Kriteria Pemulangan</label>
          <textarea className="form-textarea" placeholder="Kriteria klinis yang menjadi dasar pemulangan pasien..."
            value={data.discharge_criteria}
            onChange={e => onChange('discharge_criteria', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

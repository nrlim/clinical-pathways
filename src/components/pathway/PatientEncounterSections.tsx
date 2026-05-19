'use client'

import { SectionHeader } from '@/components/ui/PathwayPrimitives'
import type { PatientSection, EncounterSection } from '@/types/clinical-pathway'

// ─── Section 1: Patient ────────────────────────────────────
interface PatientSectionProps {
  data: PatientSection
  onChange: (field: keyof PatientSection, value: string) => void
}

export function PatientSectionForm({
  data,
  onChange,
}: PatientSectionProps) {
  return (
    <div className="form-card">
      <SectionHeader icon="ID" iconColor="blue"
        title="Identitas Pasien"
        desc="Data demografis dan informasi jaminan kesehatan pasien"
      />
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Nama Lengkap <span className="required">*</span></label>
          <input className="form-input" placeholder="Nama sesuai KTP" value={data.patient_name}
            onChange={e => onChange('patient_name', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">NIK <span className="required">*</span></label>
          <input className="form-input" placeholder="16 digit NIK" maxLength={16}
            value={data.nik} onChange={e => onChange('nik', e.target.value.replace(/\D/g, ''))} required />
        </div>
        <div className="form-group">
          <label className="form-label">Tanggal Lahir <span className="required">*</span></label>
          <input type="date" className="form-input" value={data.birth_date}
            onChange={e => onChange('birth_date', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Jenis Kelamin <span className="required">*</span></label>
          <select className="form-select" value={data.gender}
            onChange={e => onChange('gender', e.target.value)} required>
            <option value="">Pilih...</option>
            <option value="male">Laki-laki</option>
            <option value="female">Perempuan</option>
          </select>
        </div>
        <div className="form-group">
          <input className="form-input" placeholder="Nomor rekam medis (MRN)"
            value={data.mr_number} onChange={e => onChange('mr_number', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">No. Telepon</label>
          <input className="form-input" type="tel" placeholder="08xx-xxxx-xxxx"
            value={data.phone} onChange={e => onChange('phone', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Jenis Penjamin <span className="required">*</span></label>
          <select className="form-select" value={data.guarantor}
            onChange={e => onChange('guarantor', e.target.value)} required>
            <option value="">Pilih penjamin...</option>
            <option value="BPJS">BPJS Kesehatan</option>
            <option value="JKN">JKN Non-BPJS</option>
            <option value="Asuransi">Asuransi Swasta</option>
            <option value="Umum">Umum / Mandiri</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">No. BPJS / Polis</label>
          <input className="form-input" placeholder="Nomor kartu BPJS atau polis"
            value={data.bpjs_number} onChange={e => onChange('bpjs_number', e.target.value)} />
        </div>
        <div className="form-group col-span-2">
          <label className="form-label">Alamat</label>
          <input className="form-input" placeholder="Alamat lengkap sesuai KTP"
            value={data.address} onChange={e => onChange('address', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

// ─── Section 2: Encounter ──────────────────────────────────
interface EncounterSectionProps {
  data: EncounterSection
  onChange: (field: keyof EncounterSection, value: string) => void
}

export function EncounterSectionForm({ data, onChange }: EncounterSectionProps) {
  return (
    <div className="form-card">
      <SectionHeader icon="RM" iconColor="cyan"
        title="Episode Rawat / Encounter"
        desc="Informasi kelas perawatan, ruangan, dan tenaga medis penanggung jawab"
      />
      <div className="form-grid">
        <div className="form-group col-span-2">
          <label className="form-label">Organisasi / Faskes <span className="required">*</span></label>
          <select className="form-select" value={data.organization_id}
            onChange={e => onChange('organization_id', e.target.value)} required>
            <option value="">Pilih fasilitas kesehatan...</option>
            <option value="org1">RSUD Dr. Soetomo</option>
            <option value="org2">RSUP Dr. Sardjito</option>
            <option value="org3">Puskesmas Gondokusuman I</option>
          </select>
          <span className="form-hint">AI akan memvalidasi tarif dan ketersediaan berdasarkan faskes ini.</span>
        </div>
        <div className="form-group">
          <label className="form-label">Kelas Encounter <span className="required">*</span></label>
          <select className="form-select" value={data.encounter_class}
            onChange={e => onChange('encounter_class', e.target.value)} required>
            <option value="">Pilih kelas...</option>
            <option value="inpatient">Rawat Inap</option>
            <option value="outpatient">Rawat Jalan</option>
            <option value="emergency">Gawat Darurat</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Kelas Ruangan <span className="required">*</span></label>
          <select className="form-select" value={data.ward}
            onChange={e => onChange('ward', e.target.value)} required>
            <option value="">Pilih kelas...</option>
            {['I','II','III','VIP','ICU','ICCU','HCU','Isolasi'].map(w => (
              <option key={w} value={w}>Kelas {w}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">No. Kamar</label>
          <input className="form-input" placeholder="e.g. B-204"
            value={data.room_number} onChange={e => onChange('room_number', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">No. Bed</label>
          <input className="form-input" placeholder="e.g. 2"
            value={data.bed_number} onChange={e => onChange('bed_number', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Tgl. Masuk <span className="required">*</span></label>
          <input type="date" className="form-input" value={data.admission_date}
            onChange={e => onChange('admission_date', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Jam Masuk</label>
          <input type="time" className="form-input" value={data.admission_time}
            onChange={e => onChange('admission_time', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Tgl. Keluar</label>
          <input type="date" className="form-input" value={data.discharge_date}
            onChange={e => onChange('discharge_date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Jam Keluar</label>
          <input type="time" className="form-input" value={data.discharge_time}
            onChange={e => onChange('discharge_time', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Nama DPJP <span className="required">*</span></label>
          <input className="form-input" placeholder="Dr. Nama Dokter, Sp.XX"
            value={data.practitioner_name} onChange={e => onChange('practitioner_name', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">No. SIP DPJP</label>
          <input className="form-input" placeholder="Nomor SIP dokter"
            value={data.dpjp_number} onChange={e => onChange('dpjp_number', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Ekspektasi LOS (hari)</label>
          <input type="number" className="form-input" placeholder="e.g. 5" min="0"
            value={data.expected_los} onChange={e => onChange('expected_los', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Fasilitas Perujuk</label>
          <input className="form-input" placeholder="Nama faskes perujuk (jika ada)"
            value={data.referring_facility} onChange={e => onChange('referring_facility', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

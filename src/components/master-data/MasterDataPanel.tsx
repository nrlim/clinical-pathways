'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

type MasterCategory = 'diagnosa' | 'tindakan' | 'obat' | 'practitioner'

interface MasterDataItem {
  id: string
  code: string
  name: string
  category: MasterCategory
  description?: string | null
  unit?: string | null
  baseTariff?: number | null
  tags?: string[] | null
  isActive: boolean
}

const CATEGORY_META: Record<MasterCategory, { label: string; icon: string; description: string; sourceLabel: string; sourceBadge: string }> = {
  diagnosa:     { label: 'Diagnosa',     icon: '🧬', description: 'Kode ICD-10 dari katalog WHO & Kemenkes',             sourceLabel: 'ICD-10',  sourceBadge: 'icd10' },
  tindakan:     { label: 'Tindakan',     icon: '⚕️', description: 'Prosedur klinis dari tarif INA-CBG & Harga Faskes',   sourceLabel: 'INA-CBG', sourceBadge: 'ina-cbg' },
  obat:         { label: 'Obat',         icon: '💊', description: 'Formularium Nasional (Fornas) & Harga Faskes',         sourceLabel: 'FORNAS',  sourceBadge: 'fornas' },
  practitioner: { label: 'Practitioner', icon: '👨‍⚕️', description: 'Data dokter & tenaga medis per Faskes',              sourceLabel: 'Lokal',   sourceBadge: 'lokal' },
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

// ─── Item Card ─────────────────────────────────────────────────────────────────

function MasterItemCard({ item }: { item: MasterDataItem }) {
  const meta = CATEGORY_META[item.category]
  return (
    <article className="md-item-card" style={{ opacity: item.isActive ? 1 : 0.6 }}>
      <div className="md-item-header">
        <div className="md-item-code">{item.code}</div>
        <span className={`md-source-badge ${meta.sourceBadge}`}>{meta.sourceLabel}</span>
      </div>

      <div className="md-item-name">{item.name}</div>

      {item.description && (
        <div className="md-item-desc">{item.description}</div>
      )}

      <div className="md-item-footer">
        {item.baseTariff != null && (
          <div className="md-item-tariff">
            <span>Tarif Dasar</span>
            <strong>{formatCurrency(item.baseTariff)}</strong>
            {item.unit && <span>/ {item.unit}</span>}
          </div>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="md-item-tags">
            {item.tags.map((tag) => (
              <span key={tag} className="md-tag">{tag}</span>
            ))}
          </div>
        )}
        <div className={`md-item-status ${item.isActive ? 'aktif' : 'nonaktif'}`}>
          {item.isActive ? '● Aktif' : '○ Non-aktif'}
        </div>
      </div>
    </article>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function MasterDataPanel() {
  const [activeCategory, setActiveCategory] = useState<MasterCategory>('tindakan')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<MasterDataItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async (category: MasterCategory, q: string) => {
    setIsLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ category, q, pageSize: '50' })
      const res = await fetch(`/api/master-data?${params.toString()}`)
      if (!res.ok) throw new Error('Gagal memuat data master.')
      const payload = await res.json() as { items: MasterDataItem[]; total: number }
      setItems(payload.items)
      setTotal(payload.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data.')
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load on category change
  useEffect(() => {
    setQuery('')
    void fetchData(activeCategory, '')
  }, [activeCategory, fetchData])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void fetchData(activeCategory, query)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, activeCategory, fetchData])

  const meta = CATEGORY_META[activeCategory]
  const categories = Object.keys(CATEGORY_META) as MasterCategory[]

  return (
    <section className="records-panel md-panel">
      {/* ── Header ── */}
      <div className="md-header">
        <div>
          <div className="records-heading-kicker">Manajemen Referensi Klinis</div>
          <h1 className="md-title">Master Data Klinis</h1>
          <p className="md-subtitle">
            Data referensi klinis (ICD-10, INA-CBG, FORNAS, Practitioner) dari{' '}
            <strong>database Master Data lokal.</strong> Digunakan sebagai dasar validasi AI.
          </p>
        </div>
        <div className="md-header-badge">
          <div className="md-integration-badge">
            <span className="md-integration-dot" />
            Database Lokal · {total} data tersedia
          </div>
        </div>
      </div>

      {/* ── Info banner ── */}
      <div className="md-info-banner">
        <div className="md-info-icon">🗄️</div>
        <div>
          <div className="md-info-title">Source of Truth — Master Data Lokal</div>
          <div className="md-info-desc">
            Seluruh data diambil langsung dari database ({' '}
            <code>MasterDiagnosis</code>, <code>MasterProcedure</code>, <code>MasterMedication</code>, <code>MasterPractitioner</code>{' '}
            ). Tidak ada data yang di-hardcode di kode. Validasi AI juga menggunakan data ini secara langsung.
          </div>
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div className="md-category-tabs">
        {categories.map((cat) => {
          const m = CATEGORY_META[cat]
          return (
            <button
              key={cat}
              type="button"
              className={`md-cat-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              aria-selected={activeCategory === cat}
              role="tab"
            >
              <span className="md-cat-icon">{m.icon}</span>
              <span className="md-cat-label">{m.label}</span>
              {activeCategory === cat && <span className="md-cat-count">{total}</span>}
            </button>
          )
        })}
      </div>

      {/* ── Search bar ── */}
      <div className="md-search-bar">
        <div className="md-search-wrap">
          <svg className="md-search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            id="master-data-search"
            type="search"
            className="md-search-input"
            placeholder={`Cari ${meta.label.toLowerCase()} berdasarkan kode, nama, atau deskripsi...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={`Cari ${meta.label}`}
          />
          {query && (
            <button type="button" className="md-search-clear" onClick={() => setQuery('')} aria-label="Hapus pencarian">
              ✕
            </button>
          )}
        </div>
        <div className="md-source-info">
          <span className={`md-source-badge ${meta.sourceBadge}`}>{meta.sourceLabel}</span>
          <span className="md-source-desc">{meta.description}</span>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="md-results-header">
        <span className="md-results-count">
          {isLoading ? 'Memuat...' : `${items.length} dari ${total} data ${meta.label.toLowerCase()}`}
          {query.trim().length >= 1 && !isLoading && ` · filter: "${query}"`}
        </span>
        <div className="md-legend">
          <span className="md-source-badge lokal">Lokal</span>
          <span className="md-source-badge icd10">ICD-10</span>
          <span className="md-source-badge fornas">FORNAS</span>
          <span className="md-source-badge ina-cbg">INA-CBG</span>
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <div className="md-empty">
          <div className="md-empty-icon" style={{ animation: 'spin 1s linear infinite' }}>⏳</div>
          <div className="md-empty-title">Memuat data dari database...</div>
        </div>
      )}

      {error && !isLoading && (
        <div className="md-empty">
          <div className="md-empty-icon">⚠️</div>
          <div className="md-empty-title">Gagal Memuat Data</div>
          <div className="md-empty-desc">{error}</div>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="md-empty">
          <div className="md-empty-icon">🔍</div>
          <div className="md-empty-title">
            {query ? `Tidak ditemukan untuk "${query}"` : 'Belum ada data'}
          </div>
          <div className="md-empty-desc">
            {query
              ? 'Coba gunakan kode atau kata kunci lain.'
              : `Belum ada ${meta.label.toLowerCase()} di database. Jalankan seeder untuk mengisi data awal.`}
          </div>
        </div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="md-items-grid">
          {items.map((item) => (
            <MasterItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}

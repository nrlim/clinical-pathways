'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Dna, Stethoscope, Pill, UserRound, Database, Search, AlertCircle, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

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

const CATEGORY_META: Record<MasterCategory, {
  label: string
  icon: React.ReactNode
  description: string
  sourceLabel: string
  sourceBadge: string
  color: string
  bg: string
}> = {
  diagnosa:     { label: 'Diagnosa',     icon: <Dna size={15} />,         description: 'Kode ICD-10 dari katalog WHO & Kemenkes',             sourceLabel: 'ICD-10',  sourceBadge: 'icd10',   color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  tindakan:     { label: 'Tindakan',     icon: <Stethoscope size={15} />, description: 'Prosedur klinis dari tarif INA-CBG & Harga Faskes',   sourceLabel: 'INA-CBG', sourceBadge: 'ina-cbg', color: 'var(--color-primary-600)', bg: 'rgba(20,184,166,0.1)' },
  obat:         { label: 'Obat',         icon: <Pill size={15} />,        description: 'Formularium Nasional (Fornas) & Harga Faskes',         sourceLabel: 'FORNAS',  sourceBadge: 'fornas',  color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  practitioner: { label: 'Practitioner', icon: <UserRound size={15} />,   description: 'Data dokter & tenaga medis per Faskes',               sourceLabel: 'Lokal',   sourceBadge: 'lokal',   color: '#d97706', bg: 'rgba(245,158,11,0.1)' },
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function MasterDataPanel() {
  const [activeCategory, setActiveCategory] = useState<MasterCategory>('tindakan')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<MasterDataItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 20

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async (category: MasterCategory, q: string, p: number) => {
    setIsLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ category, q, page: String(p), pageSize: String(PAGE_SIZE) })
      const res = await fetch(`/api/master-data?${params.toString()}`)
      if (!res.ok) throw new Error('Gagal memuat data master.')
      const payload = await res.json() as { items: MasterDataItem[]; total: number; page: number; totalPages: number }
      setItems(payload.items)
      setTotal(payload.total)
      setTotalPages(payload.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data.')
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [PAGE_SIZE])

  useEffect(() => {
    setQuery('')
    setPage(1)
    void fetchData(activeCategory, '', 1)
  }, [activeCategory, fetchData])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      void fetchData(activeCategory, query, 1)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, activeCategory, fetchData])

  const meta = CATEGORY_META[activeCategory]
  const categories = Object.keys(CATEGORY_META) as MasterCategory[]

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-6)' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(20,184,166,0.05))', border: '1px solid rgba(20,184,166,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-600)', flexShrink: 0 }}>
            <Database size={22} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>Manajemen Referensi Klinis</div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Master Data <span style={{ background: 'linear-gradient(90deg, var(--color-primary-600), var(--color-info-500))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Klinis</span>
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Data referensi ICD-10, INA-CBG, FORNAS, dan Practitioner sebagai dasar validasi AI.
            </p>
          </div>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(20,184,166,0.07)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 'var(--radius-md)', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary-600)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary-500)', display: 'inline-block', boxShadow: '0 0 6px rgba(20,184,166,0.5)' }} />
          Database Lokal · {total.toLocaleString('id-ID')} data
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: '4px solid var(--color-primary-500)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4) var(--space-5)' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(20,184,166,0.1)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Database size={18} />
        </div>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Source of Truth — Master Data Lokal</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Seluruh data diambil dari tabel{' '}
            <code style={{ fontSize: '0.78rem', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '1px 6px', fontFamily: 'monospace', color: 'var(--color-primary-500)' }}>MasterDiagnosis</code>,{' '}
            <code style={{ fontSize: '0.78rem', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '1px 6px', fontFamily: 'monospace', color: 'var(--color-primary-500)' }}>MasterProcedure</code>,{' '}
            <code style={{ fontSize: '0.78rem', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '1px 6px', fontFamily: 'monospace', color: 'var(--color-primary-500)' }}>MasterMedication</code>,{' '}
            <code style={{ fontSize: '0.78rem', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '1px 6px', fontFamily: 'monospace', color: 'var(--color-primary-500)' }}>MasterPractitioner</code>.
            Validasi AI menggunakan data ini secara langsung.
          </div>
        </div>
      </div>

      {/* ── Main Table Container ── */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflowX: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>

        {/* Toolbar: tabs + search */}
        <div style={{ padding: 'var(--space-5)', borderBottom: '2px solid var(--bg-base)' }}>

          {/* Row 1: Category segmented tabs */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '2px' }}>Kategori Referensi</div>
              </div>
              <button
                type="button"
                onClick={() => { setQuery(''); setPage(1); void fetchData(activeCategory, '', 1) }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
            <div style={{ display: 'flex', background: 'var(--bg-base)', padding: '5px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', gap: '4px' }}>
              {categories.map((cat) => {
                const m = CATEGORY_META[cat]
                const isActive = activeCategory === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    role="tab"
                    aria-selected={isActive}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: 'calc(var(--radius-md) - 4px)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontWeight: isActive ? 700 : 600,
                      fontSize: '0.875rem',
                      background: isActive ? 'var(--bg-elevated)' : 'transparent',
                      color: isActive ? m.color : 'var(--text-secondary)',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', width: '15px', height: '15px', flexShrink: 0, color: isActive ? m.color : 'var(--text-muted)' }}>{m.icon}</span>
                    {m.label}
                    {isActive && (
                      <span style={{ marginLeft: '4px', fontSize: '0.72rem', fontWeight: 800, background: m.bg, color: m.color, padding: '1px 8px', borderRadius: 'var(--radius-sm)' }}>{total.toLocaleString('id-ID')}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Row 2: Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              id="master-data-search"
              type="search"
              className="form-input"
              placeholder={`Cari ${meta.label.toLowerCase()} berdasarkan kode, nama, atau deskripsi...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={`Cari ${meta.label}`}
              style={{ paddingLeft: '40px', paddingRight: query ? '40px' : '14px', margin: 0, width: '100%', borderRadius: 'var(--radius-md)' }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Hapus pencarian"
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2px 4px', borderRadius: '4px' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Results header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px var(--space-5)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            {isLoading ? 'Memuat…' : (
              <>{items.length} dari <strong style={{ color: 'var(--text-primary)' }}>{total.toLocaleString('id-ID')}</strong> {meta.label.toLowerCase()} ditampilkan{query.trim().length >= 1 && ` · filter: "${query}"`}</>
            )}
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '4px' }}>Sumber:</span>
            {(['icd10', 'ina-cbg', 'fornas', 'lokal'] as const).map((badge) => (
              <span key={badge} className={`md-source-badge ${badge}`}>{badge.toUpperCase()}</span>
            ))}
          </div>
        </div>

        {/* ── Loading State ── */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12) 0', gap: 'var(--space-3)' }}>
            <div style={{ color: 'var(--color-primary-500)', animation: 'spin 1s linear infinite' }}>
              <Loader2 size={32} />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Memuat data dari database…</p>
          </div>
        )}

        {/* ── Error State ── */}
        {error && !isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12) 0', gap: 'var(--space-3)' }}>
            <div style={{ color: 'var(--color-danger-500)' }}><AlertCircle size={32} /></div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Gagal Memuat Data</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{error}</p>
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && !error && items.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12) 0', gap: 'var(--space-3)' }}>
            <div style={{ color: 'var(--text-muted)' }}><Search size={32} /></div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {query ? `Tidak ada hasil untuk "${query}"` : 'Belum ada data'}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {query ? 'Coba gunakan kode atau kata kunci lain.' : `Belum ada ${meta.label.toLowerCase()} di database. Jalankan seeder untuk mengisi data awal.`}
            </p>
          </div>
        )}

        {/* ── Table ── */}
        {!isLoading && !error && items.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '820px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-base)', borderBottom: '2px solid var(--border-strong)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-5)', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '120px' }}>Kode</th>
                <th style={{ padding: 'var(--space-3) var(--space-5)', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nama / Deskripsi</th>
                <th style={{ padding: 'var(--space-3) var(--space-5)', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '180px', textAlign: 'right' }}>Tarif Dasar</th>
                <th style={{ padding: 'var(--space-3) var(--space-5)', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '110px', textAlign: 'center' }}>Sumber</th>
                <th style={{ padding: 'var(--space-3) var(--space-5)', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '90px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: item.isActive ? 1 : 0.55, background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                  {/* Code */}
                  <td style={{ padding: 'var(--space-3) var(--space-5)', verticalAlign: 'top' }}>
                    <code style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700, color: meta.color, background: meta.bg, padding: '2px 8px', borderRadius: '4px' }}>{item.code}</code>
                  </td>

                  {/* Name + desc + tags */}
                  <td style={{ padding: 'var(--space-3) var(--space-5)', verticalAlign: 'top' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: item.description ? '4px' : 0 }}>{item.name}</div>
                    {item.description && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: item.tags?.length ? '6px' : 0 }}>{item.description}</div>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {item.tags.map((tag) => (
                          <span key={tag} style={{ fontSize: '0.7rem', fontWeight: 600, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '1px 8px', borderRadius: 'var(--radius-sm)' }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Tariff */}
                  <td style={{ padding: 'var(--space-3) var(--space-5)', verticalAlign: 'top', textAlign: 'right' }}>
                    {item.baseTariff != null ? (
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(item.baseTariff)}</div>
                        {item.unit && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>/ {item.unit}</div>}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>N/A</span>
                    )}
                  </td>

                  {/* Source badge */}
                  <td style={{ padding: 'var(--space-3) var(--space-5)', verticalAlign: 'middle', textAlign: 'center' }}>
                    <span className={`md-source-badge ${CATEGORY_META[item.category].sourceBadge}`}>{CATEGORY_META[item.category].sourceLabel}</span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: 'var(--space-3) var(--space-5)', verticalAlign: 'middle', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: item.isActive ? 'var(--color-success-50)' : 'var(--bg-base)',
                      color: item.isActive ? 'var(--color-success-700)' : 'var(--text-muted)',
                      border: `1px solid ${item.isActive ? 'var(--color-success-200)' : 'var(--border-subtle)'}`,
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.isActive ? 'var(--color-success-500)' : 'var(--text-muted)', flexShrink: 0 }} />
                      {item.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer: Pagination + Source legend */}
        {!isLoading && !error && items.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>

            {/* Pagination row */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Halaman <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> dari <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
                  <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>({total.toLocaleString('id-ID')} total)</span>
                </span>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  {/* First page */}
                  <button
                    onClick={() => { setPage(1); void fetchData(activeCategory, query, 1) }}
                    disabled={page <= 1}
                    style={{ padding: '5px 10px', fontSize: '0.82rem', fontWeight: 600, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: page <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
                  >«</button>
                  {/* Prev */}
                  <button
                    onClick={() => { const p = page - 1; setPage(p); void fetchData(activeCategory, query, p) }}
                    disabled={page <= 1}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', fontSize: '0.82rem', fontWeight: 600, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: page <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>

                  {/* Page number pills */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                    const p = start + i
                    return p <= totalPages ? (
                      <button
                        key={p}
                        onClick={() => { setPage(p); void fetchData(activeCategory, query, p) }}
                        style={{ minWidth: '34px', padding: '5px 8px', fontSize: '0.82rem', fontWeight: p === page ? 800 : 500, border: '1px solid', borderColor: p === page ? 'var(--color-primary-500)' : 'var(--border-default)', borderRadius: 'var(--radius-md)', background: p === page ? 'var(--color-primary-500)' : 'var(--bg-surface)', color: p === page ? '#fff' : 'var(--text-secondary)', cursor: 'pointer' }}
                      >
                        {p}
                      </button>
                    ) : null
                  })}

                  {/* Next */}
                  <button
                    onClick={() => { const p = page + 1; setPage(p); void fetchData(activeCategory, query, p) }}
                    disabled={page >= totalPages}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', fontSize: '0.82rem', fontWeight: 600, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                  {/* Last page */}
                  <button
                    onClick={() => { setPage(totalPages); void fetchData(activeCategory, query, totalPages) }}
                    disabled={page >= totalPages}
                    style={{ padding: '5px 10px', fontSize: '0.82rem', fontWeight: 600, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
                  >»</button>
                </div>
              </div>
            )}

            {/* Source legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-3) var(--space-5)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sumber data:</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}><span style={{ fontWeight: 700 }}>ICD-10</span> — Diagnosis WHO</span>
              <span style={{ color: 'var(--border-subtle)' }}>·</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}><span style={{ fontWeight: 700 }}>INA-CBG</span> — Tarif Tindakan</span>
              <span style={{ color: 'var(--border-subtle)' }}>·</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}><span style={{ fontWeight: 700 }}>FORNAS</span> — Formularium Obat</span>
              <span style={{ color: 'var(--border-subtle)' }}>·</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}><span style={{ fontWeight: 700 }}>Lokal</span> — Practitioner Faskes</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

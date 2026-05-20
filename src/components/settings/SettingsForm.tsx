'use client'

import { useState, useEffect, useRef } from 'react'
import { Settings, ShieldAlert, CheckCircle, AlertTriangle, RefreshCw, HelpCircle, Percent, Clock, Cpu, ChevronDown, Eye, EyeOff, Lock, X, Server, Zap, KeyRound } from 'lucide-react'

interface SettingRow {
  key: string
  value: string
  label: string
  category: string
}

interface ToastState {
  show: boolean
  message: string
  type: 'success' | 'error'
}

// ─── Vercel model options (mirrors vercel-ai-gateway.ts) ─────────────────────
const VERCEL_MODELS = [
  { value: 'openai/gpt-4o',                           label: 'GPT-4o',                       provider: 'OpenAI' },
  { value: 'openai/gpt-4o-mini',                      label: 'GPT-4o Mini',                  provider: 'OpenAI' },
  { value: 'anthropic/claude-sonnet-4-5',             label: 'Claude Sonnet 4.5',            provider: 'Anthropic' },
  { value: 'anthropic/claude-haiku-3-5',              label: 'Claude Haiku 3.5',             provider: 'Anthropic' },
  { value: 'google/gemini-2.0-flash',                 label: 'Gemini 2.0 Flash',             provider: 'Google' },
  { value: 'google/gemini-2.5-flash-preview-05-20',   label: 'Gemini 2.5 Flash Preview',     provider: 'Google' },
]

// ─── Daily-rotating password helper ─────────────────────────────────────────
function getTodayPassword(): string {
  const now = new Date()
  const dd   = String(now.getDate()).padStart(2, '0')
  const mm   = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = String(now.getFullYear())
  return `nuralim${dd}${mm}${yyyy}!`
}

// ─── Engine Login Modal ───────────────────────────────────────────────────────
interface EngineLoginModalProps {
  onSuccess: () => void
  onClose: () => void
}
function EngineLoginModal({ onSuccess, onClose }: EngineLoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [shaking,  setShaking]  = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { usernameRef.current?.focus() }, [])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (username === 'nuralim' && password === getTodayPassword()) {
      onSuccess()
    } else {
      setError('Username atau password salah.')
      setShaking(true)
      setTimeout(() => setShaking(false), 600)
    }
  }

  return (
    <div className="engine-modal-backdrop" onClick={onClose}>
      <div
        className={`engine-modal-card ${shaking ? 'engine-modal-shake' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="engine-modal-title"
      >
        {/* Close */}
        <button className="engine-modal-close" onClick={onClose} aria-label="Tutup">
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="engine-modal-icon-ring" aria-hidden="true">
          <Lock size={22} />
        </div>

        <h2 id="engine-modal-title" className="engine-modal-title">Akses Engine AI</h2>
        <p className="engine-modal-subtitle">Masukkan kredensial untuk melihat konfigurasi engine yang aktif.</p>

        <form onSubmit={handleLogin} className="engine-modal-form">
          <div className="engine-field">
            <label htmlFor="eng-username">Username</label>
            <input
              id="eng-username"
              ref={usernameRef}
              type="text"
              autoComplete="username"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError('') }}
              className="engine-input"
            />
          </div>
          <div className="engine-field">
            <label htmlFor="eng-password">Password</label>
            <div className="engine-input-wrap">
              <input
                id="eng-password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                className="engine-input"
              />
              <button
                type="button"
                className="engine-eye-btn"
                onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="engine-error" role="alert">
              <ShieldAlert size={14} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="engine-login-btn">
            <KeyRound size={15} />
            Masuk
          </button>
        </form>
      </div>
    </div>
  )
}

export function SettingsForm() {
  const [settings, setSettings] = useState<SettingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isEngineAuthenticated, setIsEngineAuthenticated] = useState(false)

  // Load settings on mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json() as { settings: SettingRow[] }
        setSettings(data.settings)
      } else {
        showToast('Gagal memuat pengaturan.', 'error')
      }
    } catch (err) {
      console.error('[Settings] Gagal memuat pengaturan:', err instanceof Error ? err.message : 'unknown error')
      showToast('Terjadi kesalahan jaringan.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }))
    }, 4000)
  }

  const handleSliderChange = (key: string, val: number) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: val.toString() } : s))
    )
  }

  const handleInputChange = (key: string, valStr: string) => {
    const val = parseFloat(valStr)
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value: val.toString() } : s))
      )
    }
  }

  const handleStringChange = (key: string, val: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: val } : s))
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const updates: Record<string, string> = {}
      settings.forEach((s) => {
        updates[s.key] = s.value
      })

      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })

      const data = await res.json() as { message: string }
      if (res.ok) {
        showToast('Semua pengaturan berhasil disimpan.', 'success')
      } else {
        showToast(data.message || 'Gagal menyimpan pengaturan.', 'error')
      }
    } catch (err) {
      console.error('[Settings] Gagal menyimpan pengaturan:', err instanceof Error ? err.message : 'unknown error')
      showToast('Gagal menyimpan ke server.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="settings-loading-container">
        <RefreshCw className="spinner" size={32} />
        <p>Memuat konfigurasi AI brain...</p>
      </div>
    )
  }

  // Group settings by category
  const procedureSettings = settings.filter((s) => s.category === 'threshold_procedure')
  const medicationSettings = settings.filter((s) => s.category === 'threshold_medication')
  const losSettings        = settings.filter((s) => s.category === 'threshold_los')
  const aiProviderSettings = settings.filter((s) => s.category === 'ai_provider')

  const activeProvider    = aiProviderSettings.find((s) => s.key === 'ai_provider')?.value ?? 'sumopod'
  const sumopodModel      = aiProviderSettings.find((s) => s.key === 'ai_sumopod_model')?.value ?? 'gpt-4o-mini'
  const vercelModel       = aiProviderSettings.find((s) => s.key === 'ai_vercel_model')?.value ?? 'openai/gpt-4o-mini'
  const selectedVercelLabel = VERCEL_MODELS.find((m) => m.value === vercelModel)?.label ?? vercelModel

  return (
    <div className="settings-container animate-in">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`settings-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="settings-header-block">
        <div className="settings-title-group">
          <div className="settings-icon-bg">
            <Settings size={22} />
          </div>
          <div>
            <h1>Konfigurasi AI Brain</h1>
            <p>Atur provider AI, model, dan batas toleransi biaya/LOS untuk deteksi deviasi oleh Brain AI.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          {!isEngineAuthenticated ? (
            <button
              type="button"
              className="btn btn-ghost engine-view-btn"
              onClick={() => setShowLoginModal(true)}
              title="Akses konfigurasi engine AI"
            >
              <Eye size={15} />
              Lihat Engine AI
            </button>
          ) : (
            <span className="engine-status-badge on" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', fontSize: '0.8rem' }}>
              <Lock size={12} />
              Engine Terbuka
            </span>
          )}
          <button
            className="btn btn-primary settings-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <RefreshCw className="spinner" size={16} /> : null}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {/* Engine Login Modal */}
      {showLoginModal && (
        <EngineLoginModal
          onSuccess={() => {
            setIsEngineAuthenticated(true)
            setShowLoginModal(false)
          }}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      <div className="settings-grid">
        {/* Left Column - Forms */}
        <div className="settings-sections-list">

          {/* ── AI Provider Card ─────────────────────────────────────── */}
          {isEngineAuthenticated && (
          <div className="settings-card" style={{ borderColor: 'var(--color-primary-500)', borderWidth: '1.5px' }}>
            <div className="card-header">
              <div className="card-badge" style={{ background: 'rgba(20,184,166,0.15)', color: 'var(--color-primary-500)' }}>
                <Cpu size={14} />
              </div>
              <div>
                <h2>AI Provider</h2>
                <p>Pilih provider AI dan konfigurasi model. Klik kartu untuk mengaktifkan.</p>
              </div>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* SumoPod Card */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleStringChange('ai_provider', 'sumopod')}
                onKeyDown={(e) => e.key === 'Enter' && handleStringChange('ai_provider', 'sumopod')}
                style={{
                  border: `2px solid ${activeProvider === 'sumopod' ? 'var(--color-primary-500)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-lg)',
                  background: activeProvider === 'sumopod' ? 'rgba(20,184,166,0.06)' : 'var(--bg-base)',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  outline: 'none',
                  position: 'relative',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Cpu size={16} color="white" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>SumoPod AI</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>ai.sumopod.com/v1 · Provider Utama</p>
                    </div>
                  </div>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${activeProvider === 'sumopod' ? 'var(--color-primary-500)' : 'var(--border-default)'}`,
                    background: activeProvider === 'sumopod' ? 'var(--color-primary-500)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {activeProvider === 'sumopod' && <CheckCircle size={12} color="white" />}
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.55 }}>
                  Provider utama. Jika SumoPod tidak merespons, sistem <strong>otomatis fallback</strong> ke Vercel AI Gateway tanpa intervensi manual.
                </p>

                {/* Model field — inline, always visible */}
                <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Model
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={sumopodModel}
                      onChange={(e) => handleStringChange('ai_sumopod_model', e.target.value)}
                      placeholder="gpt-4o-mini"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${activeProvider === 'sumopod' ? 'var(--color-primary-400)' : 'var(--border-subtle)'}`,
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                    Contoh: <code style={{ fontFamily: 'monospace' }}>gpt-4o-mini</code> · <code style={{ fontFamily: 'monospace' }}>kimi-k2.6</code> · <code style={{ fontFamily: 'monospace' }}>claude-3-5-sonnet-20241022</code>
                  </p>
                </div>

                {activeProvider === 'sumopod' && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-primary-400)', fontWeight: 600 }}>
                    <CheckCircle size={13} /> Provider aktif · Fallback ke Vercel otomatis jika gagal
                  </div>
                )}
              </div>

              {/* Vercel AI Gateway Card */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleStringChange('ai_provider', 'vercel')}
                onKeyDown={(e) => e.key === 'Enter' && handleStringChange('ai_provider', 'vercel')}
                style={{
                  border: `2px solid ${activeProvider === 'vercel' ? 'var(--color-primary-500)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-lg)',
                  background: activeProvider === 'vercel' ? 'rgba(20,184,166,0.06)' : 'var(--bg-base)',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  outline: 'none',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #000, #333)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ color: 'white', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '-0.05em' }}>▲</span>
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>Vercel AI Gateway</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>ai-gateway.vercel.sh/v1 · Fallback / Mode Langsung</p>
                    </div>
                  </div>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${activeProvider === 'vercel' ? 'var(--color-primary-500)' : 'var(--border-default)'}`,
                    background: activeProvider === 'vercel' ? 'var(--color-primary-500)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {activeProvider === 'vercel' && <CheckCircle size={12} color="white" />}
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.55 }}>
                  Akses langsung ke Vercel AI Gateway — mendukung model dari OpenAI, Anthropic, dan Google. Butuh <code style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>VERCEL_AI_GATEWAY_API_KEY</code> di server.
                </p>

                {/* Model dropdown — inline */}
                <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Model
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={vercelModel}
                      onChange={(e) => handleStringChange('ai_vercel_model', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 34px 8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${activeProvider === 'vercel' ? 'var(--color-primary-400)' : 'var(--border-subtle)'}`,
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        appearance: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      {Object.entries(
                        VERCEL_MODELS.reduce<Record<string, typeof VERCEL_MODELS>>((acc, m) => {
                          ;(acc[m.provider] ??= []).push(m)
                          return acc
                        }, {})
                      ).map(([prov, models]) => (
                        <optgroup key={prov} label={`── ${prov} ──`}>
                          {models.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>
                    {vercelModel}
                  </p>
                </div>

                {activeProvider === 'vercel' && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-warning-400)', fontWeight: 600 }}>
                    <AlertTriangle size={13} /> Mode langsung — pastikan API key sudah dikonfigurasi
                  </div>
                )}
              </div>

            </div>
          </div>
          )}


          {/* Category: Tindakan */}
          <div className="settings-card">
            <div className="card-header">
              <div className="card-badge procedure"><Percent size={14} /></div>
              <div>
                <h2>Threshold Tagihan Tindakan</h2>
                <p>Batas toleransi deviasi harga tindakan medis dibanding tarif dasar master data lokal.</p>
              </div>
            </div>
            <div className="card-body">
              {procedureSettings.map((s) => {
                const isOvercharge = s.key.includes('overcharge')
                return (
                  <div key={s.key} className="setting-row">
                    <div className="row-meta">
                      <label>{s.label}</label>
                      <span className="row-desc">
                        {isOvercharge
                          ? 'Memicu alert jika biaya input melebihi tarif dasar di atas persentase ini.'
                          : 'Memicu alert jika biaya input di bawah tarif dasar melebihi persentase ini.'}
                      </span>
                    </div>
                    <div className="row-controls">
                      <input
                        type="range" min="0" max="100" value={s.value}
                        onChange={(e) => handleSliderChange(s.key, parseInt(e.target.value))}
                        className="settings-slider"
                      />
                      <div className="value-box">
                        <input
                          type="number" value={s.value}
                          onChange={(e) => handleInputChange(s.key, e.target.value)}
                          min="0" max="100"
                        />
                        <span>%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Category: Obat */}
          <div className="settings-card">
            <div className="card-header">
              <div className="card-badge medication"><Percent size={14} /></div>
              <div>
                <h2>Threshold Tagihan Obat</h2>
                <p>Batas toleransi deviasi harga obat-obatan dibanding tarif dasar master data lokal.</p>
              </div>
            </div>
            <div className="card-body">
              {medicationSettings.map((s) => {
                const isOvercharge = s.key.includes('overcharge')
                return (
                  <div key={s.key} className="setting-row">
                    <div className="row-meta">
                      <label>{s.label}</label>
                      <span className="row-desc">
                        {isOvercharge
                          ? 'Memicu alert jika harga obat input melebihi harga master di atas persentase ini.'
                          : 'Memicu alert jika harga obat input di bawah harga master melebihi persentase ini.'}
                      </span>
                    </div>
                    <div className="row-controls">
                      <input
                        type="range" min="0" max="100" value={s.value}
                        onChange={(e) => handleSliderChange(s.key, parseInt(e.target.value))}
                        className="settings-slider"
                      />
                      <div className="value-box">
                        <input
                          type="number" value={s.value}
                          onChange={(e) => handleInputChange(s.key, e.target.value)}
                          min="0" max="100"
                        />
                        <span>%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Category: LOS */}
          <div className="settings-card">
            <div className="card-header">
              <div className="card-badge los"><Clock size={14} /></div>
              <div>
                <h2>Threshold Length of Stay (LOS)</h2>
                <p>Batas toleransi penyimpangan hari rawat dibanding standar estimasi LOS klinis diagnosa utama.</p>
              </div>
            </div>
            <div className="card-body">
              {losSettings.map((s) => {
                const isOvercharge = s.key.includes('overcharge')
                return (
                  <div key={s.key} className="setting-row">
                    <div className="row-meta">
                      <label>{s.label}</label>
                      <span className="row-desc">
                        {isOvercharge
                          ? 'Batas deviasi overstay (rawat inap terlalu lama).'
                          : 'Batas deviasi understay (pulang terlalu dini / prematur).'}
                      </span>
                    </div>
                    <div className="row-controls">
                      <input
                        type="range" min="0" max="100" value={s.value}
                        onChange={(e) => handleSliderChange(s.key, parseInt(e.target.value))}
                        className="settings-slider"
                      />
                      <div className="value-box">
                        <input
                          type="number" value={s.value}
                          onChange={(e) => handleInputChange(s.key, e.target.value)}
                          min="0" max="100"
                        />
                        <span>%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* Right Column - Explainers & Simulation */}
        <div className="settings-simulation-sidebar">

          {/* AI Provider Status */}
          {isEngineAuthenticated && (
          <div className="sim-card" style={{ borderColor: 'var(--color-primary-500)', marginBottom: 'var(--space-4)' }}>
            <div className="sim-header">
              <Cpu size={18} />
              <h3>Status Provider AI</h3>
            </div>
            <div className="sim-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  background: activeProvider === 'sumopod' ? 'rgba(20,184,166,0.1)' : 'var(--bg-base)',
                  border: `1px solid ${activeProvider === 'sumopod' ? 'var(--color-primary-500)' : 'var(--border-subtle)'}`,
                }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0 }}>SumoPod AI</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>{sumopodModel}</p>
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: activeProvider === 'sumopod' ? 'rgba(20,184,166,0.2)' : 'var(--bg-surface)',
                    color: activeProvider === 'sumopod' ? 'var(--color-primary-400)' : 'var(--text-muted)',
                    border: `1px solid ${activeProvider === 'sumopod' ? 'var(--color-primary-500)' : 'var(--border-subtle)'}`,
                  }}>
                    {activeProvider === 'sumopod' ? 'AKTIF' : 'STANDBY'}
                  </span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  background: activeProvider === 'vercel' ? 'rgba(20,184,166,0.1)' : 'var(--bg-base)',
                  border: `1px solid ${activeProvider === 'vercel' ? 'var(--color-primary-500)' : 'var(--border-subtle)'}`,
                }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0 }}>Vercel AI Gateway</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>{vercelModel}</p>
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: activeProvider === 'vercel' ? 'rgba(20,184,166,0.2)' : 'var(--bg-surface)',
                    color: activeProvider === 'vercel' ? 'var(--color-primary-400)' : 'var(--text-muted)',
                    border: `1px solid ${activeProvider === 'vercel' ? 'var(--color-primary-500)' : 'var(--border-subtle)'}`,
                  }}>
                    {activeProvider === 'vercel' ? 'AKTIF' : activeProvider === 'sumopod' ? 'FALLBACK' : 'STANDBY'}
                  </span>
                </div>
                {activeProvider === 'sumopod' && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                    ↺ Jika SumoPod gagal merespons, sistem otomatis fallback ke Vercel AI Gateway tanpa perlu intervensi manual.
                  </p>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Simulation */}
          <div className="sim-card">
            <div className="sim-header">
              <HelpCircle size={18} />
              <h3>Visualisasi & Simulasi</h3>
            </div>
            <div className="sim-body">
              <p className="sim-intro">Simulasi bagaimana AI Brain menggunakan threshold untuk memproses data input:</p>

              <div className="sim-box">
                <h4>Simulasi Tindakan / Obat</h4>
                <div className="sim-details">
                  <div className="sim-line">
                    <span className="label">Harga Master</span>
                    <span className="value font-mono">Rp 100.000</span>
                  </div>
                  <div className="sim-line">
                    <span className="label">Threshold Overcharge</span>
                    <span className="value font-mono">{procedureSettings.find(s => s.key === 'threshold_procedure_overcharge_pct')?.value || '20'}%</span>
                  </div>
                  <div className="sim-line border-t pt-2">
                    <span className="label text-highlight">Batas Maks. Wajar</span>
                    <span className="value text-highlight font-mono">
                      Rp {(100000 * (1 + (parseInt(procedureSettings.find(s => s.key === 'threshold_procedure_overcharge_pct')?.value || '20') / 100))).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="sim-note mt-3">
                    Setiap harga tindakan input <strong>di atas</strong> batas maks. wajar ini otomatis ditandai sebagai <strong>[🚨 Overcharge]</strong>.
                  </p>
                </div>
              </div>

              <div className="sim-box mt-4">
                <h4>Simulasi Length of Stay (LOS)</h4>
                <div className="sim-details">
                  <div className="sim-line">
                    <span className="label">Standar Diagnosa (e.g. CAP)</span>
                    <span className="value font-mono">5 Hari</span>
                  </div>
                  <div className="sim-line">
                    <span className="label">Threshold Overstay</span>
                    <span className="value font-mono">{losSettings.find(s => s.key === 'threshold_los_overcharge_pct')?.value || '20'}%</span>
                  </div>
                  <div className="sim-line border-t pt-2">
                    <span className="label text-highlight">Maks. Hari Wajar</span>
                    <span className="value text-highlight font-mono">
                      {Math.ceil(5 * (1 + (parseInt(losSettings.find(s => s.key === 'threshold_los_overcharge_pct')?.value || '20') / 100)))} Hari
                    </span>
                  </div>
                  <p className="sim-note mt-3 text-warning">
                    <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    Jika pasien dirawat lebih dari batas di atas, AI akan mencatatnya sebagai <strong>overstay</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

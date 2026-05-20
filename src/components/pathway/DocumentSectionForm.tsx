'use client'

import React, { useRef, useState } from 'react'
import { FileUp, FileText, CheckCircle2, AlertCircle, Trash2, Zap, Loader2, ExternalLink } from 'lucide-react'
import { SectionHeader } from '@/components/ui/PathwayPrimitives'
import type { SupportingDocument } from '@/types/clinical-pathway'

interface DocumentSectionFormProps {
  items: SupportingDocument[]
  onChange: (items: SupportingDocument[]) => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function DocumentSectionForm({ items, onChange }: DocumentSectionFormProps) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Track per-document upload state: uploading | error message
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set())
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})

  // ─── Helpers ───────────────────────────────────────────────

  const setUploading = (id: string, loading: boolean) => {
    setUploadingIds(prev => {
      const next = new Set(prev)
      loading ? next.add(id) : next.delete(id)
      return next
    })
  }

  const setError = (id: string, message: string | null) => {
    setUploadErrors(prev => {
      if (message === null) {
        const { [id]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: message }
    })
  }

  // ─── Upload to Supabase via API route ──────────────────────

  const uploadToStorage = async (id: string, file: File): Promise<void> => {
    setUploading(id, true)
    setError(id, null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('docId', id)

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const payload = await res.json() as {
        path?: string
        publicUrl?: string
        fileName?: string
        fileSize?: string
        error?: string
      }

      if (!res.ok || !payload.path) {
        throw new Error(payload.error ?? 'Upload gagal. Silakan coba lagi.')
      }

      // Update state with real storage metadata
      const updated = items.map(doc => {
        if (doc.id === id) {
          return {
            ...doc,
            file_name: payload.fileName ?? file.name,
            file_size: payload.fileSize ?? formatBytes(file.size),
            uploaded_at: new Date().toISOString(),
            status: 'available' as const,
            storage_path: payload.path,
            public_url: payload.publicUrl,
            // Reset AI verification since file changed
            verification_status: undefined,
            verification_note: undefined,
          }
        }
        return doc
      })
      onChange(updated)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat upload.'
      setError(id, message)
    } finally {
      setUploading(id, false)
      // Reset the file input so the same file can be re-selected after a failed upload
      if (fileInputRefs.current[id]) {
        fileInputRefs.current[id]!.value = ''
      }
    }
  }

  // ─── Delete from Supabase storage ──────────────────────────

  const deleteFromStorage = async (storagePath: string): Promise<void> => {
    try {
      await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: storagePath }),
      })
      // Silently ignore errors — local state is cleared regardless
    } catch {
      // Swallow — file might already be gone or network hiccup
    }
  }

  // ─── Event Handlers ────────────────────────────────────────

  const handleUploadClick = (id: string) => {
    fileInputRefs.current[id]?.click()
  }

  const handleFileChange = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadToStorage(id, file)
  }

  const handleDrop = async (id: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    await uploadToStorage(id, file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleClearFile = async (doc: SupportingDocument, e: React.MouseEvent) => {
    e.stopPropagation()

    // If there is a real storage path, delete the file from Supabase
    if (doc.storage_path) {
      void deleteFromStorage(doc.storage_path)
    }

    const updated = items.map(d => {
      if (d.id === doc.id) {
        return {
          ...d,
          file_name: null,
          file_size: null,
          uploaded_at: null,
          status: 'missing' as const,
          storage_path: undefined,
          public_url: undefined,
          verification_status: undefined,
          verification_note: undefined,
        }
      }
      return d
    })
    setError(doc.id, null)
    onChange(updated)
  }

  // Fill all with demo metadata (no real upload)
  const handleFillDemoFiles = () => {
    const demoNames: Record<string, string> = {
      ktp: 'ktp_pasien_demo.pdf',
      bpjs: 'kartu_bpjs_aktif_nasional.jpg',
      spri: 'spri_inpatient_order_signed.pdf',
      rujukan: 'rujukan_faskes1_terbuka.pdf',
      resume_medis: 'resume_medis_terakhir_dr_cipto.pdf',
    }
    const demoSizes: Record<string, string> = {
      ktp: '820 KB',
      bpjs: '1.4 MB',
      spri: '1.1 MB',
      rujukan: '950 KB',
      resume_medis: '2.1 MB',
    }
    const updated = items.map(doc => ({
      ...doc,
      file_name: demoNames[doc.id] ?? `${doc.id}_demo_file.pdf`,
      file_size: demoSizes[doc.id] ?? '500 KB',
      uploaded_at: new Date().toISOString(),
      status: 'available' as const,
      // No storage_path/public_url since this is demo-only
      storage_path: undefined,
      public_url: undefined,
      verification_status: undefined,
      verification_note: undefined,
    }))
    onChange(updated)
  }

  // ─── Render ────────────────────────────────────────────────

  const requiredCount = items.filter(d => d.required).length
  const uploadedRequired = items.filter(d => d.required && d.file_name).length

  return (
    <div className="form-card animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
        <SectionHeader
          icon="DF"
          iconColor="violet"
          title="Dokumen Pendukung Registrasi"
          desc="Unggah berkas rekam medis dan administrasi pasien untuk audit clinical pathway otomatis."
        />
        <button
          type="button"
          onClick={handleFillDemoFiles}
          className="btn btn-ghost btn-sm"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: 'var(--color-primary-500)', border: '1px solid var(--color-primary-200)',
            background: 'rgba(99, 102, 241, 0.05)', fontWeight: 700,
            borderRadius: 'var(--radius-md)', padding: '8px 14px',
            cursor: 'pointer', transition: 'all var(--transition-fast)',
          }}
        >
          <Zap size={14} /> Gunakan File Contoh
        </button>
      </div>

      {/* Progress summary */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        background: uploadedRequired === requiredCount
          ? 'rgba(34, 197, 94, 0.06)'
          : 'rgba(245, 158, 11, 0.06)',
        border: `1px solid ${uploadedRequired === requiredCount
          ? 'rgba(34, 197, 94, 0.2)'
          : 'rgba(245, 158, 11, 0.2)'}`,
        borderRadius: 'var(--radius-md)', padding: '10px var(--space-4)',
        marginTop: 'var(--space-4)', marginBottom: 'var(--space-5)',
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
          background: uploadedRequired === requiredCount
            ? 'rgba(34, 197, 94, 0.15)'
            : 'rgba(245, 158, 11, 0.15)',
          color: uploadedRequired === requiredCount
            ? 'var(--color-success-500)'
            : 'var(--color-warning-500)',
        }}>
          {uploadedRequired === requiredCount
            ? <CheckCircle2 size={18} />
            : <AlertCircle size={18} />}
        </span>
        <div>
          <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {uploadedRequired === requiredCount
              ? 'Semua berkas wajib telah diunggah'
              : `${uploadedRequired} dari ${requiredCount} berkas wajib telah diunggah`}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            File akan disimpan di Supabase Storage dan diverifikasi secara semantik oleh AI
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {items.map(doc => {
          const isUploaded = doc.file_name !== null
          const isUploading = uploadingIds.has(doc.id)
          const errorMsg = uploadErrors[doc.id]

          return (
            <div
              key={doc.id}
              className="card-glass"
              style={{
                padding: 'var(--space-4)',
                border: `1px solid ${errorMsg
                  ? 'rgba(239, 68, 68, 0.35)'
                  : isUploaded
                    ? 'rgba(34, 197, 94, 0.25)'
                    : 'var(--border-subtle)'}`,
                background: errorMsg
                  ? 'rgba(239, 68, 68, 0.03)'
                  : isUploaded
                    ? 'rgba(34, 197, 94, 0.02)'
                    : 'var(--bg-glass)',
                borderRadius: 'var(--radius-lg)',
                display: 'grid',
                gridTemplateColumns: '1fr 300px',
                alignItems: 'center',
                gap: 'var(--space-4)',
                transition: 'all var(--transition-base)',
                opacity: isUploading ? 0.8 : 1,
              }}
            >
              {/* Document info */}
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
                  background: errorMsg
                    ? 'rgba(239, 68, 68, 0.12)'
                    : isUploaded
                      ? 'rgba(34, 197, 94, 0.12)'
                      : 'rgba(255, 255, 255, 0.04)',
                  color: errorMsg
                    ? 'var(--color-danger-500)'
                    : isUploaded
                      ? 'var(--color-success-500)'
                      : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{
                    fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 4px 0',
                    flexWrap: 'wrap',
                  }}>
                    {doc.name}
                    {doc.required && (
                      <span style={{
                        fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.12)',
                        color: 'var(--color-danger-500)', padding: '2px 6px',
                        borderRadius: '4px', fontWeight: 700,
                      }}>
                        Wajib
                      </span>
                    )}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    {doc.description}
                  </p>
                  {/* Inline error message */}
                  {errorMsg && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px',
                      fontSize: '0.75rem', color: 'var(--color-danger-500)', fontWeight: 600,
                    }}>
                      <AlertCircle size={12} />
                      {errorMsg}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload / Preview area */}
              <div>
                {isUploading ? (
                  // Uploading skeleton
                  <div style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px var(--space-4)',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    background: 'rgba(99, 102, 241, 0.04)',
                  }}>
                    <Loader2
                      size={18}
                      style={{
                        color: 'var(--color-primary-500)',
                        flexShrink: 0,
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Mengunggah ke Supabase...
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Mohon tunggu
                      </div>
                    </div>
                  </div>
                ) : isUploaded ? (
                  // File preview — real upload shows public URL link
                  <div style={{
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    background: 'rgba(34, 197, 94, 0.05)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px var(--space-4)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}>
                    <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)',
                        whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden',
                      }} title={doc.file_name!}>
                        {doc.file_name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {doc.file_size}
                        </span>
                        {doc.storage_path ? (
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700,
                            background: 'rgba(20, 184, 166, 0.12)',
                            color: 'var(--color-primary-500)',
                            padding: '1px 5px', borderRadius: '4px',
                          }}>
                            ☁ Tersimpan
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700,
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: 'var(--color-warning-500)',
                            padding: '1px 5px', borderRadius: '4px',
                          }}>
                            Demo
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {/* Open in browser link for real uploads */}
                      {doc.public_url && (
                        <a
                          href={doc.public_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px', color: 'var(--color-primary-500)',
                            background: 'rgba(99, 102, 241, 0.08)',
                            border: 'none', borderRadius: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all var(--transition-fast)', textDecoration: 'none',
                          }}
                          title="Lihat file di browser"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                      <span style={{ color: 'var(--color-success-500)', display: 'flex' }}>
                        <CheckCircle2 size={16} />
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleClearFile(doc, e)}
                        className="btn btn-ghost"
                        style={{
                          padding: '6px', color: 'var(--color-danger-500)',
                          background: 'rgba(239, 68, 68, 0.06)', border: 'none',
                          borderRadius: '6px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all var(--transition-fast)',
                        }}
                        title={doc.storage_path ? 'Hapus file dari storage' : 'Hapus file'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Empty dropzone
                  <div
                    onClick={() => handleUploadClick(doc.id)}
                    onDrop={(e) => { void handleDrop(doc.id, e) }}
                    onDragOver={handleDragOver}
                    style={{
                      border: `2px dashed ${errorMsg ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-default)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '14px var(--space-4)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                      background: 'rgba(255, 255, 255, 0.01)',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary-500)'
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.03)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = errorMsg
                        ? 'rgba(239, 68, 68, 0.4)'
                        : 'var(--border-default)'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)'
                    }}
                  >
                    <FileUp size={16} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Unggah Berkas
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Seret &amp; lepas atau klik · PDF, JPG, PNG (maks. 10 MB)
                    </span>
                    <input
                      type="file"
                      ref={el => { fileInputRefs.current[doc.id] = el }}
                      onChange={(e) => { void handleFileChange(doc.id, e) }}
                      style={{ display: 'none' }}
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

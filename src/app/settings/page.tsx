'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SettingsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/?view=settings')
  }, [router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-app)', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 500, fontSize: '0.95rem' }}>Mengarahkan ke halaman pengaturan...</p>
      </div>
    </div>
  )
}

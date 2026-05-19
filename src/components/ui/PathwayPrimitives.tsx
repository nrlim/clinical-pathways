'use client'

import type { Conformance } from '@/types/clinical-pathway'

export function ConformanceBadge({ value }: { value: Conformance | '' }) {
  if (!value) return null
  const map = {
    sesuai: { label: 'Sesuai', cls: 'sesuai' },
    tidak:  { label: 'Tidak Sesuai', cls: 'tidak' },
    review: { label: 'Perlu Review', cls: 'review' },
  }
  const item = map[value]
  return <span className={`conformance-badge ${item.cls}`}>{item.label}</span>
}

interface SectionHeaderProps {
  icon: string
  iconColor: string
  title: string
  desc: string
}

export function SectionHeader({ icon, iconColor, title, desc }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className={`section-icon ${iconColor}`}>{icon}</div>
      <div>
        <div className="section-title">{title}</div>
        <div className="section-desc">{desc}</div>
      </div>
    </div>
  )
}

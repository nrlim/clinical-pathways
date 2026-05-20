import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SnapPath | AI Integration',
  description:
    'Sistem manajemen SnapPath terintegrasi dengan platform katalog standar lokal. Digitalisasi rekam medis, validasi diagnosa, tindakan, dan obat secara komprehensif.',
  keywords: ['SnapPath', 'clinical pathway', 'rekam medis', 'ICD-10'],
  openGraph: {
    title: 'SnapPath | AI Integration',
    description: 'Digitalisasi dan validasi clinical pathway terintegrasi katalog standar.',
    locale: 'id_ID',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}

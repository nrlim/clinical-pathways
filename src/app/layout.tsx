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
  title: 'Clinical Pathway | AI Integration',
  description:
    'Sistem manajemen clinical pathway terintegrasi dengan platform master data lokal. Digitalisasi rekam medis, validasi diagnosa, tindakan, dan obat secara komprehensif.',
  keywords: ['clinical pathway', 'rekam medis', 'ICD-10'],
  openGraph: {
    title: 'Clinical Pathway | AI Integration',
    description: 'Digitalisasi dan validasi clinical pathway terintegrasi master data.',
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

'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

const PANEL_PREFIXES = [
  '/mudur', '/antrenor', '/franchise', '/veli', '/panel', '/patron',
  '/dashboard', '/tenant-site', '/auth', '/kasa', '/temizlik',
  '/kayit', '/kurulum', '/embed', '/magaza', '/personel',
  '/sozlesme', '/tesis',
]

export default function FooterWrapper() {
  const pathname = usePathname()
  const isPanel = PANEL_PREFIXES.some((p) => pathname.startsWith(p))
  if (isPanel) return null
  return <Footer />
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useAccent } from '@/lib/context/accent-context'
import {
  LogOut,
  Home,
  BarChart3,
  Bot,
  Wallet,
  LayoutTemplate,
  Store,
  ClipboardCheck,
  Menu,
  X,
  Monitor,
  Wrench,
  Shield,
} from 'lucide-react'

/** Patron paneli menüsü — sadece gerekli sayfalar */
const NAV = [
  { href: '/dashboard', label: 'Ana Sayfa', icon: Home },
  { href: '/dashboard/genis-ekran', label: 'Geniş Ekran', icon: Monitor },
  { href: '/dashboard/ozel-araclar', label: 'Özel Araçlar', icon: Wrench },
  { href: '/dashboard/celf', label: 'CELF Direktörlükleri', icon: Bot },
  { href: '/dashboard/directors', label: 'Direktörler (Canlı)', icon: Bot },
  { href: '/dashboard/onay-kuyrugu', label: 'Patron Havuzu', icon: ClipboardCheck },
  { href: '/dashboard/franchises', label: 'Franchise / Vitrin', icon: Store },
  { href: '/dashboard/kasa-defteri', label: 'Kasa Defteri', icon: Wallet },
  { href: '/dashboard/sablonlar', label: 'Şablonlar', icon: LayoutTemplate },
  { href: '/dashboard/reports', label: 'Raporlar', icon: BarChart3 },
  { href: '/dashboard/guvenlik', label: 'Güvenlik', icon: Shield },
]

export default function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { activeClass } = useAccent()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [summary, setSummary] = useState<{ athletes: number; pendingApprovals: number; newApplications: number; activeFranchises: number } | null>(null)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((r) => { if (!r.ok) throw new Error('not ok'); return r.json() })
      .then((data) => { if (typeof data.athletes === 'number') setSummary(data) })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const sidebarContent = (
    <>
      <Link href="/dashboard" className="flex items-center gap-3 mb-6 hover:opacity-90 transition-opacity group">
        <div className="relative w-10 h-10 flex-shrink-0 rounded-xl ring-2 ring-cyan-400/20 group-hover:ring-cyan-400/40 transition-all overflow-hidden">
          <Image src="/logo.png" alt="YİSA-S" fill className="object-contain p-1" />
        </div>
        <div>
          <h1 className="font-bold text-white">YİSA-S</h1>
          <p className="text-xs text-muted-foreground">Yönetici İşletmeci Sporcu Antrenör Sistemi</p>
        </div>
      </Link>

      {/* Özet */}
      {summary && (
        <div className="mb-4 flex items-center justify-between gap-2 text-xs text-muted-foreground border-b border-border pb-3">
          <span>Öğr: <span className="text-cyan-400 font-mono font-medium">{summary.athletes}</span></span>
          <span>Onay: <span className="text-amber-400 font-mono font-medium">{summary.pendingApprovals}</span></span>
          <span>Başv: <span className="text-emerald-400 font-mono font-medium">{summary.newApplications}</span></span>
          <span>Frn: <span className="text-violet-400 font-mono font-medium">{summary.activeFranchises}</span></span>
        </div>
      )}

      <nav className="space-y-1 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                active
                  ? `${activeClass} text-white ring-1 ring-cyan-400/30 shadow-[0_0_12px_-2px_rgba(34,211,238,0.25)]`
                  : 'text-muted-foreground hover:bg-muted hover:text-white'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-destructive/20 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          Çıkış Yap
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobil hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-card border border-border text-white shadow-[0_0_12px_-2px_rgba(34,211,238,0.2)]"
        aria-label="Menüyü aç"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`
          w-64 min-h-screen bg-card/95 backdrop-blur-sm border-r border-border p-4 flex flex-col
          fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-out
          shadow-[4px_0_24px_-8px_rgba(0,0,0,0.4)]
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  )
}

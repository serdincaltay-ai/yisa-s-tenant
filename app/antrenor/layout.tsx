'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PanelHeader } from '@/components/PanelHeader'
import { AntrenorBottomNav } from '@/components/PanelBottomNav'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Calendar,
  User,
  MessageSquare,
  CalendarDays,
  Ruler,
  Bell,
  Menu,
  X,
  Activity,
} from 'lucide-react'

const ANTRENOR_SIDEBAR_NAV = [
  { href: '/antrenor', label: 'Panel', icon: LayoutDashboard },
  { href: '/antrenor/sporcular', label: 'Sporcular', icon: Users },
  { href: '/antrenor/yoklama', label: 'Yoklama', icon: ClipboardCheck },
  { href: '/antrenor/bugunku-dersler', label: 'Dersler', icon: Calendar },
  { href: '/antrenor/profil', label: 'Profil', icon: User },
  { href: '/antrenor/mesajlar', label: 'Mesajlar', icon: MessageSquare },
  { href: '/antrenor/ders-programi', label: 'Program', icon: CalendarDays },
  { href: '/antrenor/olcum', label: 'Ölçüm', icon: Ruler },
  { href: '/antrenor/bildirim', label: 'Bildirimler', icon: Bell },
]

export default function AntrenorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isGirisPage = pathname === '/antrenor/giris'

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Close sidebar when viewport crosses lg breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isGirisPage) {
      setAllowed(true)
      setLoading(false)
      return
    }
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/antrenor/giris')
        return
      }
      const res = await fetch('/api/franchise/role')
      const d = await res.json()
      const role = d?.role
      if (role !== 'coach') {
        router.replace('/panel')
        return
      }
      const onayRes = await fetch('/api/sozlesme/onay')
      const onayData = await onayRes.json()
      if (onayData?.needsPersonel) {
        router.replace('/sozlesme/personel')
        return
      }
      setAllowed(true)
      setLoading(false)
    }
    check()
  }, [router, isGirisPage])

  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === '/antrenor') return pathname === '/antrenor'
    return pathname === href || pathname.startsWith(href + '/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <span className="text-zinc-400">Yükleniyor...</span>
      </div>
    )
  }

  if (!allowed) return null

  if (isGirisPage) return <>{children}</>

  return (
    <div className="min-h-screen bg-zinc-950">
      <PanelHeader panelName="ANTRENÖR PANELİ" />

      {/* Tablet sidebar toggle — visible only at md, hidden below md and at lg+ */}
      <button
        onClick={() => setSidebarOpen((prev) => !prev)}
        className="hidden md:flex lg:hidden fixed top-4 left-4 z-50 h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 shadow-lg"
        aria-label="Menüyü aç/kapat"
      >
        {sidebarOpen ? (
          <X className="h-5 w-5 text-zinc-300" />
        ) : (
          <Menu className="h-5 w-5 text-zinc-300" />
        )}
      </button>

      {/* Sidebar backdrop — tablet only */}
      {sidebarOpen && (
        <div
          className="hidden md:block lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Collapsible sidebar — tablet only (md to lg) */}
      <aside
        className={`hidden md:flex lg:hidden fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-14 items-center gap-3 border-b border-zinc-800 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400">
            <Activity className="h-5 w-5 text-zinc-950" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">YiSA-S</h2>
            <p className="text-[10px] text-zinc-400">ANTRENÖR PANELİ</p>
          </div>
        </div>

        {/* Sidebar nav items */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {ANTRENOR_SIDEBAR_NAV.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-colors ${
                  active
                    ? 'text-cyan-400 bg-cyan-400/10'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <span className={`text-sm ${active ? 'font-medium' : ''}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content — pb-20 for bottom nav on mobile & lg+, pb-4 on tablet (no bottom nav) */}
      <div className="pb-20 md:pb-4 lg:pb-20 px-2 md:px-4 lg:px-6">{children}</div>

      {/* Bottom nav — hidden on tablet (md:) via hideOnTablet prop */}
      <AntrenorBottomNav />
    </div>
  )
}

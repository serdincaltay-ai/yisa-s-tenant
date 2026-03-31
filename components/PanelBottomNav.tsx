'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  User,
  Calendar,
  Wallet,
  TrendingUp,
  Bell,
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CalendarDays,
  MessageSquare,
  Activity,
  Ruler,
  MoreHorizontal,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
}

const VELI_NAV: NavItem[] = [
  { href: '/veli/dashboard', label: 'Profil', icon: User },
  { href: '/veli/program', label: 'Program', icon: Calendar },
  { href: '/veli/odeme', label: 'Aidat', icon: Wallet },
  { href: '/veli/gelisim', label: 'Gelişim', icon: TrendingUp },
  { href: '/veli/hareketler', label: 'Hareket', icon: Activity },
  { href: '/veli/randevu', label: 'Randevu', icon: CalendarDays },
  { href: '/veli/olcumler', label: 'Ölçüm', icon: Ruler },
  { href: '/veli/bildirimler', label: 'Bildirim', icon: Bell },
]

const ANTRENOR_NAV: NavItem[] = [
  { href: '/antrenor', label: 'Panel', icon: LayoutDashboard },
  { href: '/antrenor/sporcular', label: 'Sporcular', icon: Users },
  { href: '/antrenor/yoklama', label: 'Yoklama', icon: ClipboardCheck },
  { href: '/antrenor/bugunku-dersler', label: 'Dersler', icon: Calendar },
  { href: '/antrenor/profil', label: 'Profil', icon: User },
  { href: '/antrenor/mesajlar', label: 'Mesaj', icon: MessageSquare },
  { href: '/antrenor/ders-programi', label: 'Program', icon: CalendarDays },
  { href: '/antrenor/olcum', label: 'Ölçüm', icon: Ruler },
  { href: '/antrenor/bildirim', label: 'Bildirim', icon: Bell },
]

/** Max visible items in bottom nav before "Daha Fazla" appears */
const MAX_VISIBLE = 5

export function VeliBottomNav() {
  return <PanelBottomNav items={VELI_NAV} />
}

export function AntrenorBottomNav() {
  return <PanelBottomNav items={ANTRENOR_NAV} hideOnTablet />
}

function PanelBottomNav({
  items,
  hideOnTablet = false,
}: {
  items: NavItem[]
  hideOnTablet?: boolean
}) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === '/antrenor') return pathname === '/antrenor'
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    if (moreOpen) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [moreOpen])

  // Close dropdown on route change
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  const needsMore = items.length > MAX_VISIBLE
  const visibleItems = needsMore ? items.slice(0, MAX_VISIBLE - 1) : items
  const overflowItems = needsMore ? items.slice(MAX_VISIBLE - 1) : []

  // Highlight "Daha Fazla" when any overflow item is active
  const overflowActive = overflowItems.some((item) => isActive(item.href))

  // Hide on tablet only (md to lg) for Antrenor — sidebar takes over; show again at lg+
  const visibilityClass = hideOnTablet ? 'md:hidden lg:flex' : ''

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md ${visibilityClass}`}
    >
      <div className="flex items-center justify-around py-2 min-h-[56px]">
        {visibleItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                active
                  ? 'text-cyan-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
              <span className={`text-[10px] ${active ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* "Daha Fazla" dropdown trigger */}
        {needsMore && (
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen((prev) => !prev)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                overflowActive || moreOpen
                  ? 'text-cyan-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={1.5} />
              <span
                className={`text-[10px] ${overflowActive ? 'font-medium' : ''}`}
              >
                Daha Fazla
              </span>
            </button>

            {/* Dropdown menu */}
            {moreOpen && (
              <div className="absolute bottom-full right-0 mb-2 min-w-[160px] rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-md shadow-lg overflow-hidden">
                {overflowItems.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        active
                          ? 'text-cyan-400 bg-cyan-400/5'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                      <span className={`text-sm ${active ? 'font-medium' : ''}`}>
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

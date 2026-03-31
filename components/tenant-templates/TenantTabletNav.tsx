"use client"

import React from "react"
import {
  Home,
  Calendar,
  CreditCard,
  Phone,
  Info,
  HelpCircle,
  Users,
} from "lucide-react"

type TabletNavItem = {
  label: string
  href: string
  icon: React.ElementType
}

interface TenantTabletNavProps {
  items: TabletNavItem[]
  onNavigate: (href: string) => void
}

/**
 * Tablet BottomNav — tenant site sablonlari icin.
 * md-lg arasi tablet gorunumde gorulur, desktop ve mobilde gizlenir.
 * Mobilde hamburger menu kullanilir, desktopda inline nav kullanilir.
 */
export default function TenantTabletNav({ items, onNavigate }: TenantTabletNavProps) {
  return (
    <nav className="hidden md:flex lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-zinc-950/95 backdrop-blur-lg">
      <div className="flex items-center justify-around w-full py-2 px-2 min-h-[56px]">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors min-w-[60px]"
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/** Standard sablon icin nav items */
export const STANDARD_TABLET_NAV: TabletNavItem[] = [
  { label: "Ana Sayfa", href: "#top", icon: Home },
  { label: "Hakkımızda", href: "#hakkimizda", icon: Info },
  { label: "Program", href: "#program", icon: Calendar },
  { label: "Paketler", href: "#paketler", icon: CreditCard },
  { label: "İletişim", href: "#iletisim", icon: Phone },
]

/** Medium sablon icin nav items */
export const MEDIUM_TABLET_NAV: TabletNavItem[] = [
  { label: "Ana Sayfa", href: "#top", icon: Home },
  { label: "Hakkımızda", href: "#hakkimizda", icon: Info },
  { label: "Program", href: "#program", icon: Calendar },
  { label: "Paketler", href: "#paketler", icon: CreditCard },
  { label: "S.S.S", href: "#sss", icon: HelpCircle },
  { label: "İletişim", href: "#iletisim", icon: Phone },
]

/** Premium sablon icin nav items */
export const PREMIUM_TABLET_NAV: TabletNavItem[] = [
  { label: "Ana Sayfa", href: "#top", icon: Home },
  { label: "Branş", href: "#brans", icon: Info },
  { label: "Program", href: "#program", icon: Calendar },
  { label: "Antrenörler", href: "#antrenorler", icon: Users },
  { label: "Paketler", href: "#paketler", icon: CreditCard },
  { label: "S.S.S", href: "#sss", icon: HelpCircle },
]

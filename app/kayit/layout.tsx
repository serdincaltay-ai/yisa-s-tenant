'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { UserPlus, CreditCard, ClipboardCheck, Phone, LogOut, LayoutDashboard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toCanonicalRole } from '@/lib/auth/role-canonical'

const NAV = [
  { href: '/kayit', label: 'Yeni Kayıt', icon: UserPlus },
  { href: '/kayit/leadler', label: 'Leadler', icon: UserPlus },
  { href: '/kayit/deneme-talepleri', label: 'Deneme Talepleri', icon: ClipboardCheck },
  { href: '/kayit/odeme-durumu', label: 'Ödeme Durumu', icon: CreditCard },
  { href: '/kayit/devam-raporu', label: 'Devam Raporu', icon: ClipboardCheck },
  { href: '/kayit/veli-iletisim', label: 'Veli İletişim', icon: Phone },
]

export default function KayitLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/kayit&from=kayit')
        return
      }
      const res = await fetch('/api/franchise/role')
      const d = await res.json()
      const raw = d?.rawRole ?? d?.role
      const canonical = typeof raw === 'string' ? toCanonicalRole(raw) : null
      if (!canonical || !['registration_staff', 'cashier', 'tenant_owner', 'branch_manager'].includes(canonical)) {
        router.replace('/franchise')
        return
      }
      setAllowed(true)
      setLoading(false)
    }
    check()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-muted-foreground">Yükleniyor...</span>
      </div>
    )
  }

  if (!allowed) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
                <LayoutDashboard className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-foreground">YİSA-S</h1>
                <p className="text-[10px] text-muted-foreground">Kayıt Personeli</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Çıkış
            </button>
          </div>
          {/* Tab navigation */}
          <nav className="flex gap-1 mt-3 -mb-3 overflow-x-auto">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-background text-teal-600 border border-border border-b-background -mb-px'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}

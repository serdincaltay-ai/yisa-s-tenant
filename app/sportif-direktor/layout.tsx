'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, TrendingUp, Target, LogOut, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { canonicalizeRole } from '@/lib/auth/role-canonical'

const NAV = [
  { href: '/sportif-direktor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sportif-direktor/antrenor-performans', label: 'Antrenör Performans', icon: Users },
  { href: '/sportif-direktor/olcum-trendleri', label: 'Ölçüm Trendleri', icon: TrendingUp },
  { href: '/sportif-direktor/yetenek-tespit', label: 'Yetenek Tespit', icon: Target },
]

export default function SportifDirektorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/sportif-direktor')
        return
      }
      const res = await fetch('/api/franchise/role')
      const d = await res.json()
      const canonical = canonicalizeRole(d?.rawRole ?? d?.role)
      if (!canonical || !['sports_director', 'tenant_owner', 'branch_manager'].includes(canonical)) {
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
    <div className="flex min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 hidden md:flex h-screen w-64 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">YİSA-S</h1>
            <p className="text-xs text-foreground/60">Sportif Direktör</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === href || (href !== '/sportif-direktor' && pathname?.startsWith(href + '/'))
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-foreground/70 hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t border-border bg-card py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/sportif-direktor' && pathname?.startsWith(href + '/'))
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 px-2 py-1 ${active ? 'text-purple-400' : 'text-muted-foreground'}`}>
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{label}</span>
            </Link>
          )
        })}
      </nav>

      <main className="md:ml-64 flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
    </div>
  )
}

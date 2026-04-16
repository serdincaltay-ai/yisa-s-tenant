'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BranchProvider } from '@/lib/context/branch-context'
import { toCanonicalRole } from '@/lib/auth/role-canonical'

/**
 * Rol bazlı erişim haritası
 * owner / admin / tesis_muduru → tüm menüler
 * coach / antrenor → franchise sidebar gizli, /antrenor'a redirect
 * receptionist / kayit_gorevlisi → sadece: ogrenciler, aidat, yoklama
 * cleaning / temizlik → sadece: temizlik
 */
/** rawRole values from user_tenants.role — used for granular access control */
type RawRole =
  | 'tenant_owner'
  | 'owner'
  | 'admin'
  | 'manager'
  | 'tesis_muduru'
  | 'kasa'
  | 'coach'
  | 'antrenor'
  | 'trainer'
  | 'assistant_coach'
  | 'receptionist'
  | 'kayit_gorevlisi'
  | 'cleaning'
  | 'temizlik'
  | 'security_staff'
  | 'sportif_direktor'
  | 'isletme_muduru'

const FULL_ACCESS_ROLES: RawRole[] = ['tenant_owner', 'owner', 'admin', 'manager', 'tesis_muduru', 'kasa']

/** Routes each restricted role is allowed to access under /franchise */
const ROLE_ALLOWED_ROUTES: Record<string, string[]> = {
  receptionist: ['/franchise', '/franchise/ogrenci-yonetimi', '/franchise/athletes', '/franchise/aidatlar', '/franchise/yoklama', '/franchise/kredi-durum', '/franchise/borclu-hesaplar', '/franchise/paket-dagilim'],
  kayit_gorevlisi: ['/franchise', '/franchise/ogrenci-yonetimi', '/franchise/athletes', '/franchise/aidatlar', '/franchise/yoklama', '/franchise/kredi-durum', '/franchise/borclu-hesaplar', '/franchise/paket-dagilim'],
  cleaning: ['/franchise'],
  temizlik: ['/franchise'],
}

/** Roles that should be redirected away from franchise entirely */
const REDIRECT_ROLES: Record<string, string> = {
  coach: '/antrenor',
  antrenor: '/antrenor',
  trainer: '/antrenor',
  assistant_coach: '/assistant-coach',
  security_staff: '/security-staff',
  sportif_direktor: '/sportif-direktor',
  isletme_muduru: '/isletme-muduru',
}

export default function FranchiseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/franchise&from=franchise')
        return
      }

      // Fetch role from /api/franchise/role — use rawRole for granular access
      let rawRole: RawRole | null = null
      try {
        const roleRes = await fetch('/api/franchise/role')
        if (roleRes.ok) {
          const roleData = await roleRes.json() as { role?: string; rawRole?: string }
          const canonical = toCanonicalRole(roleData?.rawRole ?? roleData?.role)
          if (canonical) rawRole = canonical as RawRole
        }
      } catch {
        // Role fetch failed
      }

      // Fail-closed: if role could not be determined, redirect to login
      if (!rawRole) {
        router.push('/auth/login?redirect=/franchise&from=franchise')
        return
      }

      // Coach/antrenor → redirect away from franchise
      const redirectPath = REDIRECT_ROLES[rawRole]
      if (redirectPath) {
        router.replace(redirectPath)
        return
      }

      // Check route access for restricted roles (including unknown roles like 'parent')
      if (!FULL_ACCESS_ROLES.includes(rawRole)) {
        const allowedRoutes = ROLE_ALLOWED_ROUTES[rawRole]
        if (!allowedRoutes || !allowedRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
          router.replace('/franchise')
          return
        }
      }

      // Check setup status (skip if already on /kurulum)
      if (pathname !== '/kurulum') {
        try {
          const res = await fetch('/api/franchise/kurulum')
          const data = await res.json() as { needsSetup?: boolean; isOwner?: boolean }
          if (data?.needsSetup && data?.isOwner) {
            router.replace('/kurulum')
            return
          }
        } catch {
          // Continue if kurulum check fails
        }

        try {
          const onayRes = await fetch('/api/sozlesme/onay')
          const onayData = await onayRes.json() as { needsFranchise?: boolean }
          if (onayData?.needsFranchise) {
            router.replace('/sozlesme/franchise')
            return
          }
        } catch {
          // Continue if sozlesme check fails
        }
      }

      setLoading(false)
    }
    check()
  }, [router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    )
  }

  return <BranchProvider>{children}</BranchProvider>
}

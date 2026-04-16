'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { normalizeCanonicalRole } from '@/lib/auth/role-canonical'

export default function SecurityStaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/security-staff&from=security-staff')
        return
      }
      const res = await fetch('/api/franchise/role')
      const d = await res.json()
      const role = normalizeCanonicalRole(d?.rawRole ?? d?.role)
      if (!['security_staff', 'tenant_owner', 'branch_manager'].includes(role)) {
        router.replace('/franchise')
        return
      }
      setAllowed(true)
      setLoading(false)
    }
    check()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-muted-foreground">Yükleniyor...</span>
      </div>
    )
  }

  if (!allowed) return null
  return <>{children}</>
}

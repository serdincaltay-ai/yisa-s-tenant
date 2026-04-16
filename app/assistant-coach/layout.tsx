'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { canonicalizeRole } from '@/lib/auth/role-canonical'

export default function AssistantCoachLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/assistant-coach')
        return
      }

      const roleRes = await fetch('/api/franchise/role')
      const roleData = await roleRes.json() as { rawRole?: string; role?: string }
      const canonical = canonicalizeRole(roleData.rawRole ?? roleData.role)
      if (canonical !== 'assistant_coach' && canonical !== 'coach') {
        router.replace('/franchise')
        return
      }

      setAllowed(true)
      setLoading(false)
    }
    check()
  }, [router])

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Yükleniyor...</div>
  }
  if (!allowed) return null
  return <>{children}</>
}

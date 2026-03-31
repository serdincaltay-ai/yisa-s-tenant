'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { canAccessDashboard } from '@/lib/auth/roles'
import { AccentProvider } from '@/lib/context/accent-context'
import DashboardSidebar from '@/app/components/DashboardSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<{ email?: string | null; user_metadata?: { role?: string } } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) {
        router.push('/auth/login?redirect=/dashboard')
        return
      }
      if (!canAccessDashboard(u)) {
        await supabase.auth.signOut()
        router.push('/auth/login?unauthorized=1')
        return
      }
      setUser(u)
      setLoading(false)
    }
    check()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e17]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400/60 border-t-cyan-400 animate-spin" />
          <span className="text-cyan-400/90 font-medium">Yükleniyor...</span>
        </div>
      </div>
    )
  }

  return (
    <AccentProvider>
      <div className="min-h-screen bg-[#0a0e17] text-white flex">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto pt-14 pl-14 lg:pt-0 lg:pl-0 bg-[#0a0e17] min-h-screen">{children}</main>
      </div>
    </AccentProvider>
  )
}

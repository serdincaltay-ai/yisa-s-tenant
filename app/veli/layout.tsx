'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PanelHeader } from '@/components/PanelHeader'
import { VeliBottomNav } from '@/components/PanelBottomNav'

export default function VeliLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pathname) return
    const isGiris = pathname === '/veli/giris'
    const isDemoLoggedIn = typeof window !== 'undefined' && sessionStorage.getItem('veli-demo-logged-in')
    if (isGiris) {
      setLoading(false)
      return
    }
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const res = await fetch('/api/sozlesme/onay')
        const data = await res.json()
        if (data?.needsVeli) {
          router.replace('/sozlesme/veli')
          return
        }
      } else if (!isDemoLoggedIn) {
        router.replace('/veli/giris')
        return
      }
      if (pathname === '/veli') {
        router.replace('/veli/dashboard')
        return
      }
      setLoading(false)
    }
    check()
  }, [pathname, router])

  if (loading && pathname !== '/veli/giris') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400">Yükleniyor...</div>
      </div>
    )
  }

  const isGiris = pathname === '/veli/giris'

  if (isGiris) {
    return <div className="min-h-screen bg-zinc-950">{children}</div>
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <PanelHeader panelName="VELİ PANELİ" />
      <div className="pb-20 px-2 md:px-4 lg:px-6">{children}</div>
      <VeliBottomNav />
    </div>
  )
}

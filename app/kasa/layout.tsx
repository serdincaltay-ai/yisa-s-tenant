'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { DollarSign, ArrowLeft, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function KasaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/kasa')
        return
      }
      const res = await fetch('/api/franchise/role')
      const d = await res.json()
      if (!d?.canAccessKasa) {
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
  }, [router])

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
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4">
          <Link href="/panel" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Panele dön
          </Link>
          <div className="flex-1 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <span className="font-bold">Kasa Defteri</span>
          </div>
          <nav className="flex gap-2">
            <Link
              href="/kasa"
              className={`px-3 py-2 rounded-lg text-sm ${pathname === '/kasa' ? 'bg-primary/20 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Kayıtlar
            </Link>
            <Link
              href="/kasa/rapor"
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${pathname === '/kasa/rapor' ? 'bg-primary/20 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <BarChart3 className="h-4 w-4" />
              Rapor
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

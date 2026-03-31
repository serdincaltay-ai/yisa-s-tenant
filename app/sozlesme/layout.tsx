'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SozlesmeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=' + encodeURIComponent(pathname || '/sozlesme/franchise'))
        return
      }
    }
    check()
  }, [router, pathname])

  return (
    <div className="min-h-screen bg-background/95 backdrop-blur">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <main className="relative z-10">{children}</main>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Eski /auth/sign-up URL'ini /uye-ol sayfasına yönlendirir.
 * Kayıt akışı /uye-ol üzerinden yapılır.
 */
export default function AuthSignUpRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/uye-ol')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground text-sm">Yönlendiriliyor…</p>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VeliPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/veli/dashboard')
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <span className="text-zinc-400">Yönlendiriliyor...</span>
    </div>
  )
}

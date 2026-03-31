'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Activity, Loader2 } from 'lucide-react'

export default function VeliGirisPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('E-posta ve şifre zorunludur.')
      return
    }

    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'E-posta veya şifre hatalı.'
          : 'Giriş yapılamadı. Lütfen tekrar deneyin.')
        return
      }

      router.push('/veli/dashboard')
    } catch {
      setError('Giriş sırasında bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2563eb] text-white mb-4">
            <Activity className="h-10 w-10" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">YİSA-S</h1>
          <p className="text-sm text-gray-600 mt-1">Veli Girişi</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-gray-700">E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 bg-white border-gray-300 text-gray-900"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-gray-700">Şifre</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 bg-white border-gray-300 text-gray-900"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white min-h-[44px]"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Giriş Yap'
            )}
          </Button>
        </form>
        {process.env.NODE_ENV !== 'production' && (
          <p className="text-xs text-center text-gray-500">
            Test: veli1@bjktuzla.test (şifre için .env&apos;e bakın)
          </p>
        )}
      </div>
    </div>
  )
}

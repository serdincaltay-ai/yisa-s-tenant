'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Activity, Loader2, Phone, Lock } from 'lucide-react'

export default function VeliGirisPage() {
  const router = useRouter()
  const [telefon, setTelefon] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /** Telefon numarasini normalize et: basindaki 0'i kaldir, sadece rakam */
  const normalizePhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    return digits.startsWith('0') ? digits.slice(1) : digits
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanPhone = normalizePhone(telefon)
    if (cleanPhone.length !== 10) {
      setError('Telefon numarasi 10 haneli olmalidir (basinda 0 olmadan).')
      return
    }
    if (!password.trim()) {
      setError('Sifre zorunludur.')
      return
    }

    setLoading(true)
    try {
      // Telefon numarasini email formatina cevir (Supabase Auth icin)
      const fakeEmail = `${cleanPhone}@veli.yisa-s.com`
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: password.trim(),
      })

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'Telefon numarasi veya sifre hatali.'
            : 'Giris yapilamadi. Lutfen tekrar deneyin.'
        )
        return
      }

      // Ilk giris kontrolu: password_changed_at null ise sifre degistirme sayfasina yonlendir
      const appMeta = data.user?.app_metadata as Record<string, unknown> | undefined
      if (!appMeta?.password_changed_at) {
        router.push('/veli/sifre-degistir')
        return
      }

      // Profil tamamlanmis mi kontrol et
      const profileRes = await fetch('/api/veli/profil-tamamla')
      const profileData = await profileRes.json()
      if (profileData.ok && !profileData.completed) {
        router.push('/veli/profil-tamamla')
        return
      }

      router.push('/veli/dashboard')
    } catch {
      setError('Giris sirasinda bir hata olustu.')
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
          <h1 className="text-xl font-bold text-gray-900">YiSA-S</h1>
          <p className="text-sm text-gray-600 mt-1">Veli Girisi</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="telefon" className="text-gray-700">Telefon Numarasi</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="telefon"
                type="tel"
                placeholder="5XX XXX XX XX"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                className="pl-9 bg-white border-gray-300 text-gray-900"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Basinda 0 olmadan 10 haneli telefon numaraniz</p>
          </div>
          <div>
            <Label htmlFor="password" className="text-gray-700">Sifre</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="****"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 bg-white border-gray-300 text-gray-900"
                disabled={loading}
              />
            </div>
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
              'Giris Yap'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

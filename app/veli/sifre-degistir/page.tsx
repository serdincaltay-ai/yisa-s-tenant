'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Activity, Loader2, Lock, ShieldCheck } from 'lucide-react'

export default function VeliSifreDegistirPage() {
  const router = useRouter()
  const [yeniSifre, setYeniSifre] = useState('')
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (yeniSifre.length < 6) {
      setError('Yeni sifre en az 6 karakter olmalidir.')
      return
    }
    if (yeniSifre !== yeniSifreTekrar) {
      setError('Sifreler eslesmiyor.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/veli/sifre-degistir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: yeniSifre }),
      })
      const data = await res.json()

      if (!data.ok) {
        setError(data.error || 'Sifre degistirilemedi.')
        return
      }

      // Supabase client session'i guncelle
      await supabase.auth.refreshSession()

      // Profil tamamlanmis mi kontrol et
      const profileRes = await fetch('/api/veli/profil-tamamla')
      const profileData = await profileRes.json()
      if (profileData.ok && !profileData.completed) {
        router.push('/veli/profil-tamamla')
        return
      }

      router.push('/veli/dashboard')
    } catch {
      setError('Bir hata olustu. Lutfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white mb-4">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Sifre Degistir</h1>
          <p className="text-sm text-gray-600 mt-1">
            Guvenliginiz icin ilk girisinizdeki gecici sifreyi degistirmeniz gerekiyor.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="yeni_sifre" className="text-gray-700">Yeni Sifre</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="yeni_sifre"
                type="password"
                placeholder="En az 6 karakter"
                value={yeniSifre}
                onChange={(e) => setYeniSifre(e.target.value)}
                className="pl-9 bg-white border-gray-300 text-gray-900"
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="yeni_sifre_tekrar" className="text-gray-700">Sifre Tekrar</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="yeni_sifre_tekrar"
                type="password"
                placeholder="Ayni sifreyi tekrar girin"
                value={yeniSifreTekrar}
                onChange={(e) => setYeniSifreTekrar(e.target.value)}
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
            className="w-full bg-amber-500 hover:bg-amber-600 text-white min-h-[44px]"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Sifremi Degistir
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

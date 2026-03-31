'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, User, Phone, Mail, MapPin, CreditCard, UserPlus, AlertTriangle } from 'lucide-react'

export default function VeliProfilTamamlaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    ad_soyad: '',
    telefon: '',
    email: '',
    adres: '',
    tc_kimlik: '',
    acil_iletisim_adi: '',
    acil_iletisim_tel: '',
  })

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.ad_soyad.trim()) {
      setError('Ad soyad zorunludur.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/veli/profil-tamamla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!data.ok) {
        setError(data.error || 'Profil kaydedilemedi.')
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
    <div className="min-h-screen bg-zinc-950 pb-8">
      <div className="mx-auto max-w-lg p-4 space-y-6">
        <div className="flex flex-col items-center pt-8 pb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500 text-white mb-4">
            <UserPlus className="h-10 w-10" />
          </div>
          <h1 className="text-xl font-bold text-white">Profilinizi Tamamlayin</h1>
          <p className="text-sm text-zinc-400 mt-1 text-center">
            Cocugunuzun takibi icin iletisim bilgilerinizi girin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <User className="h-5 w-5 text-cyan-400" />
                Kisisel Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ad_soyad" className="text-zinc-300">Ad Soyad *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    id="ad_soyad"
                    placeholder="Adiniz Soyadiniz"
                    value={form.ad_soyad}
                    onChange={(e) => updateField('ad_soyad', e.target.value)}
                    className="pl-9 bg-zinc-800 border-zinc-700 text-white"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="telefon" className="text-zinc-300">Telefon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      id="telefon"
                      type="tel"
                      placeholder="5XX XXX XX XX"
                      value={form.telefon}
                      onChange={(e) => updateField('telefon', e.target.value)}
                      className="pl-9 bg-zinc-800 border-zinc-700 text-white"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-zinc-300">E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="pl-9 bg-zinc-800 border-zinc-700 text-white"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tc_kimlik" className="text-zinc-300">TC Kimlik No</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    id="tc_kimlik"
                    placeholder="XXXXXXXXXXX"
                    maxLength={11}
                    value={form.tc_kimlik}
                    onChange={(e) => updateField('tc_kimlik', e.target.value.replace(/\D/g, ''))}
                    className="pl-9 bg-zinc-800 border-zinc-700 text-white"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adres" className="text-zinc-300">Adres</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    id="adres"
                    placeholder="Ev adresiniz"
                    value={form.adres}
                    onChange={(e) => updateField('adres', e.target.value)}
                    className="pl-9 bg-zinc-800 border-zinc-700 text-white"
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                Acil Durum Iletisim
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="acil_ad" className="text-zinc-300">Acil Durum Kisisi</Label>
                <Input
                  id="acil_ad"
                  placeholder="Ad soyad"
                  value={form.acil_iletisim_adi}
                  onChange={(e) => updateField('acil_iletisim_adi', e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acil_tel" className="text-zinc-300">Acil Durum Telefonu</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    id="acil_tel"
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={form.acil_iletisim_tel}
                    onChange={(e) => updateField('acil_iletisim_tel', e.target.value)}
                    className="pl-9 bg-zinc-800 border-zinc-700 text-white"
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : null}
            Profili Kaydet ve Devam Et
          </Button>
        </form>
      </div>
    </div>
  )
}

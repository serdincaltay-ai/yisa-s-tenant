'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Loader2, UserPlus } from 'lucide-react'

type Cocuk = {
  ad: string
  soyad: string
  birth_date: string
  gender: string
  saglik_raporu: boolean
  fotograf_izni: boolean
  video_izni: boolean
  brans_id: string
  branch_name: string
  ders_saati: string
  tercih_gunler: string[]
}

type SportsBranch = { id: string; kod: string; isim: string }

const GUNLER = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
const DERS_SAATLERI = ['2', '3', '5']

export default function UyeOlPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sportsBranches, setSportsBranches] = useState<SportsBranch[]>([])
  const [tenantOk, setTenantOk] = useState(false)
  const [done, setDone] = useState(false)
  const [veli, setVeli] = useState({ ad: '', soyad: '', email: '', telefon: '', tc: '', sifre: '', sifreTekrar: '' })
  const [cocuklar, setCocuklar] = useState<Cocuk[]>([
    { ad: '', soyad: '', birth_date: '', gender: '', saglik_raporu: false, fotograf_izni: false, video_izni: false, brans_id: '', branch_name: '', ders_saati: '', tercih_gunler: [] },
  ])

  useEffect(() => {
    fetch('/api/veli/uye-ol')
      .then((r) => r.json())
      .then((d) => {
        setSportsBranches(Array.isArray(d?.sportsBranches) ? d.sportsBranches : [])
        setTenantOk(!d?.error)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const addCocuk = () => {
    setCocuklar((c) => [...c, { ad: '', soyad: '', birth_date: '', gender: '', saglik_raporu: false, fotograf_izni: false, video_izni: false, brans_id: '', branch_name: '', ders_saati: '', tercih_gunler: [] }])
  }

  const updateCocuk = (i: number, f: Partial<Cocuk>) => {
    setCocuklar((c) => c.map((x, j) => (j === i ? { ...x, ...f } : x)))
  }

  const handleSubmit = async () => {
    if (sending) return
    if (veli.sifre !== veli.sifreTekrar) {
      alert('Şifreler eşleşmiyor')
      return
    }
    if (veli.sifre.length < 6) {
      alert('Şifre en az 6 karakter olmalı')
      return
    }
    const validCocuklar = cocuklar.filter((c) => c.ad?.trim())
    if (validCocuklar.length === 0) {
      alert('En az bir çocuk bilgisi girin')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/veli/uye-ol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          veliAd: veli.ad,
          veliSoyad: veli.soyad,
          email: veli.email,
          telefon: veli.telefon,
          sifre: veli.sifre,
          cocuklar: validCocuklar.map((c) => ({
            ad: c.ad,
            soyad: c.soyad,
            birth_date: c.birth_date || null,
            gender: c.gender || null,
            saglik_raporu: c.saglik_raporu,
            fotograf_izni: c.fotograf_izni,
            video_izni: c.video_izni,
            branch_name: c.branch_name || sportsBranches.find((b) => b.id === c.brans_id)?.isim,
            ders_saati: c.ders_saati,
            tercih_gunler: c.tercih_gunler,
          })),
        }),
      })
      const d = await res.json()
      if (d?.ok) {
        const { error: signErr } = await supabase.auth.signInWithPassword({ email: veli.email, password: veli.sifre })
        if (!signErr) {
          router.push('/veli/odeme')
          return
        }
        setDone(true)
      } else {
        alert(d?.error ?? 'Kayıt başarısız')
      }
    } catch {
      alert('Bağlantı hatası')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!tenantOk) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Tesis Bulunamadı</CardTitle>
            <CardDescription>Üyelik için tesis sayfasından (örn. bjk-tuzla.yisa-s.com) erişin.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')}>Ana Sayfa</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Kaydınız Alındı</CardTitle>
            <CardDescription>Tesis size dönüş yapacak. Onay sonrası veli paneline giriş yapabilirsiniz.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/veli/giris')}>Veli Girişi</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalSteps = 4
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Veli Üyelik Formu
          </h1>
          <p className="text-sm text-gray-500 mt-1">Adım {step} / {totalSteps}</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Veli Bilgileri'}
              {step === 2 && 'Çocuk Bilgileri'}
              {step === 3 && 'Branş ve Program'}
              {step === 4 && 'Özet'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Veli olarak iletişim bilgileriniz'}
              {step === 2 && 'Çocuğunuzun bilgileri'}
              {step === 3 && 'Branş ve ders tercihi'}
              {step === 4 && 'Bilgileri kontrol edin'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ad *</Label>
                  <Input value={veli.ad} onChange={(e) => setVeli((v) => ({ ...v, ad: e.target.value }))} placeholder="Ad" required />
                </div>
                <div className="space-y-2">
                  <Label>Soyad</Label>
                  <Input value={veli.soyad} onChange={(e) => setVeli((v) => ({ ...v, soyad: e.target.value }))} placeholder="Soyad" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={veli.email} onChange={(e) => setVeli((v) => ({ ...v, email: e.target.value }))} placeholder="email@ornek.com" required />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input value={veli.telefon} onChange={(e) => setVeli((v) => ({ ...v, telefon: e.target.value }))} placeholder="0555 123 45 67" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Şifre *</Label>
                  <Input type="password" value={veli.sifre} onChange={(e) => setVeli((v) => ({ ...v, sifre: e.target.value }))} placeholder="En az 6 karakter" required minLength={6} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Şifre Tekrar *</Label>
                  <Input type="password" value={veli.sifreTekrar} onChange={(e) => setVeli((v) => ({ ...v, sifreTekrar: e.target.value }))} placeholder="Şifreyi tekrar girin" required />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                {cocuklar.map((c, i) => (
                  <div key={i} className="rounded-lg border p-4 space-y-4">
                    <h3 className="font-medium">Çocuk {i + 1}</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div><Label>Ad *</Label><Input value={c.ad} onChange={(e) => updateCocuk(i, { ad: e.target.value })} placeholder="Ad" /></div>
                      <div><Label>Soyad</Label><Input value={c.soyad} onChange={(e) => updateCocuk(i, { soyad: e.target.value })} placeholder="Soyad" /></div>
                      <div><Label>Doğum Tarihi</Label><Input type="date" value={c.birth_date} onChange={(e) => updateCocuk(i, { birth_date: e.target.value })} /></div>
                      <div>
                        <Label>Cinsiyet</Label>
                        <select className="flex h-10 w-full rounded-md border px-3 py-2" value={c.gender} onChange={(e) => updateCocuk(i, { gender: e.target.value })}>
                          <option value="">Seçiniz</option>
                          <option value="E">Erkek</option>
                          <option value="K">Kız</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 flex gap-4">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={c.saglik_raporu} onChange={(e) => updateCocuk(i, { saglik_raporu: e.target.checked })} /> Sağlık raporu var</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={c.fotograf_izni} onChange={(e) => updateCocuk(i, { fotograf_izni: e.target.checked })} /> Fotoğraf izni</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={c.video_izni} onChange={(e) => updateCocuk(i, { video_izni: e.target.checked })} /> Video izni</label>
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addCocuk}>+ 2. Çocuk Ekle</Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                {cocuklar.filter((c) => c.ad?.trim()).map((c, i) => (
                  <div key={i} className="rounded-lg border p-4 space-y-4">
                    <h3 className="font-medium">{c.ad} {c.soyad}</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Branş</Label>
                        <select className="flex h-10 w-full rounded-md border px-3 py-2" value={c.brans_id} onChange={(e) => {
                          const b = sportsBranches.find((x) => x.id === e.target.value)
                          updateCocuk(i, { brans_id: e.target.value, branch_name: b?.isim ?? '' })
                        }}>
                          <option value="">Seçiniz</option>
                          {sportsBranches.map((b) => <option key={b.id} value={b.id}>{b.isim || b.kod}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label>Haftada Kaç Saat?</Label>
                        <select className="flex h-10 w-full rounded-md border px-3 py-2" value={c.ders_saati} onChange={(e) => updateCocuk(i, { ders_saati: e.target.value })}>
                          <option value="">Seçiniz</option>
                          {DERS_SAATLERI.map((s) => <option key={s} value={s}>{s} saat</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <Label>Tercih Edilen Günler</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {GUNLER.map((g) => (
                            <label key={g} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={c.tercih_gunler.includes(g)}
                                onChange={(e) => updateCocuk(i, {
                                  tercih_gunler: e.target.checked ? [...c.tercih_gunler, g] : c.tercih_gunler.filter((x) => x !== g),
                                })}
                              />
                              {g}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 text-sm">
                <div><strong>Veli:</strong> {veli.ad} {veli.soyad} — {veli.email}</div>
                {cocuklar.filter((c) => c.ad?.trim()).map((c, i) => (
                  <div key={i}>
                    <strong>Çocuk {i + 1}:</strong> {c.ad} {c.soyad} — {c.birth_date || '—'} — {sportsBranches.find((b) => b.id === c.brans_id)?.isim || '—'} — {c.ders_saati ? c.ders_saati + ' saat' : '—'}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Önceki
              </Button>
              {step < totalSteps ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && (!veli.ad?.trim() || !veli.email?.trim() || !veli.sifre)}>
                  Sonraki <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Kayıt Ol
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

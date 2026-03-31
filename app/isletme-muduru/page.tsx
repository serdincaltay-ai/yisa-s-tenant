'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Calendar, TrendingUp, DollarSign, Building2, AlertTriangle, Loader2, Wallet } from 'lucide-react'

type DashboardData = {
  toplamSporcu: number
  toplamAntrenor: number
  toplamPersonel: number
  aktifDersSayisi: number
  aylikGelir: number
  aylikGider: number
  devamOrani: number
  bekleyenOdemeler: number
  dolulukOrani: number
  sonEtkinlikler: Array<{ id: string; baslik: string; tarih: string; tip: string }>
}

export default function IsletmeMuduruDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch('/api/isletme-muduru/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    )
  }

  const d = data ?? {
    toplamSporcu: 0,
    toplamAntrenor: 0,
    toplamPersonel: 0,
    aktifDersSayisi: 0,
    aylikGelir: 0,
    aylikGider: 0,
    devamOrani: 0,
    bekleyenOdemeler: 0,
    dolulukOrani: 0,
    sonEtkinlikler: [],
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="rounded-lg bg-orange-500/15 border border-orange-500/30 p-4">
        <p className="text-sm text-muted-foreground">Hoş geldiniz</p>
        <h1 className="text-xl font-bold">İşletme Müdürü Paneli</h1>
        <p className="text-sm text-muted-foreground">
          Tesis yönetimi, personel ve finans özeti
        </p>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-cyan-400" />
              Sporcu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{d.toplamSporcu}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-emerald-400" />
              Personel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{d.toplamPersonel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-400" />
              Aktif Ders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{d.aktifDersSayisi}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-green-500" />
              Aylık Gelir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{d.aylikGelir.toLocaleString('tr-TR')} TL</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              Devam
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">%{d.devamOrani}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Bekleyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{d.bekleyenOdemeler}</p>
          </CardContent>
        </Card>
      </div>

      {/* Hızlı Erişim */}
      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/isletme-muduru/tesis">
          <Button variant="outline" className="w-full h-16 flex items-center gap-3 text-left justify-start">
            <Building2 className="h-6 w-6 text-orange-400" />
            <div>
              <p className="font-medium">Tesis Yönetimi</p>
              <p className="text-xs text-muted-foreground">Doluluk oranı, salon durumu</p>
            </div>
          </Button>
        </Link>
        <Link href="/isletme-muduru/personel">
          <Button variant="outline" className="w-full h-16 flex items-center gap-3 text-left justify-start">
            <Users className="h-6 w-6 text-orange-400" />
            <div>
              <p className="font-medium">Personel</p>
              <p className="text-xs text-muted-foreground">Personel listesi ve yönetim</p>
            </div>
          </Button>
        </Link>
        <Link href="/isletme-muduru/finans">
          <Button variant="outline" className="w-full h-16 flex items-center gap-3 text-left justify-start">
            <Wallet className="h-6 w-6 text-orange-400" />
            <div>
              <p className="font-medium">Finans Özeti</p>
              <p className="text-xs text-muted-foreground">Gelir, gider ve ödeme durumu</p>
            </div>
          </Button>
        </Link>
      </div>

      {/* Son Etkinlikler */}
      <Card>
        <CardHeader>
          <CardTitle>Son Etkinlikler</CardTitle>
          <CardDescription>Tesisteki son hareketler</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {d.sonEtkinlikler.length === 0 ? (
            <p className="text-muted-foreground text-sm">Henüz etkinlik yok.</p>
          ) : (
            d.sonEtkinlikler.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">{e.baslik}</p>
                  <p className="text-xs text-muted-foreground">{e.tarih}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-muted">{e.tip}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

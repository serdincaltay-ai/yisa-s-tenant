'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Calendar, TrendingUp, DollarSign, BarChart3, GitCompare, AlertTriangle } from 'lucide-react'

type DashboardData = {
  toplamSporcu: number
  toplamAntrenor: number
  aktifDersSayisi: number
  aylikGelir: number
  devamOrani: number
  bekleyenOdemeler: number
  sonEtkinlikler: Array<{ id: string; baslik: string; tarih: string; tip: string }>
}

export default function MudurDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch('/api/mudur/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <span className="text-muted-foreground">Yukleniyor...</span>
      </div>
    )
  }

  const d = data ?? {
    toplamSporcu: 0,
    toplamAntrenor: 0,
    aktifDersSayisi: 0,
    aylikGelir: 0,
    devamOrani: 0,
    bekleyenOdemeler: 0,
    sonEtkinlikler: [],
  }

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-lg bg-primary/15 border border-primary/30 p-4">
        <p className="text-sm text-muted-foreground">Hos geldiniz</p>
        <h1 className="text-xl font-bold">Mudur Paneli</h1>
        <p className="text-sm text-muted-foreground">
          Tesis yonetimi ve raporlama
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
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
              <Users className="h-4 w-4 text-cyan-400" />
              Antrenor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{d.toplamAntrenor}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
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
              Aylik Gelir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{d.aylikGelir.toLocaleString('tr-TR')} TL</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
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

      {/* Hizli Erisim */}
      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/mudur/raporlar">
          <Button variant="outline" className="w-full h-16 flex items-center gap-3 text-left justify-start">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium">Raporlar</p>
              <p className="text-xs text-muted-foreground">Sporcu, yoklama ve gelir raporlari</p>
            </div>
          </Button>
        </Link>
        <Link href="/mudur/franchise-karsilastirma">
          <Button variant="outline" className="w-full h-16 flex items-center gap-3 text-left justify-start">
            <GitCompare className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium">Franchise Karsilastirma</p>
              <p className="text-xs text-muted-foreground">Tesisler arasi performans karsilastirmasi</p>
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
            <p className="text-muted-foreground text-sm">Henuz etkinlik yok.</p>
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

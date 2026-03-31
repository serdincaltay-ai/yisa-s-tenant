'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Users, TrendingUp, DollarSign } from 'lucide-react'

type BransDagilim = { brans: string; sayi: number }
type DurumDagilim = { durum: string; sayi: number }
type AylikYoklama = { ay: string; geldi: number; gelmedi: number; toplam: number }
type AylikGelir = { ay: string; tutar: number }

type RaporData = {
  bransDagilimi: BransDagilim[]
  durumDagilimi: DurumDagilim[]
  aylikYoklama: AylikYoklama[]
  aylikGelir: AylikGelir[]
}

export default function MudurRaporlarPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RaporData | null>(null)

  useEffect(() => {
    fetch('/api/mudur/raporlar')
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

  const d = data ?? { bransDagilimi: [], durumDagilimi: [], aylikYoklama: [], aylikGelir: [] }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Raporlar</h1>
        <p className="text-muted-foreground">Tesis istatistikleri ve performans raporlari</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Brans Dagilimi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Brans Dagilimi
            </CardTitle>
            <CardDescription>Sporcularin brans bazli dagilimi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.bransDagilimi.length === 0 ? (
              <p className="text-muted-foreground text-sm">Veri yok.</p>
            ) : (
              d.bransDagilimi.map((b) => (
                <div key={b.brans} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium text-sm">{b.brans}</span>
                  <Badge variant="outline">{b.sayi} sporcu</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Durum Dagilimi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Sporcu Durum Dagilimi
            </CardTitle>
            <CardDescription>Aktif, pasif, beklemede</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.durumDagilimi.length === 0 ? (
              <p className="text-muted-foreground text-sm">Veri yok.</p>
            ) : (
              d.durumDagilimi.map((s) => (
                <div key={s.durum} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium text-sm capitalize">{s.durum}</span>
                  <Badge variant={s.durum === 'active' ? 'default' : 'secondary'}>{s.sayi}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aylik Yoklama Ozeti */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Aylik Yoklama Ozeti
          </CardTitle>
          <CardDescription>Son 6 ay devam istatistikleri</CardDescription>
        </CardHeader>
        <CardContent>
          {d.aylikYoklama.length === 0 ? (
            <p className="text-muted-foreground text-sm">Veri yok.</p>
          ) : (
            <div className="space-y-3">
              {d.aylikYoklama.map((ay) => {
                const oran = ay.toplam > 0 ? Math.round((ay.geldi / ay.toplam) * 100) : 0
                return (
                  <div key={ay.ay} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{ay.ay}</span>
                      <span className="text-muted-foreground">
                        {ay.geldi}/{ay.toplam} (%{oran})
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${oran}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aylik Gelir */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Aylik Gelir Ozeti
          </CardTitle>
          <CardDescription>Son 6 ay gelir istatistikleri</CardDescription>
        </CardHeader>
        <CardContent>
          {d.aylikGelir.length === 0 ? (
            <p className="text-muted-foreground text-sm">Veri yok.</p>
          ) : (
            <div className="space-y-2">
              {d.aylikGelir.map((g) => (
                <div key={g.ay} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium text-sm">{g.ay}</span>
                  <span className="font-bold text-green-500">{g.tutar.toLocaleString('tr-TR')} TL</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

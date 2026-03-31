'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type AntrenorPerformans = {
  id: string
  ad_soyad: string
  brans: string
  sporcu_sayisi: number
  devam_orani: number
  ortalama_olcum_skoru: number
  ders_sayisi: number
}

export default function AntrenorPerformansPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AntrenorPerformans[]>([])

  useEffect(() => {
    fetch('/api/sportif-direktor/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d.antrenorler ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    )
  }

  const getTrendIcon = (oran: number) => {
    if (oran >= 80) return <TrendingUp className="h-4 w-4 text-emerald-400" />
    if (oran >= 50) return <Minus className="h-4 w-4 text-amber-400" />
    return <TrendingDown className="h-4 w-4 text-red-400" />
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-purple-400" />
          Antrenör Performans Karşılaştırma
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Antrenörlerin sporcu sayısı, devam oranı ve ölçüm performansları
        </p>
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Henüz antrenör performans verisi yok.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{a.ad_soyad}</span>
                  {getTrendIcon(a.devam_orani)}
                </CardTitle>
                <CardDescription>
                  <Badge variant="secondary" className="text-xs">{a.brans || 'Genel'}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Sporcu</p>
                    <p className="text-lg font-bold">{a.sporcu_sayisi}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Devam</p>
                    <p className="text-lg font-bold">%{a.devam_orani}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Ölçüm Skoru</p>
                    <p className="text-lg font-bold">{a.ortalama_olcum_skoru}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Ders</p>
                    <p className="text-lg font-bold">{a.ders_sayisi}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

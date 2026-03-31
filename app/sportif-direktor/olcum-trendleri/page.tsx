'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type OlcumTrend = {
  parametre: string
  ortalama: number
  onceki_ortalama: number
  degisim_yuzdesi: number
  sporcu_sayisi: number
}

type BransTrend = {
  brans: string
  trendler: OlcumTrend[]
}

export default function OlcumTrendleriPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<BransTrend[]>([])

  useEffect(() => {
    fetch('/api/sportif-direktor/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d.olcumTrendleri ?? []))
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-purple-400" />
          Ölçüm Trendleri
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Branş bazlı ölçüm ortalamaları ve değişim trendleri
        </p>
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Henüz yeterli ölçüm verisi yok. Ölçüm trendleri en az iki ölçüm döneminden sonra oluşur.</p>
          </CardContent>
        </Card>
      ) : (
        data.map((bt) => (
          <Card key={bt.brans}>
            <CardHeader>
              <CardTitle>{bt.brans}</CardTitle>
              <CardDescription>Ölçüm parametreleri ortalamaları</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 px-3 text-muted-foreground text-sm">Parametre</th>
                      <th className="py-2 px-3 text-muted-foreground text-sm">Ortalama</th>
                      <th className="py-2 px-3 text-muted-foreground text-sm">Önceki</th>
                      <th className="py-2 px-3 text-muted-foreground text-sm">Değişim</th>
                      <th className="py-2 px-3 text-muted-foreground text-sm">Sporcu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bt.trendler.map((t) => (
                      <tr key={t.parametre} className="border-b">
                        <td className="py-2 px-3 font-medium text-sm">{t.parametre}</td>
                        <td className="py-2 px-3 text-sm">{t.ortalama.toFixed(1)}</td>
                        <td className="py-2 px-3 text-sm text-muted-foreground">{t.onceki_ortalama.toFixed(1)}</td>
                        <td className="py-2 px-3">
                          <Badge
                            variant={t.degisim_yuzdesi > 0 ? 'default' : t.degisim_yuzdesi < 0 ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {t.degisim_yuzdesi > 0 ? '+' : ''}{t.degisim_yuzdesi.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-sm">{t.sporcu_sayisi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

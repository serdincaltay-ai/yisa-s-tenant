'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, Target, BarChart3, Activity, Loader2 } from 'lucide-react'

type DashboardData = {
  branslar: Array<{ brans: string; sporcu_sayisi: number; antrenor_sayisi: number; devam_orani: number }>
  toplamSporcu: number
  toplamAntrenor: number
  ortalamaDevamOrani: number
  toplamBrans: number
}

export default function SportifDirektorDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch('/api/sportif-direktor/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    )
  }

  const d = data ?? {
    branslar: [],
    toplamSporcu: 0,
    toplamAntrenor: 0,
    ortalamaDevamOrani: 0,
    toplamBrans: 0,
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="rounded-lg bg-purple-500/15 border border-purple-500/30 p-4">
        <p className="text-sm text-muted-foreground">Hoş geldiniz</p>
        <h1 className="text-xl font-bold">Sportif Direktör Paneli</h1>
        <p className="text-sm text-muted-foreground">
          Tüm branş istatistikleri ve antrenör performansı
        </p>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-purple-400" />
              Branş
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{d.toplamBrans}</p>
          </CardContent>
        </Card>
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
              Antrenör
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{d.toplamAntrenor}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              Devam Oranı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">%{d.ortalamaDevamOrani}</p>
          </CardContent>
        </Card>
      </div>

      {/* Hızlı Erişim */}
      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/sportif-direktor/antrenor-performans">
          <Button variant="outline" className="w-full h-16 flex items-center gap-3 text-left justify-start">
            <Users className="h-6 w-6 text-purple-400" />
            <div>
              <p className="font-medium">Antrenör Performans</p>
              <p className="text-xs text-muted-foreground">Antrenör bazlı karşılaştırma</p>
            </div>
          </Button>
        </Link>
        <Link href="/sportif-direktor/olcum-trendleri">
          <Button variant="outline" className="w-full h-16 flex items-center gap-3 text-left justify-start">
            <BarChart3 className="h-6 w-6 text-purple-400" />
            <div>
              <p className="font-medium">Ölçüm Trendleri</p>
              <p className="text-xs text-muted-foreground">Ölçüm ortalamaları ve trendler</p>
            </div>
          </Button>
        </Link>
        <Link href="/sportif-direktor/yetenek-tespit">
          <Button variant="outline" className="w-full h-16 flex items-center gap-3 text-left justify-start">
            <Target className="h-6 w-6 text-purple-400" />
            <div>
              <p className="font-medium">Yetenek Tespit</p>
              <p className="text-xs text-muted-foreground">Yetenek tespit raporları</p>
            </div>
          </Button>
        </Link>
      </div>

      {/* Branş Özeti Tablosu */}
      <Card>
        <CardHeader>
          <CardTitle>Branş Özeti</CardTitle>
          <CardDescription>Tüm branşlardaki sporcu ve antrenör dağılımı</CardDescription>
        </CardHeader>
        <CardContent>
          {d.branslar.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Henüz branş verisi yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 px-4 text-muted-foreground text-sm">Branş</th>
                    <th className="py-3 px-4 text-muted-foreground text-sm">Sporcu</th>
                    <th className="py-3 px-4 text-muted-foreground text-sm">Antrenör</th>
                    <th className="py-3 px-4 text-muted-foreground text-sm">Devam Oranı</th>
                  </tr>
                </thead>
                <tbody>
                  {d.branslar.map((b) => (
                    <tr key={b.brans} className="border-b">
                      <td className="py-3 px-4 font-medium">{b.brans}</td>
                      <td className="py-3 px-4">{b.sporcu_sayisi}</td>
                      <td className="py-3 px-4">{b.antrenor_sayisi}</td>
                      <td className="py-3 px-4">%{b.devam_orani}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

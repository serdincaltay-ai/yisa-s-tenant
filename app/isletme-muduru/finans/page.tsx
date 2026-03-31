'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, Loader2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

type FinansData = {
  aylikGelir: number
  aylikGider: number
  netKar: number
  bekleyenOdemeler: number
  tahsilOrani: number
  sonOdemeler: Array<{ id: string; aciklama: string; tutar: number; tarih: string; durum: string }>
}

export default function FinansOzetiPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<FinansData | null>(null)

  useEffect(() => {
    fetch('/api/isletme-muduru/dashboard')
      .then((r) => r.json())
      .then((d) => setData({
        aylikGelir: d.aylikGelir ?? 0,
        aylikGider: d.aylikGider ?? 0,
        netKar: (d.aylikGelir ?? 0) - (d.aylikGider ?? 0),
        bekleyenOdemeler: d.bekleyenOdemeler ?? 0,
        tahsilOrani: d.tahsilOrani ?? 0,
        sonOdemeler: d.sonOdemeler ?? [],
      }))
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
    aylikGelir: 0,
    aylikGider: 0,
    netKar: 0,
    bekleyenOdemeler: 0,
    tahsilOrani: 0,
    sonOdemeler: [],
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6 text-orange-400" />
          Finans Özeti
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aylık gelir, gider ve ödeme durumu
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Aylık Gelir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">{d.aylikGelir.toLocaleString('tr-TR')} TL</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Aylık Gider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">{d.aylikGider.toLocaleString('tr-TR')} TL</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-blue-500" />
              Net Kâr
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${d.netKar >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {d.netKar.toLocaleString('tr-TR')} TL
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-amber-500" />
              Tahsil Oranı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">%{d.tahsilOrani}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son Ödemeler</CardTitle>
          <CardDescription>Son yapılan ve bekleyen ödemeler</CardDescription>
        </CardHeader>
        <CardContent>
          {d.sonOdemeler.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">Henüz ödeme kaydı yok.</p>
          ) : (
            <div className="space-y-2">
              {d.sonOdemeler.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">{o.aciklama}</p>
                    <p className="text-xs text-muted-foreground">{o.tarih}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{o.tutar.toLocaleString('tr-TR')} TL</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      o.durum === 'paid' || o.durum === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>{o.durum === 'paid' || o.durum === 'completed' ? 'Ödendi' : 'Bekliyor'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

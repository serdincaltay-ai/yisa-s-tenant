'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const KATEGORI_LABEL: Record<string, string> = {
  aidat: 'Aidat',
  ders_ucreti: 'Ders Ücreti',
  kira: 'Kira',
  maas: 'Maaş',
  malzeme: 'Malzeme',
  diger: 'Diğer',
}

const AY_AD: Record<number, string> = {
  1: 'Oca', 2: 'Şub', 3: 'Mar', 4: 'Nis', 5: 'May', 6: 'Haz',
  7: 'Tem', 8: 'Ağu', 9: 'Eyl', 10: 'Eki', 11: 'Kas', 12: 'Ara',
}

type Aylik = { ay: number; gelir: number; gider: number; net: number }
type Kategori = { kategori: string; gelir: number; gider: number }

export default function KasaRaporPage() {
  const [aylik, setAylik] = useState<Aylik[]>([])
  const [kategoriler, setKategoriler] = useState<Kategori[]>([])
  const [yil, setYil] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/franchise/kasa/rapor?yil=${yil}`)
      .then((r) => r.json())
      .then((d) => {
        setAylik(d.aylik ?? [])
        setKategoriler(d.kategoriler ?? [])
      })
      .catch(() => {
        setAylik([])
        setKategoriler([])
      })
      .finally(() => setLoading(false))
  }, [yil])

  const maxGelirGider = Math.max(...aylik.map((a) => Math.max(a.gelir, a.gider)), 1)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Aylık Rapor</h1>
        <select
          value={yil}
          onChange={(e) => setYil(parseInt(e.target.value, 10))}
          className="rounded border border-input bg-background px-3 py-2"
        >
          {[yil - 2, yil - 1, yil, yil + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aylık Gelir-Gider</CardTitle>
          <CardDescription>Bar grafik</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Yükleniyor...</p>
          ) : (
            <div className="flex items-end gap-1 h-48">
              {aylik.map((a) => (
                <div key={a.ay} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col gap-0.5 items-center" style={{ height: 160 }}>
                    <div
                      className="w-full bg-green-500/80 rounded-t min-h-[2px]"
                      style={{ height: `${(a.gelir / maxGelirGider) * 70}px` }}
                      title={`Gelir: ${a.gelir.toLocaleString('tr-TR')} ₺`}
                    />
                    <div
                      className="w-full bg-red-500/80 rounded-b min-h-[2px]"
                      style={{ height: `${(a.gider / maxGelirGider) * 70}px` }}
                      title={`Gider: ${a.gider.toLocaleString('tr-TR')} ₺`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{AY_AD[a.ay]}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kategori Bazlı Dağılım</CardTitle>
          <CardDescription>Gelir ve gider kategorilere göre</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Yükleniyor...</p>
          ) : kategoriler.length === 0 ? (
            <p className="text-muted-foreground">Veri yok.</p>
          ) : (
            <div className="space-y-3">
              {kategoriler.map((k) => (
                <div key={k.kategori} className="flex items-center justify-between border-b pb-2">
                  <span>{KATEGORI_LABEL[k.kategori] ?? k.kategori}</span>
                  <div className="flex gap-4">
                    <span className="text-green-600 dark:text-green-400">{k.gelir.toLocaleString('tr-TR')} ₺</span>
                    <span className="text-red-600 dark:text-red-400">{k.gider.toLocaleString('tr-TR')} ₺</span>
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

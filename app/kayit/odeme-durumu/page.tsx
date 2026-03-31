'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type OdemeDurumu = {
  id: string
  ogrenci_adi: string
  veli_adi: string
  tutar: number
  durum: 'paid' | 'pending' | 'overdue'
  son_odeme_tarihi: string
  donem: string
}

export default function OdemeDurumuPage() {
  const [loading, setLoading] = useState(true)
  const [odemeler, setOdemeler] = useState<OdemeDurumu[]>([])
  const [arama, setArama] = useState('')

  useEffect(() => {
    fetch('/api/kayit/odeme-durumu')
      .then((r) => r.json())
      .then((d) => setOdemeler(d.odemeler ?? []))
      .catch(() => setOdemeler([]))
      .finally(() => setLoading(false))
  }, [])

  const filtrelenmis = odemeler.filter((o) =>
    o.ogrenci_adi.toLowerCase().includes(arama.toLowerCase()) ||
    o.veli_adi.toLowerCase().includes(arama.toLowerCase())
  )

  const durumLabel = (durum: string) => {
    if (durum === 'paid') return { label: 'Ödendi', variant: 'default' as const }
    if (durum === 'pending') return { label: 'Bekliyor', variant: 'secondary' as const }
    return { label: 'Gecikmiş', variant: 'destructive' as const }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-teal-500" />
          Ödeme Durumu
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Öğrenci aidat ve ödeme takibi
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Öğrenci veya veli adı ile ara..."
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ödeme Listesi</CardTitle>
          <CardDescription>{filtrelenmis.length} kayıt bulundu</CardDescription>
        </CardHeader>
        <CardContent>
          {filtrelenmis.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {arama ? 'Arama kriterlerine uygun kayıt bulunamadı.' : 'Henüz ödeme kaydı yok.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 px-3 text-muted-foreground text-sm">Öğrenci</th>
                    <th className="py-3 px-3 text-muted-foreground text-sm">Veli</th>
                    <th className="py-3 px-3 text-muted-foreground text-sm">Dönem</th>
                    <th className="py-3 px-3 text-muted-foreground text-sm">Tutar</th>
                    <th className="py-3 px-3 text-muted-foreground text-sm">Durum</th>
                    <th className="py-3 px-3 text-muted-foreground text-sm">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrelenmis.map((o) => {
                    const { label, variant } = durumLabel(o.durum)
                    return (
                      <tr key={o.id} className="border-b">
                        <td className="py-3 px-3 font-medium text-sm">{o.ogrenci_adi}</td>
                        <td className="py-3 px-3 text-sm">{o.veli_adi}</td>
                        <td className="py-3 px-3 text-sm">{o.donem}</td>
                        <td className="py-3 px-3 text-sm">{o.tutar.toLocaleString('tr-TR')} TL</td>
                        <td className="py-3 px-3">
                          <Badge variant={variant} className="text-xs">{label}</Badge>
                        </td>
                        <td className="py-3 px-3 text-sm text-muted-foreground">{o.son_odeme_tarihi}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

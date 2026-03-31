'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardCheck, Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type DevamKaydi = {
  id: string
  ogrenci_adi: string
  brans: string
  toplam_ders: number
  katilim: number
  devamsizlik: number
  devam_orani: number
}

export default function DevamRaporuPage() {
  const [loading, setLoading] = useState(true)
  const [kayitlar, setKayitlar] = useState<DevamKaydi[]>([])
  const [arama, setArama] = useState('')

  useEffect(() => {
    fetch('/api/kayit/devam-raporu')
      .then((r) => r.json())
      .then((d) => setKayitlar(d.kayitlar ?? []))
      .catch(() => setKayitlar([]))
      .finally(() => setLoading(false))
  }, [])

  const filtrelenmis = kayitlar.filter((k) =>
    k.ogrenci_adi.toLowerCase().includes(arama.toLowerCase()) ||
    k.brans.toLowerCase().includes(arama.toLowerCase())
  )

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
          <ClipboardCheck className="h-6 w-6 text-teal-500" />
          Devam Durumu Raporu
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Öğrenci yoklama ve devam durumu özeti
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Öğrenci veya branş ile ara..."
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Devam Raporu</CardTitle>
          <CardDescription>{filtrelenmis.length} öğrenci</CardDescription>
        </CardHeader>
        <CardContent>
          {filtrelenmis.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {arama ? 'Arama kriterlerine uygun kayıt bulunamadı.' : 'Henüz yoklama verisi yok.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 px-3 text-muted-foreground text-sm">Öğrenci</th>
                    <th className="py-3 px-3 text-muted-foreground text-sm">Branş</th>
                    <th className="py-3 px-3 text-muted-foreground text-sm">Toplam</th>
                    <th className="py-3 px-3 text-muted-foreground text-sm">Katılım</th>
                    <th className="py-3 px-3 text-muted-foreground text-sm">Devamsızlık</th>
                    <th className="py-3 px-3 text-muted-foreground text-sm">Oran</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrelenmis.map((k) => (
                    <tr key={k.id} className="border-b">
                      <td className="py-3 px-3 font-medium text-sm">{k.ogrenci_adi}</td>
                      <td className="py-3 px-3 text-sm">{k.brans}</td>
                      <td className="py-3 px-3 text-sm">{k.toplam_ders}</td>
                      <td className="py-3 px-3 text-sm text-emerald-500">{k.katilim}</td>
                      <td className="py-3 px-3 text-sm text-red-500">{k.devamsizlik}</td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={k.devam_orani >= 80 ? 'default' : k.devam_orani >= 50 ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          %{k.devam_orani}
                        </Badge>
                      </td>
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

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Target, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type YetenekliSporcu = {
  id: string
  ad_soyad: string
  brans: string
  yas: number
  genel_skor: number
  guclu_yonler: string[]
  onerilen_branslar: string[]
}

export default function YetenekTespitPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<YetenekliSporcu[]>([])

  useEffect(() => {
    fetch('/api/sportif-direktor/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d.yetenekliSporcular ?? []))
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
          <Target className="h-6 w-6 text-purple-400" />
          Yetenek Tespit Raporları
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ölçüm sonuçlarına göre öne çıkan sporcular ve branş önerileri
        </p>
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Henüz yetenek tespit verisi yok. Ölçüm verileri toplandıkça otomatik oluşur.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{s.ad_soyad}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold">{s.genel_skor}</span>
                  </div>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{s.brans}</Badge>
                  <span className="text-xs">{s.yas} yaş</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.guclu_yonler.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Güçlü Yönler</p>
                    <div className="flex flex-wrap gap-1">
                      {s.guclu_yonler.map((g) => (
                        <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {s.onerilen_branslar.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Önerilen Branşlar</p>
                    <div className="flex flex-wrap gap-1">
                      {s.onerilen_branslar.map((b) => (
                        <Badge key={b} className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">{b}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GitCompare, Users, Calendar, TrendingUp, MapPin } from 'lucide-react'

type Tesis = {
  id: string
  ad: string
  slug: string
  sehir: string
  sporcuSayisi: number
  dersSayisi: number
  devamOrani: number
}

export default function MudurFranchiseKarsilastirmaPage() {
  const [loading, setLoading] = useState(true)
  const [tesisler, setTesisler] = useState<Tesis[]>([])

  useEffect(() => {
    fetch('/api/mudur/franchise-karsilastirma')
      .then((r) => r.json())
      .then((d) => setTesisler(d.tesisler ?? []))
      .catch(() => setTesisler([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <span className="text-muted-foreground">Yukleniyor...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Franchise Karsilastirma</h1>
        <p className="text-muted-foreground">Tesisler arasi performans karsilastirmasi</p>
      </div>

      {tesisler.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Henuz karsilastirma yapilacak tesis yok.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tesisler.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCompare className="h-5 w-5 text-primary" />
                  {t.ad}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {t.sehir || 'Belirtilmemis'} {t.slug ? `(${t.slug})` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{t.sporcuSayisi}</p>
                      <p className="text-xs text-muted-foreground">Sporcu</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{t.dersSayisi}</p>
                      <p className="text-xs text-muted-foreground">Aktif Ders</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">%{t.devamOrani}</p>
                      <p className="text-xs text-muted-foreground">Devam Orani</p>
                    </div>
                  </div>
                </div>
                {t.devamOrani >= 80 && (
                  <Badge className="mt-3 bg-green-600">Basarili</Badge>
                )}
                {t.devamOrani >= 50 && t.devamOrani < 80 && (
                  <Badge className="mt-3 bg-amber-600">Orta</Badge>
                )}
                {t.devamOrani > 0 && t.devamOrani < 50 && (
                  <Badge className="mt-3 bg-red-600">Dusuk</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

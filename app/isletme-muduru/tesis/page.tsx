'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Loader2, CheckCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type TesisBilgi = {
  salon_adi: string
  kapasite: number
  aktif_ders: number
  doluluk_orani: number
  durum: 'aktif' | 'bakim' | 'kapali'
}

export default function TesisYonetimiPage() {
  const [loading, setLoading] = useState(true)
  const [salonlar, setSalonlar] = useState<TesisBilgi[]>([])

  useEffect(() => {
    fetch('/api/isletme-muduru/dashboard')
      .then((r) => r.json())
      .then((d) => setSalonlar(d.salonlar ?? []))
      .catch(() => setSalonlar([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    )
  }

  const durumRenk = (durum: string) => {
    if (durum === 'aktif') return 'default'
    if (durum === 'bakim') return 'secondary'
    return 'destructive'
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-orange-400" />
          Tesis Yönetimi
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Salon durumları ve doluluk oranları
        </p>
      </div>

      {salonlar.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Henüz salon verisi yok.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {salonlar.map((s) => (
            <Card key={s.salon_adi}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{s.salon_adi}</span>
                  <Badge variant={durumRenk(s.durum)} className="text-xs capitalize">
                    {s.durum === 'aktif' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {s.durum === 'bakim' && <Clock className="h-3 w-3 mr-1" />}
                    {s.durum}
                  </Badge>
                </CardTitle>
                <CardDescription>Kapasite: {s.kapasite} kişi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Aktif Ders</span>
                    <span className="font-medium">{s.aktif_ders}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Doluluk</span>
                      <span className="font-medium">%{s.doluluk_orani}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          s.doluluk_orani >= 80 ? 'bg-red-500' : s.doluluk_orani >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(s.doluluk_orani, 100)}%` }}
                      />
                    </div>
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

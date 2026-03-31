'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

type Olcum = {
  id: string
  olcum_tarihi: string
  boy?: number
  kilo?: number
  esneklik?: number
  dikey_sicrama?: number
  genel_degerlendirme?: string
}

export default function AntrenorSporcuGelisimPage() {
  const params = useParams()
  const id = params?.id as string
  const [items, setItems] = useState<Olcum[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/antrenor/olcum/gecmis?athlete_id=${id}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [id])

  const boyData = items.filter((o) => o.boy != null).map((o) => ({ tarih: o.olcum_tarihi, val: o.boy })).reverse()
  const kiloData = items.filter((o) => o.kilo != null).map((o) => ({ tarih: o.olcum_tarihi, val: o.kilo })).reverse()
  const esneklikData = items.filter((o) => o.esneklik != null).map((o) => ({ tarih: o.olcum_tarihi, val: o.esneklik })).reverse()

  const maxBoy = boyData.length ? Math.max(...boyData.map((d) => d.val!)) : 100
  const maxKilo = kiloData.length ? Math.max(...kiloData.map((d) => d.val!)) : 50

  return (
    <div className="p-6 space-y-6">
      <Link href={`/antrenor/sporcular/${id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Sporcu detayına dön
      </Link>

      <h1 className="text-2xl font-bold">Gelişim Grafiği</h1>

      {loading ? (
        <p className="text-muted-foreground">Yükleniyor...</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Henüz ölçüm kaydı yok.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Boy (cm)</CardTitle>
              <CardDescription>Zaman serisi</CardDescription>
            </CardHeader>
            <CardContent>
              {boyData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Veri yok</p>
              ) : (
                <div className="flex items-end gap-1 h-32">
                  {boyData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center" title={`${d.tarih}: ${d.val} cm`}>
                      <div className="w-full bg-primary/60 rounded-t" style={{ height: `${(d.val! / (maxBoy || 1)) * 80}px`, minHeight: 4 }} />
                      <span className="text-[10px] text-muted-foreground truncate max-w-full">{d.tarih.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kilo (kg)</CardTitle>
            </CardHeader>
            <CardContent>
              {kiloData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Veri yok</p>
              ) : (
                <div className="flex items-end gap-1 h-32">
                  {kiloData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center" title={`${d.tarih}: ${d.val} kg`}>
                      <div className="w-full bg-green-500/60 rounded-t" style={{ height: `${(d.val! / (maxKilo || 1)) * 80}px`, minHeight: 4 }} />
                      <span className="text-[10px] text-muted-foreground truncate max-w-full">{d.tarih.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Esneklik (cm)</CardTitle>
            </CardHeader>
            <CardContent>
              {esneklikData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Veri yok</p>
              ) : (
                <div className="space-y-2">
                  {esneklikData.map((d, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{d.tarih}</span>
                      <span className="font-medium">{d.val} cm</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Son Ölçümler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.slice(0, 10).map((o) => (
                  <div key={o.id} className="border rounded p-2 text-sm">
                    <span className="font-medium">{o.olcum_tarihi}</span>
                    <span className="mx-2">—</span>
                    {o.boy != null && <span>Boy: {o.boy} </span>}
                    {o.kilo != null && <span>Kilo: {o.kilo} </span>}
                    {o.esneklik != null && <span>Esneklik: {o.esneklik}</span>}
                    {o.genel_degerlendirme && <p className="mt-1 text-muted-foreground">{o.genel_degerlendirme}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

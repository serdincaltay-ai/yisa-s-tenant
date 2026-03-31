'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Calendar,
  HeartPulse,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Dumbbell,
} from 'lucide-react'

type Athlete = {
  id: string
  name: string
  surname?: string | null
  status?: string
  branch?: string | null
  created_at?: string
}

type Ders = {
  id: string
  gun: string
  saat: string
  ders_adi: string
  brans?: string | null
}

type RaporData = {
  toplamOgrenci: number
  aktifOgrenci: number
  denemeOgrenci: number
  buAyYeniKayit: number
  dersSayisi: number
  antrenorSayisi: number
  saglikKaydiSayisi: number
}

const BUGUN_GUN = (() => {
  const gunler = ['Pazar', 'Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi']
  return gunler[new Date().getDay()]
})()

export default function TesisPaneli() {
  const [rapor, setRapor] = useState<RaporData | null>(null)
  const [sonOgrenciler, setSonOgrenciler] = useState<Athlete[]>([])
  const [bugunDersler, setBugunDersler] = useState<Ders[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [raporRes, ogrenciRes, dersRes] = await Promise.all([
          fetch('/api/tesis/raporlar'),
          fetch('/api/tesis/ogrenciler?status=active'),
          fetch('/api/tesis/dersler'),
        ])
        const raporData = await raporRes.json()
        const ogrenciData = await ogrenciRes.json()
        const dersData = await dersRes.json()

        if (raporData.toplamOgrenci !== undefined) setRapor(raporData)
        const items = Array.isArray(ogrenciData.items) ? ogrenciData.items : []
        setSonOgrenciler(items.slice(0, 5))
        const allDersler = Array.isArray(dersData.items) ? dersData.items : []
        setBugunDersler(allDersler.filter((d: Ders) => d.gun === BUGUN_GUN))
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tesis Paneli</h1>
          <p className="text-muted-foreground">Genel bakis</p>
        </div>
      </header>

      {/* Ozet Kartlar */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <OzetKarti
          baslik="Toplam Ogrenci"
          deger={String(rapor?.toplamOgrenci ?? 0)}
          degisim={`+${rapor?.buAyYeniKayit ?? 0} bu ay`}
          ikon={<Users className="h-5 w-5" />}
          renk="primary"
        />
        <OzetKarti
          baslik="Haftalik Ders"
          deger={String(rapor?.dersSayisi ?? 0)}
          degisim={`Bugun: ${bugunDersler.length} ders`}
          ikon={<Calendar className="h-5 w-5" />}
          renk="accent"
        />
        <OzetKarti
          baslik="Sağlık Kaydı"
          deger={String(rapor?.saglikKaydiSayisi ?? 0)}
          degisim="Toplam kayit"
          ikon={<HeartPulse className="h-5 w-5" />}
          renk="warning"
        />
        <OzetKarti
          baslik="Antrenör"
          deger={String(rapor?.antrenorSayisi ?? 0)}
          degisim="Aktif antrenor"
          ikon={<Dumbbell className="h-5 w-5" />}
          renk="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bugunki Dersler */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Bugunki Dersler
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/tesis/dersler">Tum Program</Link>
              </Button>
            </div>
            <CardDescription>{BUGUN_GUN} — {new Date().toLocaleDateString('tr-TR')}</CardDescription>
          </CardHeader>
          <CardContent>
            {bugunDersler.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Bugun ders yok</p>
            ) : (
              <div className="space-y-3">
                {bugunDersler.map((ders) => (
                  <div key={ders.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-16 items-center justify-center rounded bg-primary/10 text-sm font-medium text-primary">
                        {ders.saat}
                      </div>
                      <div>
                        <p className="font-medium">{ders.ders_adi}</p>
                        {ders.brans && <p className="text-sm text-muted-foreground">{ders.brans}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hizli Erisim */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Hizli Erisim
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/tesis/ogrenciler"><Users className="mr-2 h-4 w-4" />Ogrenci Listesi</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/tesis/dersler"><Calendar className="mr-2 h-4 w-4" />Ders Programi</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/tesis/saglik"><HeartPulse className="mr-2 h-4 w-4" />Sağlık Takibi</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/tesis/antrenorler"><Dumbbell className="mr-2 h-4 w-4" />Antrenörler</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/tesis/raporlar"><TrendingUp className="mr-2 h-4 w-4" />Raporlar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Son Ogrenciler */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Son Kaydedilen Öğrenciler
              </CardTitle>
              <CardDescription>En son eklenen aktif ogrenciler</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tesis/ogrenciler">Tüm Öğrenciler</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sonOgrenciler.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Henuz ogrenci kaydi yok</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Öğrenci</th>
                    <th className="pb-3 font-medium">Brans</th>
                    <th className="pb-3 font-medium">Durum</th>
                    <th className="pb-3 font-medium">Islem</th>
                  </tr>
                </thead>
                <tbody>
                  {sonOgrenciler.map((ogrenci) => (
                    <tr key={ogrenci.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{ogrenci.name} {ogrenci.surname ?? ''}</td>
                      <td className="py-3 text-muted-foreground">{ogrenci.branch ?? '—'}</td>
                      <td className="py-3">
                        <Badge variant={ogrenci.status === 'active' ? 'default' : 'secondary'}>
                          {ogrenci.status === 'active' ? 'Aktif' : ogrenci.status === 'trial' ? 'Deneme' : 'Pasif'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/tesis/ogrenciler">Detay</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {rapor && rapor.denemeOgrenci > 0 && (
        <Card className="border-amber-500/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm">
              <strong>{rapor.denemeOgrenci}</strong> ogrenci deneme surecinde.
              <Link href="/tesis/ogrenciler" className="text-primary hover:underline ml-1">Goruntule</Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function OzetKarti({ baslik, deger, degisim, ikon, renk }: { baslik: string; deger: string; degisim: string; ikon: React.ReactNode; renk: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{baslik}</p>
            <p className="text-2xl font-bold">{deger}</p>
            <p className="text-xs text-muted-foreground">{degisim}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
            renk === 'primary' ? 'bg-primary/10 text-primary' :
            renk === 'accent' ? 'bg-accent/10 text-accent' :
            renk === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10' :
            'bg-green-100 text-green-600 dark:bg-green-500/10'
          }`}>
            {ikon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

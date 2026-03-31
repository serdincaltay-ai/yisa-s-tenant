'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ClipboardList,
  Loader2,
  Users,
  Calendar,
  Dumbbell,
  HeartPulse,
  TrendingUp,
  UserPlus,
} from 'lucide-react'

type RaporData = {
  toplamOgrenci: number
  aktifOgrenci: number
  pasifOgrenci: number
  denemeOgrenci: number
  buAyYeniKayit: number
  bransDagilimi: Record<string, number>
  dersSayisi: number
  antrenorSayisi: number
  saglikKaydiSayisi: number
}

export default function TesisRaporlarPage() {
  const [data, setData] = useState<RaporData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/tesis/raporlar')
        const json = await res.json()
        if (json.toplamOgrenci !== undefined) setData(json)
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Rapor verileri yuklenemedi.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          Raporlar
        </h1>
        <p className="text-muted-foreground">Tesis ozet istatistikleri</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Öğrenci"
          value={data.toplamOgrenci}
          subtitle={`Aktif: ${data.aktifOgrenci}`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Haftalik Ders"
          value={data.dersSayisi}
          subtitle="Ders programi"
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatCard
          title="Antrenör"
          value={data.antrenorSayisi}
          subtitle="Aktif antrenor"
          icon={<Dumbbell className="h-5 w-5" />}
        />
        <StatCard
          title="Sağlık Kaydı"
          value={data.saglikKaydiSayisi}
          subtitle="Toplam kayit"
          icon={<HeartPulse className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Öğrenci Durum Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatRow label="Aktif" value={data.aktifOgrenci} color="bg-green-500" total={data.toplamOgrenci} />
            <StatRow label="Pasif" value={data.pasifOgrenci} color="bg-red-500" total={data.toplamOgrenci} />
            <StatRow label="Deneme" value={data.denemeOgrenci} color="bg-amber-500" total={data.toplamOgrenci} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Brans Dagilimi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.bransDagilimi).map(([brans, count]) => (
              <StatRow key={brans} label={brans} value={count} color="bg-primary" total={data.toplamOgrenci} />
            ))}
            {Object.keys(data.bransDagilimi).length === 0 && (
              <p className="text-sm text-muted-foreground">Brans verisi yok</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bu Ay</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{data.buAyYeniKayit}</p>
          <p className="text-sm text-muted-foreground">yeni ogrenci kaydi</p>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon }: { title: string; value: number; subtitle: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatRow({ label, value, color, total }: { label: string; value: number; color: string; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{value} (%{pct})</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

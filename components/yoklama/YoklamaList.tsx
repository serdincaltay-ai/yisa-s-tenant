'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

export type YoklamaStatus = 'present' | 'absent' | 'excused' | 'late'

export type YoklamaItem = {
  athlete_id: string
  ad_soyad: string | null
  brans: string | null
  attendance_id?: string
  status: YoklamaStatus
}

type YoklamaListProps = {
  items: YoklamaItem[]
  onChange: (athleteId: string, status: YoklamaStatus) => void
  isMobile?: boolean
}

export function YoklamaList({ items, onChange, isMobile }: YoklamaListProps) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Bu tarih ve branşta öğrenci bulunamadı.
      </p>
    )
  }

  const btnClass = 'min-h-[40px] px-3 flex-1 flex items-center justify-center gap-1 text-sm font-medium transition-colors rounded'
  const btnGeldi = `${btnClass} border border-green-600 bg-green-600/20 text-green-400 hover:bg-green-600/40`
  const btnGelmedi = `${btnClass} border border-red-600/50 bg-red-600/10 text-red-400 hover:bg-red-600/30`
  const btnIzinli = `${btnClass} border border-amber-600/50 bg-amber-600/20 text-amber-400 hover:bg-amber-600/40`
  const btnHasta = `${btnClass} border border-blue-600/50 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40`

  const StatusButtons = ({ item }: { item: YoklamaItem }) => (
    <div className="flex gap-1 flex-wrap">
      <button
        type="button"
        className={item.status === 'present' ? `${btnGeldi} ring-2 ring-green-500` : btnGeldi}
        onClick={() => onChange(item.athlete_id, 'present')}
      >
        Geldi
      </button>
      <button
        type="button"
        className={item.status === 'absent' ? `${btnGelmedi} ring-2 ring-red-500` : btnGelmedi}
        onClick={() => onChange(item.athlete_id, 'absent')}
      >
        Gelmedi
      </button>
      <button
        type="button"
        className={item.status === 'excused' ? `${btnIzinli} ring-2 ring-amber-500` : btnIzinli}
        onClick={() => onChange(item.athlete_id, 'excused')}
      >
        MUAF
      </button>
      <button
        type="button"
        className={item.status === 'late' ? `${btnHasta} ring-2 ring-blue-500` : btnHasta}
        onClick={() => onChange(item.athlete_id, 'late')}
      >
        Hasta
      </button>
    </div>
  )

  if (isMobile) {
    return (
      <div className="grid gap-4 sm:hidden">
        {items.map((item) => (
          <Card key={item.athlete_id}>
            <CardContent className="p-4">
              <p className="font-medium text-foreground mb-3">{item.ad_soyad ?? '—'}</p>
              <p className="text-sm text-muted-foreground mb-2">{item.brans ?? '—'}</p>
              <StatusButtons item={item} />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="h-12 px-4 text-left font-medium">Ad Soyad</th>
            <th className="h-12 px-4 text-left font-medium">Branş</th>
            <th className="h-12 px-4 text-left font-medium min-w-[280px]">Durum</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.athlete_id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="p-4 font-medium">{item.ad_soyad ?? '—'}</td>
              <td className="p-4 text-muted-foreground">{item.brans ?? '—'}</td>
              <td className="p-2">
                <StatusButtons item={item} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function YoklamaOzet({ rows }: { rows: Array<{ tarih: string; geldi: number; gelmedi: number; izinli: number; hasta: number }> }) {
  if (rows.length === 0) return null
  return (
    <div className="rounded-lg border overflow-hidden">
      <h3 className="text-sm font-medium px-4 py-2 bg-muted/50 border-b">Son 7 Gün Yoklama Özeti</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="h-10 px-4 text-left font-medium">Tarih</th>
            <th className="h-10 px-4 text-right font-medium">Geldi</th>
            <th className="h-10 px-4 text-right font-medium">Gelmedi</th>
            <th className="h-10 px-4 text-right font-medium">MUAF</th>
            <th className="h-10 px-4 text-right font-medium">Hasta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.tarih} className="border-b last:border-0 hover:bg-muted/20">
              <td className="p-3">{new Date(r.tarih + 'T12:00:00').toLocaleDateString('tr-TR')}</td>
              <td className="p-3 text-right text-green-500">{r.geldi}</td>
              <td className="p-3 text-right text-red-500">{r.gelmedi}</td>
              <td className="p-3 text-right text-amber-500">{r.izinli}</td>
              <td className="p-3 text-right text-blue-500">{r.hasta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

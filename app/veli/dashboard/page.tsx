'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { PanelHeader } from '@/components/PanelHeader'
import { VeliBottomNav } from '@/components/PanelBottomNav'
import { Users, Calendar, Loader2, TrendingUp, Wallet, Activity, CalendarDays, Ruler } from 'lucide-react'

type Child = {
  id: string
  name: string
  surname?: string | null
  birth_date?: string | null
  branch?: string | null
  level?: string | null
  ders_kredisi?: number | null
}

export default function VeliDashboardPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { rate: number; lastDate: string | null }>>({})

  const fetchChildren = useCallback(async () => {
    const res = await fetch('/api/veli/children')
    const data = await res.json()
    setChildren(Array.isArray(data.items) ? data.items : [])
  }, [])

  useEffect(() => {
    fetchChildren().finally(() => setLoading(false))
  }, [fetchChildren])

  useEffect(() => {
    children.forEach((c) => {
      fetch(`/api/veli/attendance?athlete_id=${c.id}&days=30`)
        .then((r) => r.json())
        .then((d) => {
          setAttendanceMap((prev) => ({
            ...prev,
            [c.id]: {
              rate: d?.attendanceRate ?? 0,
              lastDate: d?.items?.[0]?.lesson_date ?? null,
            },
          }))
        })
    })
  }, [children])

  const ageFromBirth = (d: string | null | undefined) => {
    if (!d) return null
    const diff = new Date().getTime() - new Date(d).getTime()
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <PanelHeader panelName="VELİ PANELİ" />

      <main className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : children.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-16 w-16 text-zinc-600 mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Çocuk Kaydı Yok</h2>
            <p className="text-sm text-zinc-400 max-w-sm">
              Hesabınıza bağlı çocuk bulunamadı. Tesisinizle iletişime geçin — çocuğunuzu kaydettiklerinde e-posta adresinizi veli olarak tanımlamaları gerekir.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-white">Çocuklarım</h2>
            <p className="text-sm text-zinc-400">Her kartta devamsızlık özeti görünür; detay için karta tıklayın.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {children.map((c) => {
                const att = attendanceMap[c.id]
                return (
                  <Link key={c.id} href={`/veli/cocuk/${c.id}`}>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.05)] transition-all duration-300 cursor-pointer min-h-[120px]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 font-semibold">
                          {(c.name?.[0] ?? '?') + (c.surname?.[0] ?? '')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white truncate">
                            {c.name} {c.surname ?? ''}
                          </p>
                          <p className="text-sm text-zinc-400">
                            {ageFromBirth(c.birth_date) ?? '—'} yaş · {c.branch ?? '—'}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            <span className="text-zinc-500">
                              Son yoklama: {att?.lastDate ? new Date(att.lastDate).toLocaleDateString('tr-TR') : '—'}
                            </span>
                            <span className={`font-medium ${att && att.rate >= 80 ? 'text-emerald-400' : att && att.rate > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                              Devam: %{att?.rate ?? 0}
                            </span>
                            <span className="font-medium text-cyan-400">
                              Kalan: {(c.ders_kredisi ?? 0)}
                            </span>
                          </div>
                        </div>
                        <Calendar className="h-5 w-5 shrink-0 text-zinc-600" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <Link href="/veli/odeme">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300">
                  <Wallet className="h-6 w-6 text-cyan-400 mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-white">Aidat & Ödemeler</p>
                  <p className="text-xs text-zinc-500 mt-1">Borç durumu ve geçmiş</p>
                </div>
              </Link>
              <Link href="/veli/gelisim">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300">
                  <TrendingUp className="h-6 w-6 text-cyan-400 mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-white">Gelişim Takibi</p>
                  <p className="text-xs text-zinc-500 mt-1">Boy, kilo, esneklik</p>
                </div>
              </Link>
              <Link href="/veli/olcumler">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300">
                  <Ruler className="h-6 w-6 text-violet-400 mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-white">Branş Ölçümleri</p>
                  <p className="text-xs text-zinc-500 mt-1">Branşa özel parametreler</p>
                </div>
              </Link>
              <Link href="/veli/hareketler">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300">
                  <Activity className="h-6 w-6 text-emerald-400 mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-white">Hareket Havuzu</p>
                  <p className="text-xs text-zinc-500 mt-1">Çalışma ve ilerleme</p>
                </div>
              </Link>
              <Link href="/veli/randevu" className="col-span-2">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300">
                  <CalendarDays className="h-6 w-6 text-amber-400 mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-white">Randevu Al</p>
                  <p className="text-xs text-zinc-500 mt-1">Antrenör ile görüşme randevusu oluşturun</p>
                </div>
              </Link>
            </div>
          </>
        )}
      </main>

      <VeliBottomNav />
    </div>
  )
}

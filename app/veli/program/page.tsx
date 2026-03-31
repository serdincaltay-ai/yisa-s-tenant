'use client'

import React, { useEffect, useState } from 'react'
import { PanelHeader } from '@/components/PanelHeader'
import { VeliBottomNav } from '@/components/PanelBottomNav'
import { Calendar, Clock, User, MapPin } from 'lucide-react'

type Child = { id: string; name: string; surname?: string }
type ScheduleItem = {
  id?: string
  gun: string
  saat: string
  ders_adi: string
  brans?: string | null
  antrenor?: string | null
  salon?: string | null
  athlete_name?: string | null
}

const DAYS = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz']
const DAY_MAP: Record<string, string> = {
  'Pzt': 'Pazartesi', 'Sal': 'Salı', 'Car': 'Çarşamba', 'Per': 'Perşembe',
  'Cum': 'Cuma', 'Cmt': 'Cumartesi', 'Paz': 'Pazar',
}

export default function VeliProgramPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [selectedDay, setSelectedDay] = useState('Pzt')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/veli/children').then((r) => r.json()).catch(() => ({ items: [] })),
      fetch('/api/veli/schedule').then((r) => r.json()).catch(() => ({ items: [] })),
    ]).then(([childrenData, schedData]) => {
      setChildren(childrenData.items ?? [])
      setSchedule(schedData.items ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const filteredSchedule = schedule.filter((s) => {
    const gunFull = s.gun ?? ''
    return gunFull === DAY_MAP[selectedDay] || gunFull === selectedDay
  })

  // Haftalik ozet: her cocuk icin toplam ders sayisi
  const childDersCounts: Record<string, number> = {}
  children.forEach((c) => {
    childDersCounts[c.name] = schedule.filter((s) =>
      s.athlete_name === c.name || s.athlete_name === `${c.name} ${c.surname ?? ''}`
    ).length
  })
  const toplamDers = schedule.length

  const branchColor = (brans?: string | null) => {
    const b = (brans ?? '').toLowerCase()
    if (b.includes('cimnastik') || b.includes('jimnastik')) return 'border-cyan-400/30 bg-cyan-400/10'
    if (b.includes('yuzme') || b.includes('yüzme')) return 'border-blue-400/30 bg-blue-400/10'
    if (b.includes('atletizm')) return 'border-orange-400/30 bg-orange-400/10'
    return 'border-zinc-700 bg-zinc-800/50'
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <PanelHeader panelName="VELİ PANELİ" />

      <main className="p-4 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
                      Ders Programı
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">Haftalık {toplamDers} ders</p>
        </div>

        {/* Gun secici — pill butonlar */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                selectedDay === day
                  ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Ders kartlari */}
        {loading ? (
          <p className="text-zinc-400">Yükleniyor...</p>
        ) : filteredSchedule.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <Calendar className="h-12 w-12 text-zinc-600 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-zinc-400">{DAY_MAP[selectedDay]} günü için ders yok.</p>
            <p className="text-xs text-zinc-500 mt-1">Program tesisiniz tarafından yönetilmektedir.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSchedule.map((s, i) => (
              <div key={s.id ?? i} className={`rounded-2xl border p-4 ${branchColor(s.brans)}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white">{s.ders_adi || s.brans || 'Ders'}</p>
                    {s.athlete_name && (
                      <p className="text-sm text-zinc-300 mt-0.5">{s.athlete_name}</p>
                    )}
                    <span className="inline-block mt-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5">Aktif</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" strokeWidth={1.5} />
                    <span>{s.saat}</span>
                  </div>
                  {s.antrenor && (
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-cyan-400" strokeWidth={1.5} />
                      <span>{s.antrenor}</span>
                    </div>
                  )}
                  {s.salon && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-cyan-400" strokeWidth={1.5} />
                      <span>{s.salon}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Haftalik Ozet — 3 kutucuk */}
        <div className="mt-2">
          <h3 className="text-sm font-semibold text-white mb-3">Haftalık Özet</h3>
          <div className="grid grid-cols-3 gap-3">
            {children.slice(0, 2).map((c) => (
              <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                <p className="text-xs text-zinc-400 truncate">{c.name} Dersleri</p>
                <p className="text-xl font-bold text-white mt-1">{childDersCounts[c.name] ?? 0}</p>
              </div>
            ))}
            <div className="bg-zinc-900 border border-cyan-400/30 rounded-2xl p-3 text-center">
              <p className="text-xs text-zinc-400">Toplam</p>
              <p className="text-xl font-bold text-cyan-400 mt-1">{toplamDers}</p>
            </div>
          </div>
        </div>
      </main>

      <VeliBottomNav />
    </div>
  )
}

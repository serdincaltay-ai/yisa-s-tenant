'use client'

import { useEffect, useState } from 'react'
import { Calendar, Loader2, Clock } from 'lucide-react'

type DersProgrami = {
  id: string
  gun: string
  saat_baslangic: string
  saat_bitis: string
  ders_adi: string
  brans: string
  salon: string
  ogrenci_sayisi: number
  seviye: string
}

const GUN_SIRALAMA = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

export default function DersProgramiPage() {
  const [loading, setLoading] = useState(true)
  const [program, setProgram] = useState<DersProgrami[]>([])

  useEffect(() => {
    fetch('/api/antrenor/schedules')
      .then((r) => r.json())
      .then((d) => setProgram(d.dersler ?? d.schedules ?? []))
      .catch(() => setProgram([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  // Günlere göre grupla
  const gunlereGore = GUN_SIRALAMA.reduce<Record<string, DersProgrami[]>>((acc, gun) => {
    const gunDersleri = program.filter((d) => d.gun === gun)
    if (gunDersleri.length > 0) acc[gun] = gunDersleri
    return acc
  }, {})

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <Calendar className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
        Ders Programı
      </h1>

      {Object.keys(gunlereGore).length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
          <p className="text-zinc-400 text-sm">Henüz ders programı oluşturulmamış.</p>
        </div>
      ) : (
        Object.entries(gunlereGore).map(([gun, dersler]) => (
          <div key={gun} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
              {gun}
              <span className="text-xs text-zinc-500 font-normal">({dersler.length} ders)</span>
            </h3>
            <div className="space-y-2">
              {dersler
                .sort((a, b) => a.saat_baslangic.localeCompare(b.saat_baslangic))
                .map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl border border-zinc-700 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center text-xs text-cyan-400 min-w-[60px]">
                        <Clock className="h-3.5 w-3.5 mb-0.5" strokeWidth={1.5} />
                        <span>{d.saat_baslangic}</span>
                        <span className="text-zinc-600">{d.saat_bitis}</span>
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{d.ders_adi}</p>
                        <p className="text-xs text-zinc-400">
                          {d.brans}{d.seviye ? ` · ${d.seviye}` : ''}{d.salon ? ` · ${d.salon}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-cyan-400/10 text-cyan-400 text-xs px-3 py-1">
                      {d.ogrenci_sayisi} öğrenci
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}
    </main>
  )
}

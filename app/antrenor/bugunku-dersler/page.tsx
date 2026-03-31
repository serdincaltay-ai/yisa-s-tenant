'use client'

import { useEffect, useState } from 'react'
import { Calendar, Users, Clock, Loader2 } from 'lucide-react'

type Sporcu = { id: string; name: string; surname?: string; level?: string; group?: string }
type Ders = { id: string; gun: string; saat: string; ders_adi: string; brans?: string; sporcular: Sporcu[] }

export default function BugunkulDerslerPage() {
  const [loading, setLoading] = useState(true)
  const [gun, setGun] = useState('')
  const [tarih, setTarih] = useState('')
  const [saatGruplari, setSaatGruplari] = useState<Record<string, Ders[]>>({})

  useEffect(() => {
    fetch('/api/antrenor/bugunku-dersler')
      .then((r) => r.json())
      .then((d) => {
        setGun(d.gun ?? '')
        setTarih(d.tarih ?? '')
        setSaatGruplari(d.saatGruplari ?? {})
      })
      .catch(() => setSaatGruplari({}))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  const saatler = Object.keys(saatGruplari).sort()

  return (
    <main className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
          Bugünkü Dersler
        </h1>
        <p className="text-sm text-zinc-400">{gun} — {tarih}</p>
      </div>

      {saatler.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <Calendar className="h-10 w-10 text-zinc-600 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-zinc-400">Bugün ders bulunmuyor.</p>
        </div>
      ) : (
        saatler.map((saat) => (
          <div key={saat} className="space-y-3">
            {/* Saat Başlığı */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold text-cyan-400">{saat}</h2>
            </div>

            {/* Bu saatteki dersler */}
            {saatGruplari[saat].map((ders) => (
              <div key={ders.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{ders.ders_adi}</h3>
                    {ders.brans && <p className="text-xs text-cyan-400">{ders.brans}</p>}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {ders.sporcular.length} sporcu
                  </span>
                </div>

                {ders.sporcular.length > 0 ? (
                  <div className="space-y-2">
                    {ders.sporcular.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-xl border border-zinc-700 p-2.5">
                        <div>
                          <p className="text-sm font-medium text-white">{s.name} {s.surname ?? ''}</p>
                          {(s.level || s.group) && (
                            <p className="text-[10px] text-zinc-500">{[s.level, s.group].filter(Boolean).join(' · ')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">Bu derse atanmış sporcu yok.</p>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </main>
  )
}

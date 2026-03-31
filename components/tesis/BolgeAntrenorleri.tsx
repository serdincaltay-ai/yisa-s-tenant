'use client'

import React, { useState } from 'react'
import { MapPin, Dumbbell, Calendar, Filter } from 'lucide-react'

type BolgeAntrenor = {
  isim: string
  brans: string
  ilce: string
  sehir: string
  adres?: string
  lisans_turu?: string
}

interface BolgeAntrenorleriProps {
  antrenorler: BolgeAntrenor[]
  sehir?: string
}

export function BolgeAntrenorleri({ antrenorler, sehir }: BolgeAntrenorleriProps) {
  const [selectedIlce, setSelectedIlce] = useState<string>('')

  if (!antrenorler || antrenorler.length === 0) return null

  const ilceler = [...new Set(antrenorler.map((a) => a.ilce).filter(Boolean))].sort()
  const filtered = selectedIlce ? antrenorler.filter((a) => a.ilce === selectedIlce) : antrenorler

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-cyan-400" strokeWidth={1.5} />
        Bölge Antrenörleri
      </h2>
      <p className="text-xs text-zinc-400 mb-4">
        {sehir ?? 'Tüm şehirler'} — Yarışmacı sporcu çalıştıran antrenörler
      </p>

      {/* İlçe Filtresi */}
      {ilceler.length > 1 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
          <button
            onClick={() => setSelectedIlce('')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedIlce === ''
                ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            Tümü
          </button>
          {ilceler.map((ilce) => (
            <button
              key={ilce}
              onClick={() => setSelectedIlce(ilce)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedIlce === ilce
                  ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {ilce}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a, i) => (
          <div key={`${a.isim}-${i}`} className="glass-panel p-4 border border-zinc-800">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 font-bold text-sm shrink-0">
                {a.isim.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm">{a.isim}</h3>
                <p className="text-xs text-cyan-400 flex items-center gap-1 mt-0.5">
                  <Dumbbell className="h-3 w-3" strokeWidth={1.5} />
                  {a.brans}
                </p>
                {a.lisans_turu && (
                  <p className="text-[10px] text-zinc-500 mt-0.5">Lisans: {a.lisans_turu}</p>
                )}
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-zinc-400">
                  <MapPin className="h-3 w-3 text-zinc-500" strokeWidth={1.5} />
                  {a.ilce}, {a.sehir}
                  {a.adres && ` — ${a.adres}`}
                </div>
              </div>
            </div>
            <button className="mt-3 w-full rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-3 py-2 text-xs font-medium hover:bg-cyan-400/20 transition-colors flex items-center justify-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
              Randevu Al
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import { Check } from 'lucide-react'

type Paket = {
  isim: string
  dersSayisi: number
  fiyat: number
  badge?: string
  ozellikler: string[]
  vurgulu?: boolean
  glowColor?: string
}

const DEFAULT_PAKETLER: Paket[] = [
  {
    isim: 'Standart',
    dersSayisi: 24,
    fiyat: 30000,
    ozellikler: ['24 ders/ay', 'Temel takip', 'Veli paneli', 'Yoklama'],
  },
  {
    isim: 'Orta',
    dersSayisi: 48,
    fiyat: 52800,
    badge: 'Popüler',
    vurgulu: true,
    glowColor: 'cyan',
    ozellikler: ['48 ders/ay', 'Gelişmiş takip', 'Veli paneli', 'Yoklama', 'Galeri', 'Antrenör profil', 'Duyurular'],
  },
  {
    isim: 'Premium',
    dersSayisi: 60,
    fiyat: 60000,
    badge: 'En İyi',
    glowColor: 'orange',
    ozellikler: ['60 ders/ay', 'Tam takip', 'Veli paneli', 'Yoklama', 'Galeri', 'Antrenör profil', 'Duyurular', 'AI Robot karşılama', 'Randevu sistemi', 'Canlı istatistik', 'Video tanıtım'],
  },
]

export function PaketFiyatlari({ paketler }: { paketler?: Paket[] }) {
  const data = paketler ?? DEFAULT_PAKETLER

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {data.map((p) => {
        const borderClass = p.glowColor === 'cyan'
          ? 'border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
          : p.glowColor === 'orange'
            ? 'border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
            : 'border-zinc-800'

        return (
          <div
            key={p.isim}
            className={`relative bg-zinc-900 border rounded-2xl p-8 flex flex-col ${borderClass}`}
          >
            {p.badge && (
              <span className={`absolute -top-3 right-6 rounded-full px-4 py-1 text-xs font-bold ${
                p.glowColor === 'orange'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-zinc-950'
                  : 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-zinc-950'
              }`}>
                {p.badge}
              </span>
            )}

            <h3 className="text-lg font-bold text-white uppercase tracking-wide">{p.isim}</h3>
            <p className="text-sm text-zinc-400 mt-1">{p.dersSayisi} ders/ay</p>

            <div className="mt-6 mb-6">
              <span className="text-4xl font-bold text-white">{p.fiyat.toLocaleString('tr-TR')}</span>
              <span className="text-zinc-400 ml-1">TL</span>
              <p className="text-sm text-zinc-500">/ay</p>
            </div>

            <div className="flex-1 space-y-3 mb-6">
              {p.ozellikler.map((oz) => (
                <div key={oz} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={2} />
                  <span className="text-sm text-zinc-400">{oz}</span>
                </div>
              ))}
            </div>

            <button className={`w-full rounded-xl py-3 text-sm font-medium transition-all ${
              p.vurgulu
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-zinc-950 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                : p.glowColor === 'orange'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-zinc-950 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                  : 'bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-600'
            }`}>
              Seçim Yap
            </button>
          </div>
        )
      })}
    </div>
  )
}

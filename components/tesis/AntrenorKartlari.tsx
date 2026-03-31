'use client'

import React from 'react'
import { Award, CheckCircle } from 'lucide-react'

export type AntrenorKart = {
  isim: string
  brans: string
  deneyim?: string
  lisans?: string
  yarismaciDeneyimi?: boolean
  bio?: string
}

type Props = {
  antrenorler: AntrenorKart[]
  baslik?: string
  federasyonTemsilcisi?: string
  yarismaKulupleri?: string[]
}

export function AntrenorKartlari({ antrenorler, baslik = 'Antrenörlerimiz', federasyonTemsilcisi, yarismaKulupleri }: Props) {
  if (!antrenorler || antrenorler.length === 0) return null

  return (
    <div className="space-y-8">
      {/* Antrenör Kartları */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">{baslik}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {antrenorler.map((a) => (
            <div key={a.isim} className="glass-panel p-5 border border-zinc-800 rounded-2xl space-y-3">
              {/* Avatar */}
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 font-bold text-lg">
                  {a.isim.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{a.isim}</h3>
                  <p className="text-xs text-cyan-400">{a.brans}</p>
                </div>
              </div>

              {/* Detaylar */}
              <div className="space-y-1.5 text-xs">
                {a.deneyim && <p className="text-zinc-400">{a.deneyim} deneyim</p>}
                {a.lisans && (
                  <p className="text-zinc-400 flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-amber-400" />
                    {a.lisans}
                  </p>
                )}
                {a.yarismaciDeneyimi && (
                  <p className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Yarışmacı sporcu deneyimi
                  </p>
                )}
              </div>

              {/* Bio */}
              {a.bio && (
                <p className="text-xs text-zinc-500 italic border-t border-zinc-800 pt-2">{a.bio}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Federasyon İl Temsilcisi */}
      {federasyonTemsilcisi && (
        <div className="glass-panel p-4 border border-zinc-800 rounded-2xl">
          <h3 className="text-sm font-semibold text-white mb-1">Federasyon İl Temsilcisi</h3>
          <p className="text-sm text-cyan-400">{federasyonTemsilcisi}</p>
        </div>
      )}

      {/* Yarışmaya Katılan Kulüpler */}
      {yarismaKulupleri && yarismaKulupleri.length > 0 && (
        <div className="glass-panel p-4 border border-zinc-800 rounded-2xl">
          <h3 className="text-sm font-semibold text-white mb-2">İlde Yarışmaya Katılan Kulüpler</h3>
          <div className="flex flex-wrap gap-2">
            {yarismaKulupleri.map((k) => (
              <span key={k} className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

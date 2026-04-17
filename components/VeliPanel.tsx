'use client'

import * as React from 'react'

export interface VeliPanelProps {
  cocukAdi?: string
  cocukYasi?: number
  cocukFotoSrc?: string
  tenantSlug?: string
}

const SON_OLCUM = { skor: 78, degisim: '+4', tarih: '2026-04-12' }
const HAFTALIK = { antrenman: 3, hedef: 4, dakika: 165 }
const RANDEVU = { tarih: '2026-04-19', saat: '17:30', salon: 'BJK Tuzla' }
const MESAJLAR = [
  { id: 1, kim: 'Antr. Mert', not: 'Bu hafta esneklik çalışmasında belirgin ilerleme var.', zaman: '2 saat önce' },
  { id: 2, kim: 'YİSA-S',     not: 'Yeni 900 alan raporu hazır — incele.',                   zaman: 'dün' },
]

export function VeliPanel({
  cocukAdi = 'Ada',
  cocukYasi = 8,
  cocukFotoSrc,
  tenantSlug = 'bjktuzlacimnastik',
}: VeliPanelProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-2xl">
      {/* ÜST: ÇOCUK KIMLIK */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
        <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-cyan-400 bg-slate-800">
          {cocukFotoSrc ? (
            <img src={cocukFotoSrc} alt={cocukAdi} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-cyan-300">
              {cocukAdi.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold">{cocukAdi}</div>
          <div className="text-sm text-slate-400">{cocukYasi} yaş · {tenantSlug}</div>
        </div>
        <button className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-400 hover:text-cyan-200">
          Profil
        </button>
      </div>

      {/* GRID: 5 KART */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* SON ÖLÇÜM */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500">Son Ölçüm Skoru</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-cyan-300">{SON_OLCUM.skor}</span>
            <span className="text-sm font-semibold text-emerald-400">{SON_OLCUM.degisim}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">{SON_OLCUM.tarih}</div>
        </div>

        {/* HAFTALIK ANTRENMAN */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500">Bu Hafta</div>
          <div className="mt-2 text-4xl font-bold text-amber-300">
            {HAFTALIK.antrenman}<span className="text-xl text-slate-500">/{HAFTALIK.hedef}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-amber-400" style={{ width: `${(HAFTALIK.antrenman / HAFTALIK.hedef) * 100}%` }} />
          </div>
          <div className="mt-2 text-xs text-slate-500">{HAFTALIK.dakika} dk toplam</div>
        </div>

        {/* 900 ALAN RADAR */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500">900 Alan Profili</div>
          <svg viewBox="0 0 120 120" className="mx-auto mt-2 h-28 w-28">
            <polygon points="60,10 100,38 88,90 32,90 20,38" fill="none" stroke="#334155" strokeWidth="1" />
            <polygon points="60,30 88,46 80,80 40,80 32,46" fill="none" stroke="#475569" strokeWidth="1" />
            <polygon points="60,22 92,42 84,86 36,86 28,42" fill="rgba(52,211,153,0.35)" stroke="#34d399" strokeWidth="2" />
            <circle cx="60" cy="60" r="2" fill="#34d399" />
          </svg>
          <div className="mt-1 text-center text-xs text-slate-500">5 ana eksen · radar</div>
        </div>

        {/* YAKLAŞAN RANDEVU */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500">Yaklaşan Randevu</div>
          <div className="mt-2 text-2xl font-bold text-cyan-200">{RANDEVU.saat}</div>
          <div className="mt-1 text-sm text-slate-300">{RANDEVU.tarih}</div>
          <div className="mt-1 text-xs text-slate-500">{RANDEVU.salon}</div>
          <button className="mt-3 w-full rounded-xl bg-cyan-400 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300">
            Onayla
          </button>
        </div>

        {/* ANTRENÖR MESAJLARI */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-slate-500">Antrenör & Sistem Mesajları</div>
            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">
              {MESAJLAR.length} yeni
            </span>
          </div>
          <ul className="mt-3 space-y-3">
            {MESAJLAR.map((m) => (
              <li key={m.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">{m.kim}</span>
                  <span>{m.zaman}</span>
                </div>
                <p className="mt-1 text-sm text-slate-300">{m.not}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default VeliPanel

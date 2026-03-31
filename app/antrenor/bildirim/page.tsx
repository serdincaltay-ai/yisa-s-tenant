'use client'

import React from 'react'
import { Bell, Megaphone, Calendar, Users } from 'lucide-react'

export default function AntrenorBildirimPage() {
  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-white">Bildirimler</h1>
      <p className="text-sm text-zinc-400">0 okunmamış bildirim</p>

      {/* Filtre sekmeleri */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['Tümü', 'Okunmamış', 'Yoklama', 'Sporcu', 'Duyuru'].map((tab, i) => (
          <button
            key={tab}
            className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              i === 0
                ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bos durum */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 mb-4">
          <Megaphone className="h-8 w-8" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Yakında</h2>
        <p className="text-sm text-zinc-400 max-w-sm">
          Bildirimler yakında aktif olacak. Yoklama, sporcu ve duyuru bildirimleri burada görüntülenecek.
        </p>
      </div>

      {/* Ornek bildirim kartlari (sablon) */}
      <div className="space-y-3 opacity-40">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10">
            <Calendar className="h-5 w-5 text-cyan-400" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white text-sm">Ders Değişikliği</p>
            <p className="text-xs text-zinc-500 mt-1">Cumartesi dersi 10:00 olarak güncellendi.</p>
            <p className="text-[10px] text-zinc-600 mt-2">2 saat önce</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-cyan-400 mt-1" />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
            <Users className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white text-sm">Yeni Sporcu</p>
            <p className="text-xs text-zinc-500 mt-1">Ali Yılmaz grubunuza eklendi.</p>
            <p className="text-[10px] text-zinc-600 mt-2">1 gün önce</p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <Bell className="h-5 w-5 text-amber-400" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white text-sm">Duyuru</p>
            <p className="text-xs text-zinc-500 mt-1">Yarıyıl tatili programı yayınlandı.</p>
            <p className="text-[10px] text-zinc-600 mt-2">3 gün önce</p>
          </div>
        </div>
      </div>
    </main>
  )
}

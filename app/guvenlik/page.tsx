'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Camera, ClipboardList, Clock3, ShieldCheck, UserCheck } from 'lucide-react'

interface SecurityEvent {
  name: string
  row_count: number
}

export default function GuvenlikPage() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/robot/veri/status')
        const data = await res.json()
        if (!res.ok) {
          setError(data?.error ?? 'Veri alınamadı')
        } else {
          const rows = Array.isArray(data?.tables) ? data.tables : []
          const securityRows = rows
            .filter((r: { name?: string }) => typeof r?.name === 'string' && (r.name.includes('security') || r.name.includes('audit')))
            .slice(0, 8)
          setEvents(securityRows)
        }
      } catch {
        setError('Bağlantı hatası')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-4">
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-cyan-400" />
          Güvenlik Personeli Paneli
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Giriş-çıkış takibi, ziyaretçi kayıt ve kamera bölgeleri için özet görünüm.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-4">
          <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
            <UserCheck className="h-4 w-4 text-emerald-300" />
            Giriş-Çıkış Takibi
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Personel ve ziyaretçi giriş/çıkış kayıtları güvenlik logs akışından izlenir.
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-4">
          <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
            <ClipboardList className="h-4 w-4 text-amber-300" />
            Ziyaretçi Kayıt
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Ziyaretçi girişlerinin kimlik ve saat bilgileri takip edilir.
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-4">
          <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
            <Camera className="h-4 w-4 text-cyan-300" />
            Kamera Bölgeleri
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Kamera kapsama alanı ve olay ilişkilendirme güvenlik operasyonuna destek sağlar.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-6 text-slate-300 flex items-center gap-2">
          <Clock3 className="h-4 w-4 animate-pulse" />
          Yükleniyor...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-4">
          <h2 className="text-sm font-medium text-slate-200 mb-3">Güvenlik İlgili Tablolar</h2>
          <div className="space-y-2">
            {events.length === 0 && <p className="text-sm text-slate-400">Gösterilecek güvenlik kaydı bulunamadı.</p>}
            {events.map((e) => (
              <div key={e.name} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
                <span className="text-sm text-slate-100">{e.name}</span>
                <span className="text-xs rounded-full bg-cyan-500/20 px-2 py-1 text-cyan-200">
                  {e.row_count} kayıt
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

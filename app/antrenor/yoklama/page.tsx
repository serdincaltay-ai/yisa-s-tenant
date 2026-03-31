'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Save, Loader2 } from 'lucide-react'

type Schedule = { id: string; gun: string; saat: string; ders_adi: string; brans?: string }
type Sporcu = { id: string; name: string; surname?: string; level?: string; group?: string; mevcutDurum: string | null }

export default function AntrenorYoklamaPage() {
  const router = useRouter()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [sporcular, setSporcular] = useState<Sporcu[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [durumMap, setDurumMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/antrenor/schedules')
      .then((r) => r.json())
      .then((d) => setSchedules(d.items ?? []))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedSchedule) {
      setSporcular([])
      setDurumMap({})
      return
    }
    setLoading(true)
    fetch(`/api/antrenor/yoklama?scheduleId=${encodeURIComponent(selectedSchedule)}`)
      .then((r) => r.json())
      .then((d) => {
        const list = d.sporcular ?? []
        setSporcular(list)
        const m: Record<string, string> = {}
        list.forEach((s: Sporcu) => {
          const st = s.mevcutDurum
          if (st === 'present') m[s.id] = 'geldi'
          else if (st === 'excused') m[s.id] = 'izinli'
          else if (st === 'absent') m[s.id] = 'gelmedi'
          else m[s.id] = ''
        })
        setDurumMap(m)
      })
      .catch(() => {
        setSporcular([])
        setDurumMap({})
      })
      .finally(() => setLoading(false))
  }, [selectedSchedule])

  const setDurum = (athleteId: string, durum: string) => {
    setDurumMap((prev) => ({ ...prev, [athleteId]: durum }))
  }

  const handleKaydet = async () => {
    const records = Object.entries(durumMap)
      .filter(([, d]) => d === 'geldi' || d === 'gelmedi' || d === 'izinli')
      .map(([athlete_id, durum]) => ({ athlete_id, durum }))
    if (records.length === 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/antrenor/yoklama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      const j = await res.json()
      if (res.ok && j.ok) {
        router.refresh()
        const m: Record<string, string> = {}
        sporcular.forEach((s) => {
          m[s.id] = durumMap[s.id] ?? ''
        })
        setDurumMap(m)
      } else {
            alert(j.error ?? 'Kaydetme başarısız')
          }
        } catch {
          alert('Kaydetme başarısız')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = Object.values(durumMap).some((d) => d)

  return (
    <main className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Yoklama Al</h1>
        <p className="text-sm text-zinc-400">Ders seçin ve sporcuların devam durumunu işaretleyin.</p>
      </div>

      {/* Ders Secimi */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-white mb-2">Ders Seçimi</h3>
                <p className="text-xs text-zinc-500 mb-3">Yoklama alacağınız dersi seçin</p>
        <select
          value={selectedSchedule}
          onChange={(e) => setSelectedSchedule(e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white text-sm focus:border-cyan-400 focus:outline-none"
        >
          <option value="">Ders seçin</option>
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>
              {s.ders_adi} — {s.gun} {s.saat} {s.brans ? `(${s.brans})` : ''}
            </option>
          ))}
        </select>
      </div>

      {loading && selectedSchedule ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : sporcular.length > 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-1">Sporcular</h3>
          <p className="text-xs text-zinc-500 mb-3">Her sporcu için durum seçin: Geldi / Gelmedi / İzinli</p>
          <div className="space-y-3">
            {sporcular.map((s) => (
              <div key={s.id} className="rounded-xl border border-zinc-700 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-white">{s.name} {s.surname ?? ''}</p>
                    {(s.level || s.group) && (
                      <p className="text-xs text-zinc-500">{[s.level, s.group].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDurum(s.id, 'geldi')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-all ${
                      durumMap[s.id] === 'geldi'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" strokeWidth={1.5} /> Geldi
                  </button>
                  <button
                    onClick={() => setDurum(s.id, 'gelmedi')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-all ${
                      durumMap[s.id] === 'gelmedi'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <XCircle className="h-4 w-4" strokeWidth={1.5} /> Gelmedi
                  </button>
                  <button
                    onClick={() => setDurum(s.id, 'izinli')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-all ${
                      durumMap[s.id] === 'izinli'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <Clock className="h-4 w-4" strokeWidth={1.5} /> İzinli
                  </button>
                </div>
              </div>
            ))}
          </div>
          {hasChanges && (
            <button
              onClick={handleKaydet}
              disabled={saving}
              className="w-full mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-3 text-sm font-medium text-zinc-950 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" strokeWidth={1.5} />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          )}
        </div>
      ) : selectedSchedule ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <p className="text-sm text-zinc-400">Bu derse atanmış sporcu bulunamadı.</p>
        </div>
      ) : null}
    </main>
  )
}

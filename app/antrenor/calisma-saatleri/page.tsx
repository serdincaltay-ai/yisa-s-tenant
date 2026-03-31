'use client'

import { useEffect, useState } from 'react'
import { Clock, CheckCircle, Loader2, Calendar } from 'lucide-react'

type Schedule = { id: string; gun: string; saat: string; ders_adi: string; brans?: string }

const GUN_SIRA = ['Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi', 'Pazar']

export default function CalismaSaatleriPage() {
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(false)

  useEffect(() => {
    fetch('/api/antrenor/calisma-saatleri')
      .then((r) => r.json())
      .then((d) => setSchedules(d.items ?? []))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false))
  }, [])

  const handleOnayla = async () => {
    setApproving(true)
    try {
      const res = await fetch('/api/antrenor/calisma-saatleri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hafta: new Date().toISOString().slice(0, 10) }),
      })
      const j = await res.json()
      if (j.ok) setApproved(true)
      else alert(j.error ?? 'Onay başarısız')
    } catch {
      alert('Onay başarısız')
    } finally {
      setApproving(false)
    }
  }

  // Günlere göre grupla
  const grouped: Record<string, Schedule[]> = {}
  for (const s of schedules) {
    const gun = s.gun ?? 'Belirsiz'
    if (!grouped[gun]) grouped[gun] = []
    grouped[gun].push(s)
  }

  const sortedGunler = Object.keys(grouped).sort((a, b) => {
    const ai = GUN_SIRA.indexOf(a)
    const bi = GUN_SIRA.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <main className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
          Çalışma Saatleri Onayı
        </h1>
        <p className="text-sm text-zinc-400">Haftalık ders programınızı inceleyin ve onaylayın.</p>
      </div>

      {schedules.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <Calendar className="h-10 w-10 text-zinc-600 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-zinc-400">Henüz ders programı tanımlanmamış.</p>
        </div>
      ) : (
        <>
          {sortedGunler.map((gun) => (
            <div key={gun} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" strokeWidth={1.5} />
                {gun}
              </h3>
              <div className="space-y-2">
                {grouped[gun].map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-zinc-700 p-3">
                    <div>
                      <p className="font-medium text-white text-sm">{s.ders_adi}</p>
                      <p className="text-xs text-zinc-400">{s.saat} {s.brans ? `· ${s.brans}` : ''}</p>
                    </div>
                    <span className="rounded-full bg-cyan-400/10 text-cyan-400 text-xs px-3 py-1">Ders</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Onay Butonu */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            {approved ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
                <span className="text-sm font-medium text-emerald-400">Bu haftanın programı onaylandı</span>
              </div>
            ) : (
              <button
                onClick={handleOnayla}
                disabled={approving}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-3 text-sm font-medium text-zinc-950 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" strokeWidth={1.5} />
                {approving ? 'Onaylanıyor...' : 'Bu Haftanın Programını Onayla'}
              </button>
            )}
          </div>
        </>
      )}
    </main>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { CELF_DIRECTORATES, CELF_DIRECTORATE_KEYS, type DirectorKey } from '@/lib/robots/celf-center'
import { RefreshCw } from 'lucide-react'

type DirectorStatus = {
  key: string
  name: string
  gelen: number
  giden: number
  durum: 'idle' | 'active'
}

export default function RobotsPage() {
  const [directors, setDirectors] = useState<DirectorStatus[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStatus = () => {
    setLoading(true)
    fetch('/api/directors/status')
      .then((r) => r.json())
      .then((d) => setDirectors(Array.isArray(d?.directors) ? d.directors : []))
      .catch(() => setDirectors([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStatus()
    const t = setInterval(fetchStatus, 30000)
    return () => clearInterval(t)
  }, [])

  const activeCount = directors.filter((d) => d.durum === 'active').length

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Direktörler (Canlı)</h1>
          <p className="text-slate-400">
            Hangi direktör çalışıyor, bugün kaç iş geldi/gitti
          </p>
        </div>
        <button
          type="button"
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Yenile
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CELF_DIRECTORATE_KEYS.map((key) => (
            <div
              key={key}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 animate-pulse"
            >
              <div className="h-5 bg-slate-700 rounded w-1/3 mb-2" />
              <div className="h-4 bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 flex gap-4">
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-emerald-400 text-sm">Bugün çalışan: </span>
              <span className="font-bold text-white">{activeCount}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600">
              <span className="text-slate-400 text-sm">Toplam: </span>
              <span className="font-bold text-white">{directors.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {directors.map((d) => {
              const dir = CELF_DIRECTORATES[d.key as DirectorKey]
              const isActive = d.durum === 'active'
              return (
                <div
                  key={d.key}
                  className={`rounded-xl border p-4 transition-colors ${
                    isActive
                      ? 'bg-cyan-500/10 border-cyan-500/40'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isActive ? 'bg-cyan-500 animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                    <span
                      className={`font-semibold ${
                        isActive ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    >
                      {d.key}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">
                    {dir?.name ?? d.name}
                  </p>
                  <div className="flex gap-3 text-xs">
                    <span className="text-slate-500">
                      Gelen: <span className="text-white">{d.gelen}</span>
                    </span>
                    <span className="text-slate-500">
                      Giden: <span className="text-emerald-400">{d.giden}</span>
                    </span>
                  </div>
                  {!isActive && (
                    <p className="text-[10px] text-slate-500 mt-2">
                      Bugün iş yok
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

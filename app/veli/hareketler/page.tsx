'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  Activity,
  CheckCircle,
  Clock,
  Play,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

type Child = { id: string; name: string; surname?: string; branch?: string }

interface MovementItem {
  id: string
  name: string
  description: string
  video_url: string | null
  image_url: string | null
  duration_seconds: number | null
  repetitions: number | null
  difficulty: string
  tamamlandi: boolean
  tamamlanma_tarihi: string | null
  ilerleme: number
  tekrar_sayisi: number
  son_calisma_tarihi: string | null
  antrenor_notu: string | null
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  if (seconds < 60) return `${seconds}sn`
  return `${Math.floor(seconds / 60)}dk`
}

function difficultyBadge(d: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    kolay: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Kolay' },
    orta: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Orta' },
    zor: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Zor' },
  }
  const info = map[d] ?? map.orta
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${info.bg} ${info.text}`}>
      {info.label}
    </span>
  )
}

export default function VeliHareketlerPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selected, setSelected] = useState('')
  const [movements, setMovements] = useState<MovementItem[]>([])
  const [branch, setBranch] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    fetch('/api/veli/children')
      .then((r) => r.json())
      .then((d) => {
        const list = d.items ?? []
        setChildren(list)
        if (list.length && !selected) setSelected(list[0].id)
      })
      .catch(() => setChildren([]))
  }, [])

  const fetchMovements = useCallback(async () => {
    if (!selected) {
      setMovements([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/veli/movements/havuz?athlete_id=${selected}`)
      const data = await res.json()
      setMovements(data.movements ?? [])
      setBranch(data.branch ?? '')
    } catch {
      setMovements([])
    } finally {
      setLoading(false)
    }
  }, [selected])

  useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  const filtered = movements.filter((m) => {
    if (filter === 'active') return !m.tamamlandi
    if (filter === 'completed') return m.tamamlandi
    return true
  })

  const completedCount = movements.filter((m) => m.tamamlandi).length
  const totalCount = movements.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <main className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/veli/dashboard" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
          Hareket Havuzu
        </h1>
      </div>

      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                selected === c.id
                  ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {c.name} {c.surname ?? ''}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : movements.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <Activity className="h-12 w-12 text-zinc-600 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-zinc-400">Henüz hareket kaydı yok.</p>
          <p className="text-xs text-zinc-500 mt-1">
            {branch ? `${branch} branşı için hareketler antrenörünüz tarafından atanacaktır.` : 'Branş bilgisi bulunamadı.'}
          </p>
        </div>
      ) : (
        <>
          {/* İlerleme özeti */}
          <div className="bg-zinc-900 border border-cyan-400/20 rounded-2xl p-4 shadow-[0_0_20px_rgba(34,211,238,0.05)]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-white">{branch} Hareketleri</p>
                <p className="text-xs text-zinc-400">
                  {completedCount}/{totalCount} tamamlandı
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-400/10">
                <span className="text-lg font-bold text-cyan-400">%{progressPercent}</span>
              </div>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Filtre */}
          <div className="flex gap-2">
            {([
              { key: 'all', label: 'Tümü' },
              { key: 'active', label: 'Aktif' },
              { key: 'completed', label: 'Tamamlandı' },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Hareket listesi */}
          <div className="space-y-3">
            {filtered.map((m) => {
              const isExpanded = expandedId === m.id
              return (
                <div
                  key={m.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    {m.tamamlandi ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{m.name}</p>
                        {difficultyBadge(m.difficulty)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-500">
                        {m.duration_seconds && <span>{formatDuration(m.duration_seconds)}</span>}
                        {m.repetitions && <span>{m.repetitions} tekrar</span>}
                        {m.son_calisma_tarihi && (
                          <span>Son: {new Date(m.son_calisma_tarihi).toLocaleDateString('tr-TR')}</span>
                        )}
                      </div>
                    </div>
                    {m.ilerleme > 0 && !m.tamamlandi && (
                      <div className="w-10 h-10 rounded-full border-2 border-cyan-400/30 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-cyan-400">%{m.ilerleme}</span>
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-zinc-500 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-zinc-800 pt-3">
                      {m.description && (
                        <p className="text-sm text-zinc-300">{m.description}</p>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        {m.duration_seconds && (
                          <div className="bg-zinc-800/50 rounded-lg p-2">
                            <p className="text-[10px] text-zinc-500">Süre</p>
                            <p className="text-xs font-medium text-white">{formatDuration(m.duration_seconds)}</p>
                          </div>
                        )}
                        {m.repetitions && (
                          <div className="bg-zinc-800/50 rounded-lg p-2">
                            <p className="text-[10px] text-zinc-500">Tekrar</p>
                            <p className="text-xs font-medium text-white">{m.repetitions} tekrar</p>
                          </div>
                        )}
                        <div className="bg-zinc-800/50 rounded-lg p-2">
                          <p className="text-[10px] text-zinc-500">Durum</p>
                          <p className={`text-xs font-medium ${m.tamamlandi ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {m.tamamlandi ? 'Tamamlandı' : 'Devam Ediyor'}
                          </p>
                        </div>
                        {m.tekrar_sayisi > 0 && (
                          <div className="bg-zinc-800/50 rounded-lg p-2">
                            <p className="text-[10px] text-zinc-500">Yapılan Tekrar</p>
                            <p className="text-xs font-medium text-white">{m.tekrar_sayisi}</p>
                          </div>
                        )}
                      </div>

                      {m.video_url && (
                        <a
                          href={m.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <Play className="h-4 w-4" />
                          Videoyu İzle
                        </a>
                      )}

                      {m.antrenor_notu && (
                        <div className="bg-cyan-400/5 border border-cyan-400/10 rounded-lg p-3">
                          <p className="text-[10px] text-cyan-400 font-medium mb-0.5">Antrenör Notu</p>
                          <p className="text-xs text-zinc-300">{m.antrenor_notu}</p>
                        </div>
                      )}

                      {m.tamamlanma_tarihi && (
                        <p className="text-[10px] text-zinc-500">
                          Tamamlanma: {new Date(m.tamamlanma_tarihi).toLocaleDateString('tr-TR')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, TrendingUp } from 'lucide-react'
import { BranchMeasurementChart, type BranchParam, type BranchAverage, type MeasurementDataPoint } from '@/components/charts/BranchMeasurementChart'

type Child = { id: string; name: string; surname?: string; branch?: string }

interface MeasurementItem {
  id: string
  olcum_tarihi: string
  values: Record<string, number | null>
  genel_degerlendirme: string | null
}

export default function VeliOlcumlerPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selected, setSelected] = useState('')
  const [items, setItems] = useState<MeasurementItem[]>([])
  const [params, setParams] = useState<BranchParam[]>([])
  const [averages, setAverages] = useState<BranchAverage[]>([])
  const [branch, setBranch] = useState('')
  const [loading, setLoading] = useState(true)

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

  const fetchMeasurements = useCallback(async () => {
    if (!selected) {
      setItems([])
      setParams([])
      setAverages([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/veli/measurements?athlete_id=${selected}`)
      const data = await res.json()
      setItems(data.items ?? [])
      setParams(data.params ?? [])
      setAverages(data.averages ?? [])
      setBranch(data.branch ?? '')
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [selected])

  useEffect(() => {
    fetchMeasurements()
  }, [fetchMeasurements])

  const chartData: MeasurementDataPoint[] = items.map((i) => ({
    olcum_tarihi: i.olcum_tarihi,
    values: i.values,
  }))

  return (
    <main className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/veli/dashboard" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
          Branş Ölçümleri
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
      ) : items.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <TrendingUp className="h-12 w-12 text-zinc-600 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-zinc-400">Henüz ölçüm kaydı yok.</p>
          <p className="text-xs text-zinc-500 mt-1">
            Antrenörünüz ölçüm girdikten sonra grafikler burada görünecek.
          </p>
        </div>
      ) : (
        <>
          {/* Branş bazlı grafik */}
          {params.length > 0 && (
            <BranchMeasurementChart
              data={chartData}
              params={params}
              averages={averages}
              branch={branch}
            />
          )}

          {/* Son ölçüm detayları */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Son Ölçüm Değerleri</h3>
            {items[0] && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 mb-2">
                  Tarih: {new Date(items[0].olcum_tarihi).toLocaleDateString('tr-TR')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {params.map((p) => {
                    const val = items[0].values[p.param_key]
                    const avg = averages.find((a) => a.param_key === p.param_key)
                    return (
                      <div key={p.param_key} className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-[10px] text-zinc-500">{p.param_label}</p>
                        <p className="text-sm font-semibold text-white">
                          {val != null ? `${val} ${p.unit}` : '—'}
                        </p>
                        {avg && val != null && (
                          <p className={`text-[10px] mt-0.5 ${
                            val >= avg.avg_value ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            Ort: {avg.avg_value} {p.unit}
                          </p>
                        )}
                      </div>
                    )
                  })}
                  {/* Temel ölçümler her zaman göster */}
                  {items[0].values.boy != null && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-[10px] text-zinc-500">Boy</p>
                      <p className="text-sm font-semibold text-white">{items[0].values.boy} cm</p>
                    </div>
                  )}
                  {items[0].values.kilo != null && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-[10px] text-zinc-500">Kilo</p>
                      <p className="text-sm font-semibold text-white">{items[0].values.kilo} kg</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Antrenör notu */}
          {items.some((i) => i.genel_degerlendirme) && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Antrenör Notu</h3>
              <p className="text-sm text-zinc-300">
                {items.find((i) => i.genel_degerlendirme)?.genel_degerlendirme}
              </p>
            </div>
          )}

          {/* Ölçüm geçmişi */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Ölçüm Geçmişi</h3>
            <div className="space-y-3">
              {items.slice(0, 10).map((item) => (
                <div key={item.id} className="border-b border-zinc-800 pb-2 last:border-0">
                  <p className="text-xs text-zinc-500 mb-1">
                    {new Date(item.olcum_tarihi).toLocaleDateString('tr-TR')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {params.map((p) => {
                      const val = item.values[p.param_key]
                      if (val == null) return null
                      return (
                        <span key={p.param_key} className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                          {p.param_label}: {val} {p.unit}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  )
}

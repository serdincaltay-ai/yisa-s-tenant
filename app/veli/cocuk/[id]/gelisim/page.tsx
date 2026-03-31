'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { PanelHeader } from '@/components/PanelHeader'
import { VeliBottomNav } from '@/components/PanelBottomNav'
import { GelisimChart, type GelisimDataPoint, type ReferansAraligi } from '@/components/charts/GelisimChart'
import { RadarChart900, type RadarDataPoint } from '@/components/charts/RadarChart'
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  Ruler,
  Weight,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

/* ─── Types ─── */

interface OlcumItem {
  id: string
  olcum_tarihi: string
  boy?: number | null
  kilo?: number | null
  esneklik?: number | null
  dikey_sicrama?: number | null
  koordinasyon?: number | null
  kuvvet?: number | null
  dayaniklilik?: number | null
  denge?: number | null
  genel_degerlendirme?: string | null
  oturma_yuksekligi?: number | null
  olcum_verileri?: Record<string, unknown>
}

interface PhvItem {
  id: string
  olcum_tarihi: string
  boy_cm: number | null
  kilo_kg: number | null
  oturma_boyu_cm: number | null
  phv_tahmini_yas: number | null
  buyume_hizi_cm_yil: number | null
  olgunluk_ofseti: number | null
  sakatlik_riski: string | null
  antrenman_onerileri: string | null
}

interface EvaluationItem {
  kategori_adi: string
  puan: number
}

interface ChildInfo {
  id: string
  name: string
  surname?: string | null
  birth_date?: string | null
  branch?: string | null
  gender?: string | null
}

/* ─── Helpers ─── */

function ageFromBirth(d: string | null | undefined): number | null {
  if (!d) return null
  return Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function riskBadge(risk: string | null) {
  if (!risk) return null
  const colors: Record<string, string> = {
    dusuk: 'bg-emerald-500/20 text-emerald-400',
    orta: 'bg-amber-500/20 text-amber-400',
    yuksek: 'bg-red-500/20 text-red-400',
  }
  const labels: Record<string, string> = {
    dusuk: 'Dusuk Risk',
    orta: 'Orta Risk',
    yuksek: 'Yuksek Risk',
  }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors[risk] ?? 'bg-zinc-700 text-zinc-300'}`}>
      {labels[risk] ?? risk}
    </span>
  )
}

/* ─── Component ─── */

export default function VeliCocukGelisimPage() {
  const params = useParams()
  const id = params?.id as string | undefined

  const [child, setChild] = useState<ChildInfo | null>(null)
  const [olcumler, setOlcumler] = useState<OlcumItem[]>([])
  const [phvData, setPhvData] = useState<PhvItem[]>([])
  const [radarData, setRadarData] = useState<RadarDataPoint[]>([])
  const [referanslar, setReferanslar] = useState<ReferansAraligi[]>([])
  const [loading, setLoading] = useState(true)
  const [phvExpanded, setPhvExpanded] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!id) return

    try {
      const [childrenRes, gelisimRes, phvRes, evalRes, refRes] = await Promise.allSettled([
        fetch('/api/veli/children'),
        fetch(`/api/veli/gelisim?athlete_id=${id}`),
        fetch(`/api/veli/gelisim/phv?athlete_id=${id}`),
        fetch(`/api/veli/gelisim/evaluation?athlete_id=${id}`),
        fetch(`/api/veli/gelisim/referans?athlete_id=${id}`),
      ])

      // Children
      if (childrenRes.status === 'fulfilled') {
        const cData = await childrenRes.value.json()
        const ch = (cData.items ?? []).find((c: { id: string }) => c.id === id)
        setChild(ch ?? null)
      }

      // Olcumler (measurements)
      if (gelisimRes.status === 'fulfilled') {
        const gData = await gelisimRes.value.json()
        setOlcumler(gData.items ?? [])
      }

      // PHV data
      if (phvRes.status === 'fulfilled' && phvRes.value.ok) {
        const pData = await phvRes.value.json()
        setPhvData(pData.items ?? [])
      }

      // 900-area evaluation
      if (evalRes.status === 'fulfilled' && evalRes.value.ok) {
        const eData = await evalRes.value.json()
        const items: EvaluationItem[] = eData.items ?? []
        // Aggregate by kategori_adi
        const grouped = new Map<string, number[]>()
        for (const item of items) {
          const existing = grouped.get(item.kategori_adi) ?? []
          existing.push(item.puan)
          grouped.set(item.kategori_adi, existing)
        }
        const radar: RadarDataPoint[] = []
        grouped.forEach((puanlar, kategori) => {
          const avg = puanlar.reduce((a, b) => a + b, 0) / puanlar.length
          radar.push({ kategori, puan: Math.round(avg * 10) / 10, maxPuan: 10 })
        })
        setRadarData(radar)
      }

      // Reference values
      if (refRes.status === 'fulfilled' && refRes.value.ok) {
        const rData = await refRes.value.json()
        setReferanslar(rData.items ?? [])
      }
    } catch (err) {
      console.error('[gelisim page]', err)
    }
  }, [id])

  useEffect(() => {
    setLoading(true)
    fetchAll().finally(() => setLoading(false))
  }, [fetchAll])

  /* ─── Chart data transform ─── */
  const chartData: GelisimDataPoint[] = olcumler.map((o) => ({
    tarih: o.olcum_tarihi,
    boy: o.boy ?? null,
    kilo: o.kilo ?? null,
    esneklik: o.esneklik ?? null,
  }))

  const latestPhv = phvData.length > 0 ? phvData[0] : null

  /* ─── PHV chart data ─── */
  const phvChartData = phvData
    .slice()
    .sort((a, b) => new Date(a.olcum_tarihi).getTime() - new Date(b.olcum_tarihi).getTime())
    .map((p) => ({
      tarih: new Date(p.olcum_tarihi).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
      boy: p.boy_cm,
      buyumeHizi: p.buyume_hizi_cm_yil,
      olgunlukOfseti: p.olgunluk_ofseti,
    }))

  /* ─── Performance metrics for quick view ─── */
  const latestOlcum = olcumler.length > 0 ? olcumler[0] : null
  const previousOlcum = olcumler.length > 1 ? olcumler[1] : null

  function delta(current: number | null | undefined, previous: number | null | undefined): string | null {
    if (current == null || previous == null) return null
    const d = current - previous
    if (d === 0) return '0'
    return d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1)
  }

  /* ─── Render ─── */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <PanelHeader panelName="VELI PANELI" />

      <main className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href={`/veli/cocuk/${id}`}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            {child && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 font-semibold text-sm">
                {(child.name?.[0] ?? '?') + (child.surname?.[0] ?? '')}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cyan-400" strokeWidth={1.5} />
                Gelisim Grafikleri
              </h1>
              {child && (
                <p className="text-xs text-zinc-400">
                  {child.name} {child.surname ?? ''} · {ageFromBirth(child.birth_date) ?? '—'} yas · {child.branch ?? '—'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {latestOlcum && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
              <Ruler className="h-4 w-4 text-cyan-400 mx-auto mb-1" strokeWidth={1.5} />
              <p className="text-lg font-bold text-white">{latestOlcum.boy ?? '—'}</p>
              <p className="text-[10px] text-zinc-500">Boy (cm)</p>
              {previousOlcum && delta(latestOlcum.boy, previousOlcum.boy) && (
                <p className={`text-[10px] mt-0.5 ${Number(delta(latestOlcum.boy, previousOlcum.boy)) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {delta(latestOlcum.boy, previousOlcum.boy)} cm
                </p>
              )}
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
              <Weight className="h-4 w-4 text-violet-400 mx-auto mb-1" strokeWidth={1.5} />
              <p className="text-lg font-bold text-white">{latestOlcum.kilo ?? '—'}</p>
              <p className="text-[10px] text-zinc-500">Kilo (kg)</p>
              {previousOlcum && delta(latestOlcum.kilo, previousOlcum.kilo) && (
                <p className={`text-[10px] mt-0.5 ${Number(delta(latestOlcum.kilo, previousOlcum.kilo)) >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {delta(latestOlcum.kilo, previousOlcum.kilo)} kg
                </p>
              )}
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
              <Activity className="h-4 w-4 text-emerald-400 mx-auto mb-1" strokeWidth={1.5} />
              <p className="text-lg font-bold text-white">{latestOlcum.esneklik ?? '—'}</p>
              <p className="text-[10px] text-zinc-500">Esneklik (cm)</p>
              {previousOlcum && delta(latestOlcum.esneklik, previousOlcum.esneklik) && (
                <p className={`text-[10px] mt-0.5 ${Number(delta(latestOlcum.esneklik, previousOlcum.esneklik)) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {delta(latestOlcum.esneklik, previousOlcum.esneklik)} cm
                </p>
              )}
            </div>
          </div>
        )}

        {olcumler.length === 0 && phvData.length === 0 && radarData.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <TrendingUp className="h-12 w-12 text-zinc-600 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-zinc-400">Henuz olcum kaydi yok.</p>
            <p className="text-xs text-zinc-500 mt-1">
              Antrenorunuz olcum girdikten sonra grafikler burada gorunecek.
            </p>
          </div>
        ) : (
          <>
            {/* Boy/Kilo Time Series Charts */}
            <GelisimChart
              data={chartData}
              referanslar={referanslar}
              metric="boy"
              title="Boy Gelisimi"
              unit="cm"
              color="#22d3ee"
            />

            <GelisimChart
              data={chartData}
              referanslar={referanslar}
              metric="kilo"
              title="Kilo Takibi"
              unit="kg"
              color="#a78bfa"
            />

            <GelisimChart
              data={chartData}
              referanslar={referanslar}
              metric="esneklik"
              title="Esneklik Gelisimi"
              unit="cm"
              color="#34d399"
            />

            {/* 900-Area Radar Chart */}
            <RadarChart900
              data={radarData}
              title="900 Alan Degerlendirme"
            />

            {/* PHV Tracking Section */}
            {(latestPhv || phvData.length > 0) && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <button
                  onClick={() => setPhvExpanded(!phvExpanded)}
                  className="w-full flex items-center justify-between"
                >
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-400" strokeWidth={1.5} />
                    PHV Takibi (Buyume Hizi)
                  </h3>
                  {phvExpanded ? (
                    <ChevronUp className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  )}
                </button>

                {latestPhv && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-zinc-800/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-zinc-500">Tahmini PHV Yasi</p>
                      <p className="text-sm font-semibold text-white">
                        {latestPhv.phv_tahmini_yas?.toFixed(1) ?? '—'} yas
                      </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-zinc-500">Buyume Hizi</p>
                      <p className="text-sm font-semibold text-white">
                        {latestPhv.buyume_hizi_cm_yil?.toFixed(1) ?? '—'} cm/yil
                      </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-zinc-500">Olgunluk Ofseti</p>
                      <p className="text-sm font-semibold text-white">
                        {latestPhv.olgunluk_ofseti?.toFixed(1) ?? '—'}
                      </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-zinc-500">Sakatlik Riski</p>
                      {riskBadge(latestPhv.sakatlik_riski)}
                    </div>
                  </div>
                )}

                {latestPhv?.antrenman_onerileri && (
                  <div className="mt-3 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" strokeWidth={1.5} />
                      <div>
                        <p className="text-xs font-medium text-amber-400 mb-0.5">Antrenman Onerileri</p>
                        <p className="text-xs text-zinc-300">{latestPhv.antrenman_onerileri}</p>
                      </div>
                    </div>
                  </div>
                )}

                {phvExpanded && phvChartData.length > 1 && (
                  <div className="mt-4 space-y-3">
                    <h4 className="text-xs font-medium text-zinc-400">PHV Olcum Gecmisi</h4>
                    <div className="space-y-2">
                      {phvData.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-sm border-b border-zinc-800 pb-2 last:border-0"
                        >
                          <span className="text-zinc-400">
                            {new Date(p.olcum_tarihi).toLocaleDateString('tr-TR')}
                          </span>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-white">
                              {p.boy_cm} cm / {p.kilo_kg} kg
                            </span>
                            {p.buyume_hizi_cm_yil != null && (
                              <span className="text-amber-400">
                                {p.buyume_hizi_cm_yil.toFixed(1)} cm/yil
                              </span>
                            )}
                            {riskBadge(p.sakatlik_riski)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Measurement History Table */}
            {olcumler.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Olcum Gecmisi</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Tarih</th>
                        <th className="text-right text-zinc-500 font-medium pb-2 px-2">Boy</th>
                        <th className="text-right text-zinc-500 font-medium pb-2 px-2">Kilo</th>
                        <th className="text-right text-zinc-500 font-medium pb-2 px-2">Esneklik</th>
                        <th className="text-right text-zinc-500 font-medium pb-2 pl-2">Not</th>
                      </tr>
                    </thead>
                    <tbody>
                      {olcumler.slice(0, 10).map((o) => (
                        <tr key={o.id} className="border-b border-zinc-800/50 last:border-0">
                          <td className="text-zinc-400 py-2 pr-3 whitespace-nowrap">
                            {new Date(o.olcum_tarihi).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="text-right text-white py-2 px-2">
                            {o.boy != null ? `${o.boy} cm` : '—'}
                          </td>
                          <td className="text-right text-white py-2 px-2">
                            {o.kilo != null ? `${o.kilo} kg` : '—'}
                          </td>
                          <td className="text-right text-white py-2 px-2">
                            {o.esneklik != null ? `${o.esneklik} cm` : '—'}
                          </td>
                          <td className="text-right text-zinc-400 py-2 pl-2 max-w-[120px] truncate">
                            {o.genel_degerlendirme ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <VeliBottomNav />
    </div>
  )
}

'use client'

import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts'
import { TrendingUp } from 'lucide-react'

/* ─── Yaş-cinsiyet bazlı standart referans verileri (WHO / Türkiye ortalaması) ─── */
interface StandartVeri {
  yas: number
  boy_min: number
  boy_max: number
  kilo_min: number
  kilo_max: number
}

const STANDART_ERKEK: StandartVeri[] = [
  { yas: 3, boy_min: 89, boy_max: 102, kilo_min: 12, kilo_max: 17 },
  { yas: 4, boy_min: 95, boy_max: 110, kilo_min: 13, kilo_max: 19 },
  { yas: 5, boy_min: 100, boy_max: 116, kilo_min: 15, kilo_max: 22 },
  { yas: 6, boy_min: 106, boy_max: 122, kilo_min: 17, kilo_max: 25 },
  { yas: 7, boy_min: 112, boy_max: 128, kilo_min: 19, kilo_max: 28 },
  { yas: 8, boy_min: 117, boy_max: 134, kilo_min: 21, kilo_max: 32 },
  { yas: 9, boy_min: 122, boy_max: 139, kilo_min: 23, kilo_max: 36 },
  { yas: 10, boy_min: 127, boy_max: 145, kilo_min: 25, kilo_max: 40 },
  { yas: 11, boy_min: 131, boy_max: 151, kilo_min: 27, kilo_max: 45 },
  { yas: 12, boy_min: 136, boy_max: 159, kilo_min: 30, kilo_max: 50 },
  { yas: 13, boy_min: 142, boy_max: 167, kilo_min: 34, kilo_max: 56 },
  { yas: 14, boy_min: 149, boy_max: 174, kilo_min: 38, kilo_max: 62 },
  { yas: 15, boy_min: 155, boy_max: 179, kilo_min: 43, kilo_max: 68 },
  { yas: 16, boy_min: 159, boy_max: 182, kilo_min: 47, kilo_max: 72 },
  { yas: 17, boy_min: 162, boy_max: 184, kilo_min: 50, kilo_max: 75 },
  { yas: 18, boy_min: 163, boy_max: 185, kilo_min: 52, kilo_max: 78 },
]

const STANDART_KIZ: StandartVeri[] = [
  { yas: 3, boy_min: 88, boy_max: 101, kilo_min: 11, kilo_max: 16 },
  { yas: 4, boy_min: 94, boy_max: 109, kilo_min: 13, kilo_max: 19 },
  { yas: 5, boy_min: 99, boy_max: 115, kilo_min: 14, kilo_max: 21 },
  { yas: 6, boy_min: 105, boy_max: 121, kilo_min: 16, kilo_max: 24 },
  { yas: 7, boy_min: 110, boy_max: 127, kilo_min: 18, kilo_max: 27 },
  { yas: 8, boy_min: 116, boy_max: 133, kilo_min: 20, kilo_max: 31 },
  { yas: 9, boy_min: 121, boy_max: 139, kilo_min: 22, kilo_max: 35 },
  { yas: 10, boy_min: 126, boy_max: 146, kilo_min: 24, kilo_max: 40 },
  { yas: 11, boy_min: 131, boy_max: 153, kilo_min: 27, kilo_max: 45 },
  { yas: 12, boy_min: 137, boy_max: 159, kilo_min: 30, kilo_max: 50 },
  { yas: 13, boy_min: 142, boy_max: 163, kilo_min: 34, kilo_max: 55 },
  { yas: 14, boy_min: 146, boy_max: 166, kilo_min: 38, kilo_max: 58 },
  { yas: 15, boy_min: 148, boy_max: 168, kilo_min: 40, kilo_max: 60 },
  { yas: 16, boy_min: 149, boy_max: 169, kilo_min: 42, kilo_max: 62 },
  { yas: 17, boy_min: 150, boy_max: 170, kilo_min: 43, kilo_max: 63 },
  { yas: 18, boy_min: 150, boy_max: 170, kilo_min: 44, kilo_max: 64 },
]

/* ─── Tooltip ─── */
interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  unit: string
}

function ChartTooltip({ active, payload, label, unit }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg">
      <p className="text-xs text-zinc-400 mb-1">{label} yaş</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value} {unit}
        </p>
      ))}
    </div>
  )
}

/* ─── Props ─── */
export interface GelisimGrafigiProps {
  /** Çocuğun yaşı */
  yas: number
  /** Cinsiyet: E veya K */
  cinsiyet: 'E' | 'K'
  /** Ölçüm verileri (opsiyonel — varsa çocuğun noktası gösterilir) */
  olcumler?: { yas: number; boy?: number; kilo?: number }[]
  /** Gösterilecek metrik */
  metric?: 'boy' | 'kilo'
}

/**
 * GelisimGrafigi — Çocuğun yaşına göre standart gelişim grafiği.
 * WHO / Türkiye ortalaması referans aralığı + çocuğun ölçümleri.
 */
export default function GelisimGrafigi({
  yas,
  cinsiyet,
  olcumler = [],
  metric = 'boy',
}: GelisimGrafigiProps) {
  const standartData = cinsiyet === 'E' ? STANDART_ERKEK : STANDART_KIZ

  const chartData = useMemo(() => {
    const minYas = Math.max(3, yas - 3)
    const maxYas = Math.min(18, yas + 3)

    return standartData
      .filter((s) => s.yas >= minYas && s.yas <= maxYas)
      .map((s) => {
        const cocukOlcum = olcumler.find((o) => o.yas === s.yas)
        return {
          yas: s.yas,
          min: metric === 'boy' ? s.boy_min : s.kilo_min,
          max: metric === 'boy' ? s.boy_max : s.kilo_max,
          ortalama: metric === 'boy'
            ? Math.round((s.boy_min + s.boy_max) / 2)
            : Math.round((s.kilo_min + s.kilo_max) / 2),
          cocuk: cocukOlcum ? cocukOlcum[metric] ?? null : null,
        }
      })
  }, [yas, cinsiyet, olcumler, metric, standartData])

  const unit = metric === 'boy' ? 'cm' : 'kg'
  const title = metric === 'boy' ? 'Boy Gelişim Grafiği' : 'Kilo Gelişim Grafiği'
  const color = metric === 'boy' ? '#22d3ee' : '#a78bfa'

  const allValues = chartData.flatMap((d) => [d.min, d.max, ...(d.cocuk != null ? [d.cocuk] : [])])
  const yMin = Math.floor(Math.min(...allValues) * 0.95)
  const yMax = Math.ceil(Math.max(...allValues) * 1.05)

  return (
    <div className="w-full max-w-lg mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-xs text-zinc-500 ml-auto">
          {cinsiyet === 'E' ? 'Erkek' : 'Kız'} — {yas} yaş
        </span>
      </div>

      <p className="text-xs text-zinc-500">
        Ölçüm sonrası burada gelişimini takip edebilirsiniz.
      </p>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis
              dataKey="yas"
              tick={{ fill: '#a1a1aa', fontSize: 11 }}
              axisLine={{ stroke: '#52525b' }}
              tickLine={false}
              label={{ value: 'Yaş', position: 'insideBottomRight', fill: '#71717a', fontSize: 10, offset: -5 }}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: '#a1a1aa', fontSize: 11 }}
              axisLine={{ stroke: '#52525b' }}
              tickLine={false}
              width={40}
              label={{ value: unit, position: 'insideTopLeft', fill: '#71717a', fontSize: 10, offset: 0 }}
            />
            <Tooltip content={<ChartTooltip unit={unit} />} />

            {/* Normal aralık gölgesi */}
            <ReferenceArea
              y1={chartData[0]?.min}
              y2={chartData[0]?.max}
              fill={color}
              fillOpacity={0.06}
              label={{ value: 'Normal aralık', fill: '#52525b', fontSize: 10, position: 'insideTopRight' }}
            />

            {/* Ortalama çizgisi */}
            <Line
              type="monotone"
              dataKey="ortalama"
              name="Ortalama"
              stroke="#71717a"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />

            {/* Min–max çizgileri */}
            <Line
              type="monotone"
              dataKey="min"
              name="Min"
              stroke="#52525b"
              strokeWidth={1}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="max"
              name="Max"
              stroke="#52525b"
              strokeWidth={1}
              dot={false}
            />

            {/* Çocuğun ölçümleri */}
            <Line
              type="monotone"
              dataKey="cocuk"
              name="Çocuk"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 5, strokeWidth: 0 }}
              activeDot={{ fill: color, r: 7, strokeWidth: 2, stroke: '#18181b' }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-zinc-600 text-center">
        * Referans: WHO / Türkiye çocuk gelişim standartları
      </p>
    </div>
  )
}

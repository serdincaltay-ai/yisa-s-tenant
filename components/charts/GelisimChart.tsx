'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts'

export interface GelisimDataPoint {
  tarih: string
  boy?: number | null
  kilo?: number | null
  esneklik?: number | null
}

export interface ReferansAraligi {
  parametre: string
  deger_min: number
  deger_max: number
  seviye: string
}

interface GelisimChartProps {
  data: GelisimDataPoint[]
  referanslar?: ReferansAraligi[]
  metric: 'boy' | 'kilo' | 'esneklik'
  title: string
  unit: string
  color?: string
}

const METRIC_COLORS: Record<string, string> = {
  boy: '#22d3ee',
  kilo: '#a78bfa',
  esneklik: '#34d399',
}

function formatTarih(tarih: string): string {
  if (!tarih) return ''
  const d = new Date(tarih)
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
  unit: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  unit: string
}

function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value} {unit}
        </p>
      ))}
    </div>
  )
}

export function GelisimChart({ data, referanslar, metric, title, unit, color }: GelisimChartProps) {
  const chartColor = color ?? METRIC_COLORS[metric] ?? '#22d3ee'

  const chartData = [...data]
    .filter((d) => d[metric] != null)
    .sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime())
    .map((d) => ({
      tarih: formatTarih(d.tarih),
      tarihFull: d.tarih,
      [metric]: d[metric],
    }))

  if (chartData.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-500">Bu parametre icin veri yok.</p>
      </div>
    )
  }

  const normalRef = referanslar?.find((r) => r.parametre === metric && r.seviye === 'normal')
  const iyiRef = referanslar?.find((r) => r.parametre === metric && r.seviye === 'iyi')

  const allValues = chartData.map((d) => Number(d[metric]))
  const refValues = [
    ...(normalRef ? [normalRef.deger_min, normalRef.deger_max] : []),
    ...(iyiRef ? [iyiRef.deger_min, iyiRef.deger_max] : []),
  ]
  const allNums = [...allValues, ...refValues]
  const yMin = Math.floor(Math.min(...allNums) * 0.95)
  const yMax = Math.ceil(Math.max(...allNums) * 1.05)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      {normalRef && (
        <p className="text-xs text-zinc-500 mb-3">
          Referans: {normalRef.deger_min}–{normalRef.deger_max} {unit} (normal)
          {iyiRef && ` / ${iyiRef.deger_min}–${iyiRef.deger_max} ${unit} (iyi)`}
        </p>
      )}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis
              dataKey="tarih"
              tick={{ fill: '#a1a1aa', fontSize: 11 }}
              axisLine={{ stroke: '#52525b' }}
              tickLine={false}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: '#a1a1aa', fontSize: 11 }}
              axisLine={{ stroke: '#52525b' }}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }}
              iconType="circle"
              iconSize={8}
            />

            {normalRef && (
              <ReferenceArea
                y1={normalRef.deger_min}
                y2={normalRef.deger_max}
                fill="#22d3ee"
                fillOpacity={0.06}
                label={{ value: 'Normal', fill: '#52525b', fontSize: 10, position: 'insideTopRight' }}
              />
            )}
            {iyiRef && (
              <ReferenceArea
                y1={iyiRef.deger_min}
                y2={iyiRef.deger_max}
                fill="#34d399"
                fillOpacity={0.06}
                label={{ value: 'Iyi', fill: '#52525b', fontSize: 10, position: 'insideTopRight' }}
              />
            )}

            {normalRef && (
              <>
                <ReferenceLine y={normalRef.deger_min} stroke="#3f3f46" strokeDasharray="3 3" />
                <ReferenceLine y={normalRef.deger_max} stroke="#3f3f46" strokeDasharray="3 3" />
              </>
            )}

            <Line
              type="monotone"
              dataKey={metric}
              name={title}
              stroke={chartColor}
              strokeWidth={2}
              dot={{ fill: chartColor, r: 4, strokeWidth: 0 }}
              activeDot={{ fill: chartColor, r: 6, strokeWidth: 2, stroke: '#18181b' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

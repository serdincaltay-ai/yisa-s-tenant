'use client'

import React from 'react'
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export interface RadarDataPoint {
  kategori: string
  puan: number
  maxPuan?: number
}

interface RadarChartProps {
  data: RadarDataPoint[]
  title?: string
}

interface TooltipPayloadItem {
  name: string
  value: number
  payload: RadarDataPoint
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
}

function CustomRadarTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg">
      <p className="text-xs text-zinc-400">{item.payload.kategori}</p>
      <p className="text-sm font-medium text-cyan-400">
        {item.value} / {item.payload.maxPuan ?? 10}
      </p>
    </div>
  )
}

export function RadarChart900({ data, title }: RadarChartProps) {
  if (!data.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-2">{title ?? '900 Alan Radar'}</h3>
        <p className="text-sm text-zinc-500">Henuz degerlendirme verisi yok.</p>
      </div>
    )
  }

  const maxVal = Math.max(...data.map((d) => d.maxPuan ?? 10))

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-white mb-1">{title ?? '900 Alan Radar'}</h3>
      <p className="text-xs text-zinc-500 mb-3">
        Cok boyutlu degerlendirme ({data.length} kategori)
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="#3f3f46" />
            <PolarAngleAxis
              dataKey="kategori"
              tick={{ fill: '#a1a1aa', fontSize: 10 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              domain={[0, maxVal]}
              tick={{ fill: '#52525b', fontSize: 9 }}
              axisLine={false}
              tickCount={5}
            />
            <Tooltip content={<CustomRadarTooltip />} />
            <Radar
              name="Puan"
              dataKey="puan"
              stroke="#22d3ee"
              fill="#22d3ee"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={{ fill: '#22d3ee', r: 3, strokeWidth: 0 }}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-400/40" />
          Sporcu Puani
        </span>
      </div>
    </div>
  )
}

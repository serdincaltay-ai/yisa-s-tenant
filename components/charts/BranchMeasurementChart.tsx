'use client'

import React, { useState } from 'react'
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
  BarChart,
  Bar,
} from 'recharts'

export interface BranchParam {
  param_key: string
  param_label: string
  unit: string
}

export interface BranchAverage {
  param_key: string
  avg_value: number
  min_value: number
  max_value: number
}

export interface MeasurementDataPoint {
  olcum_tarihi: string
  values: Record<string, number | null>
}

interface BranchMeasurementChartProps {
  data: MeasurementDataPoint[]
  params: BranchParam[]
  averages: BranchAverage[]
  branch: string
}

const COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#f472b6', '#818cf8']

function formatTarih(tarih: string): string {
  if (!tarih) return ''
  const d = new Date(tarih)
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  params: BranchParam[]
}

function CustomTooltip({ active, payload, label, params }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {payload.map((entry, i) => {
        const param = params.find((p) => p.param_key === entry.name)
        return (
          <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
            {param?.param_label ?? entry.name}: {entry.value} {param?.unit ?? ''}
          </p>
        )
      })}
    </div>
  )
}

export function BranchMeasurementChart({ data, params, averages, branch }: BranchMeasurementChartProps) {
  const [selectedParam, setSelectedParam] = useState<string | null>(null)
  const [showComparison, setShowComparison] = useState(false)

  if (params.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-2">{branch} Ölçümleri</h3>
        <p className="text-sm text-zinc-500">Bu branş için tanımlı parametre bulunamadı.</p>
      </div>
    )
  }

  const chartData = [...data]
    .sort((a, b) => new Date(a.olcum_tarihi).getTime() - new Date(b.olcum_tarihi).getTime())
    .map((d) => {
      const point: Record<string, unknown> = { tarih: formatTarih(d.olcum_tarihi) }
      for (const p of params) {
        point[p.param_key] = d.values[p.param_key] ?? null
      }
      return point
    })

  if (chartData.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-2">{branch} Ölçümleri</h3>
        <p className="text-sm text-zinc-500">Henüz ölçüm verisi yok.</p>
      </div>
    )
  }

  const activeParams = selectedParam
    ? params.filter((p) => p.param_key === selectedParam)
    : params

  // Yaşıt karşılaştırma grafiği
  const comparisonData = params.map((p) => {
    const avg = averages.find((a) => a.param_key === p.param_key)
    const lastPoint = data[0]
    const currentVal = lastPoint?.values[p.param_key]
    return {
      param: p.param_label,
      sporcu: currentVal ?? 0,
      ortalama: avg?.avg_value ?? 0,
      min: avg?.min_value ?? 0,
      max: avg?.max_value ?? 0,
    }
  }).filter((d) => d.sporcu > 0 || d.ortalama > 0)

  return (
    <div className="space-y-4">
      {/* Gelişim Çizgisi */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">{branch} — Gelişim Grafiği</h3>
          {averages.length > 0 && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                showComparison
                  ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
              }`}
            >
              Yaşıt Karşılaştır
            </button>
          )}
        </div>

        {/* Parametre seçici */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
          <button
            onClick={() => setSelectedParam(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
              !selectedParam
                ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
            }`}
          >
            Tümü
          </button>
          {params.map((p, i) => (
            <button
              key={p.param_key}
              onClick={() => setSelectedParam(selectedParam === p.param_key ? null : p.param_key)}
              className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                selectedParam === p.param_key
                  ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
              }`}
              style={selectedParam === p.param_key ? { borderColor: COLORS[i % COLORS.length] + '50', color: COLORS[i % COLORS.length] } : {}}
            >
              {p.param_label}
            </button>
          ))}
        </div>

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
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                axisLine={{ stroke: '#52525b' }}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip params={params} />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} iconType="circle" iconSize={8} />

              {activeParams.map((p, i) => {
                const avg = averages.find((a) => a.param_key === p.param_key)
                const colorIdx = params.findIndex((pp) => pp.param_key === p.param_key)
                const lineColor = COLORS[colorIdx % COLORS.length]
                return (
                  <React.Fragment key={p.param_key}>
                    {avg && (
                      <ReferenceArea
                        y1={avg.min_value}
                        y2={avg.max_value}
                        fill={lineColor}
                        fillOpacity={0.05}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey={p.param_key}
                      name={p.param_label}
                      stroke={lineColor}
                      strokeWidth={2}
                      dot={{ fill: lineColor, r: 3, strokeWidth: 0 }}
                      activeDot={{ fill: lineColor, r: 5, strokeWidth: 2, stroke: '#18181b' }}
                      connectNulls
                    />
                  </React.Fragment>
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Yaşıt Karşılaştırma */}
      {showComparison && comparisonData.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Yaşıt Karşılaştırma</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis
                  dataKey="param"
                  tick={{ fill: '#a1a1aa', fontSize: 10 }}
                  axisLine={{ stroke: '#52525b' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  axisLine={{ stroke: '#52525b' }}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  labelStyle={{ color: '#a1a1aa', fontSize: 11 }}
                  itemStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                <Bar dataKey="sporcu" name="Sporcu" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ortalama" name="Yaş Ort." fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">
            Son ölçüm değerleri ile aynı yaş grubundaki ortalama değerler karşılaştırılmaktadır.
          </p>
        </div>
      )}
    </div>
  )
}

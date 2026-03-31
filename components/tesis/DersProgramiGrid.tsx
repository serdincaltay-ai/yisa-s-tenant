'use client'

import React from 'react'

type ScheduleCell = {
  brans: string
  label?: string
}

const DAYS = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ']
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']

// Default schedule data from spec
const DEFAULT_SCHEDULE: Record<string, Record<string, ScheduleCell>> = {
  '08:00': { SAL: { brans: 'cimnastik', label: 'Cimnastik' }, PER: { brans: 'cimnastik', label: 'Cimnastik' }, CMT: { brans: 'yuzme', label: 'Yüzme' } },
  '09:00': { PZT: { brans: 'yuzme', label: 'Yüzme' }, ÇAR: { brans: 'yuzme', label: 'Yüzme' }, CUM: { brans: 'yuzme', label: 'Yüzme' }, CMT: { brans: 'cimnastik', label: 'Cimnastik' } },
  '10:00': { PZT: { brans: 'cimnastik', label: 'Cimnastik' }, SAL: { brans: 'yuzme', label: 'Yüzme' }, ÇAR: { brans: 'cimnastik', label: 'Cimnastik' }, PER: { brans: 'yuzme', label: 'Yüzme' }, CUM: { brans: 'cimnastik', label: 'Cimnastik' }, CMT: { brans: 'atletizm', label: 'Atletizm' } },
  '11:00': { SAL: { brans: 'atletizm', label: 'Atletizm' }, PER: { brans: 'atletizm', label: 'Atletizm' } },
  '13:00': { PZT: { brans: 'cimnastik', label: 'Cimnastik' }, ÇAR: { brans: 'cimnastik', label: 'Cimnastik' }, CUM: { brans: 'cimnastik', label: 'Cimnastik' } },
  '14:00': { PZT: { brans: 'yuzme', label: 'Yüzme' }, SAL: { brans: 'cimnastik', label: 'Cimnastik' }, ÇAR: { brans: 'yuzme', label: 'Yüzme' }, PER: { brans: 'cimnastik', label: 'Cimnastik' }, CUM: { brans: 'yuzme', label: 'Yüzme' } },
  '15:00': { PZT: { brans: 'atletizm', label: 'Atletizm' }, SAL: { brans: 'yuzme', label: 'Yüzme' }, ÇAR: { brans: 'atletizm', label: 'Atletizm' }, PER: { brans: 'yuzme', label: 'Yüzme' }, CUM: { brans: 'atletizm', label: 'Atletizm' } },
  '16:00': { PZT: { brans: 'cimnastik', label: 'Cimnastik' }, SAL: { brans: 'atletizm', label: 'Atletizm' }, ÇAR: { brans: 'cimnastik', label: 'Cimnastik' }, PER: { brans: 'atletizm', label: 'Atletizm' }, CUM: { brans: 'cimnastik', label: 'Cimnastik' } },
  '17:00': { PZT: { brans: 'yuzme', label: 'Yüzme' }, SAL: { brans: 'cimnastik', label: 'Cimnastik' }, ÇAR: { brans: 'yuzme', label: 'Yüzme' }, PER: { brans: 'cimnastik', label: 'Cimnastik' } },
  '18:00': { SAL: { brans: 'yuzme', label: 'Yüzme' }, PER: { brans: 'yuzme', label: 'Yüzme' } },
}

const BRANCH_STYLES: Record<string, string> = {
  cimnastik: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  yuzme: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  atletizm: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  jimnastik: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
}

export function DersProgramiGrid({ schedule }: { schedule?: Record<string, Record<string, ScheduleCell>> }) {
  const data = schedule ?? DEFAULT_SCHEDULE

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-zinc-950 p-2 text-xs font-medium text-zinc-500 text-left w-16">Saat</th>
            {DAYS.map((day) => (
              <th key={day} className="p-2 text-xs font-medium text-zinc-400 text-center">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour) => (
            <tr key={hour}>
              <td className="sticky left-0 z-10 bg-zinc-950 p-2 text-xs font-medium text-zinc-500 h-12 align-middle">{hour}</td>
              {DAYS.map((day) => {
                const cell = data[hour]?.[day]
                return (
                  <td key={`${hour}-${day}`} className="p-1 h-12">
                    {cell ? (
                      <div className={`rounded-lg p-2 text-xs font-medium text-center h-full flex items-center justify-center hover:scale-105 transition-transform cursor-default ${BRANCH_STYLES[cell.brans] ?? 'bg-zinc-800 text-zinc-400'}`}>
                        {cell.label ?? cell.brans}
                      </div>
                    ) : (
                      <div className="rounded-lg bg-zinc-900/50 h-full" />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-cyan-500/40 border border-cyan-500/30" /> Cimnastik</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500/40 border border-blue-500/30" /> Yüzme</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500/40 border border-orange-500/30" /> Atletizm</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500/40 border border-purple-500/30" /> Jimnastik</span>
      </div>
    </div>
  )
}

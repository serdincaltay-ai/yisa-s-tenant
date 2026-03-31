"use client"

import React from "react"
import { Calendar } from "lucide-react"
import {
  BRANS_RENK,
  DEFAULT_BRANS_RENK,
  type DersProgramiItem,
} from "@/lib/tenant-template-config"

const GUNLER = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const

const GUN_KISA: Record<string, string> = {
  Pazartesi: "PZT",
  Salı: "SAL",
  Çarşamba: "ÇAR",
  Perşembe: "PER",
  Cuma: "CUM",
  Cumartesi: "CMT",
  Pazar: "PAZ",
}

/** Saat dilimleri 08:00 – 19:00 */
const SAATLER = Array.from({ length: 12 }, (_, i) => {
  const saat = 8 + i
  return `${saat.toString().padStart(2, "0")}:00`
})

function getBransRenk(brans: string) {
  return BRANS_RENK[brans] ?? DEFAULT_BRANS_RENK
}

/** Saat string'inden saat numarasını çıkar: "15:00" → 15 */
function saatToNum(saat: string): number {
  const parts = saat.split(":")
  return parseInt(parts[0], 10)
}

interface WeeklyScheduleGridProps {
  dersler: DersProgramiItem[]
  className?: string
}

export default function WeeklyScheduleGrid({
  dersler,
  className = "",
}: WeeklyScheduleGridProps) {
  // Dersleri gun+saat bazlı map'e dönüştür
  const dersMap = new Map<string, DersProgramiItem[]>()
  for (const ders of dersler) {
    const saatNum = saatToNum(ders.saat)
    const key = `${ders.gun}-${saatNum.toString().padStart(2, "0")}:00`
    const existing = dersMap.get(key) ?? []
    existing.push(ders)
    dersMap.set(key, existing)
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Başlık */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <Calendar className="h-6 w-6 text-cyan-400" />
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Haftalık Ders Programı
          </h2>
        </div>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
          Her şube, kendi branş ve yaş grubuna göre otomatik program oluşturur.
        </p>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[#0a1020] border-b border-r border-white/10 px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                Saat
              </th>
              {GUNLER.map((gun) => (
                <th
                  key={gun}
                  className="border-b border-white/10 px-2 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center"
                >
                  <span className="hidden md:inline">{gun}</span>
                  <span className="md:hidden">{GUN_KISA[gun]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAATLER.map((saat, idx) => (
              <tr
                key={saat}
                className={
                  idx % 2 === 0 ? "bg-white/[0.01]" : "bg-transparent"
                }
              >
                <td className="sticky left-0 z-10 bg-[#0a1020] border-r border-white/5 px-3 py-2 text-xs font-mono text-gray-500 text-center whitespace-nowrap">
                  {saat}
                </td>
                {GUNLER.map((gun) => {
                  const key = `${gun}-${saat}`
                  const cellDersler = dersMap.get(key)
                  return (
                    <td
                      key={`${gun}-${saat}`}
                      className="border-b border-white/5 px-1 py-1 text-center align-top min-w-[100px]"
                    >
                      {cellDersler?.map((d, i) => {
                        const renk = getBransRenk(d.brans)
                        return (
                          <div
                            key={i}
                            className={`rounded-lg ${renk.bg} border ${renk.border} px-2 py-1.5 mb-1 last:mb-0 transition-all hover:scale-[1.02]`}
                          >
                            <p
                              className={`text-[11px] font-semibold ${renk.text} leading-tight`}
                            >
                              {d.brans}
                            </p>
                            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                              {d.seviye}
                            </p>
                          </div>
                        )
                      })}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Renk Açıklaması (Legend) */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {Array.from(new Set(dersler.map((d) => d.brans))).map((brans) => {
          const renk = getBransRenk(brans)
          return (
            <div
              key={brans}
              className={`flex items-center gap-1.5 rounded-full ${renk.bg} border ${renk.border} px-3 py-1`}
            >
              <div
                className={`w-2 h-2 rounded-full ${renk.text.replace("text-", "bg-")}`}
              />
              <span className={`text-xs font-medium ${renk.text}`}>
                {brans}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

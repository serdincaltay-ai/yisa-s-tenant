"use client"

/**
 * Franchise / veli — Çocuk performans analizi (grafikler).
 * Kaynak: v0-web-page-content-edit-bjktesis (BJK Tuzla).
 * childId ile ileride API'den gerçek veri çekilebilir.
 */

import { useState } from "react"
import { Award, Target, Calendar } from "lucide-react"

interface ChildPerformancePanelProps {
  childId?: string
}

// recharts yoksa basit placeholder; recharts eklenince grafikler açılır
const performanceData = [
  { month: "Eylül", cember: 6, kopru: 4, takla: 2, esneklik: 7 },
  { month: "Ekim", cember: 7, kopru: 6, takla: 4, esneklik: 8 },
  { month: "Kasım", cember: 8, kopru: 7, takla: 5, esneklik: 8 },
  { month: "Aralık", cember: 9, kopru: 8, takla: 7, esneklik: 9 },
]

const branchScores = [
  { branch: "Cimnastik", score: 92 },
  { branch: "Voleybol", score: 78 },
  { branch: "Basketbol", score: 65 },
  { branch: "Yüzme", score: 71 },
  { branch: "Atletizm", score: 83 },
]

export function ChildPerformancePanel({ childId }: ChildPerformancePanelProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("3months")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Çocuk Performans Analizi</h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="bg-black/40 text-white border border-white/20 rounded-xl px-4 py-2"
        >
          <option value="1month">Son 1 Ay</option>
          <option value="3months">Son 3 Ay</option>
          <option value="6months">Son 6 Ay</option>
          <option value="1year">Son 1 Yıl</option>
        </select>
      </div>

      {/* İlerleme özeti (grafik yerine tablo — recharts eklenince grafik kullanılabilir) */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Teknik Gelişim İlerlemesi</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead>
              <tr className="border-b border-white/20">
                <th className="py-2 pr-4 text-white">Ay</th>
                <th className="py-2 pr-4">Çember</th>
                <th className="py-2 pr-4">Köprü</th>
                <th className="py-2 pr-4">Takla</th>
                <th className="py-2">Esneklik</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((row) => (
                <tr key={row.month} className="border-b border-white/10">
                  <td className="py-2 pr-4 text-white font-medium">{row.month}</td>
                  <td className="py-2 pr-4">{row.cember}</td>
                  <td className="py-2 pr-4">{row.kopru}</td>
                  <td className="py-2 pr-4">{row.takla}</td>
                  <td className="py-2">{row.esneklik}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branş uygunluk */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Branş Uygunluk Skorları</h3>
        <ul className="space-y-2">
          {branchScores.map((b) => (
            <li key={b.branch} className="flex items-center justify-between text-gray-300">
              <span>{b.branch}</span>
              <span className="text-white font-semibold">{b.score}%</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 p-4 bg-blue-500/20 rounded-xl border border-blue-500/30">
          <p className="text-white font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400 shrink-0" />
            AI Önerisi: Çocuğunuz cimnastik branşına %92 uygunluk gösteriyor!
          </p>
          <p className="text-gray-300 text-sm mt-2">Esneklik ve koordinasyon yetenekleri son derece iyi. Devam edin!</p>
        </div>
      </div>

      {/* Hedefler ve tahminler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-2xl border border-green-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-8 h-8 text-green-400 shrink-0" />
            <h3 className="text-xl font-bold text-white">Kısa Vadeli Hedefler</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-gray-300">
              <div className="w-2 h-2 rounded-full bg-green-400 mt-2 shrink-0" />
              <span>Çember hareketini mükemmelleştir (2 hafta)</span>
            </li>
            <li className="flex items-start gap-2 text-gray-300">
              <div className="w-2 h-2 rounded-full bg-green-400 mt-2 shrink-0" />
              <span>Takla girişini öğren (1 ay)</span>
            </li>
            <li className="flex items-start gap-2 text-gray-300">
              <div className="w-2 h-2 rounded-full bg-green-400 mt-2 shrink-0" />
              <span>Esneklik skorunu 10/10 yap (3 hafta)</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-2xl border border-purple-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-purple-400 shrink-0" />
            <h3 className="text-xl font-bold text-white">AI Tahmini</h3>
          </div>
          <p className="text-gray-300 mb-4">Mevcut gelişim hızıyla:</p>
          <ul className="space-y-3">
            <li className="text-gray-300">
              <span className="text-purple-400 font-semibold">3 ay sonra:</span> Takla yapabilir
            </li>
            <li className="text-gray-300">
              <span className="text-purple-400 font-semibold">6 ay sonra:</span> İleri takla yapabilir
            </li>
            <li className="text-gray-300">
              <span className="text-purple-400 font-semibold">1 yıl sonra:</span> Salto girişi yapabilir
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

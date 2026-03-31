'use client'

import { useEffect, useState, useCallback } from 'react'
import { FORBIDDEN_FOR_AI, REQUIRE_PATRON_APPROVAL } from '@/lib/security/patron-lock'
import {
  SIBER_GUVENLIK_KURALLARI,
  logAlaniDenetlenebilir,
} from '@/lib/security/siber-guvenlik'
import {
  VERI_ARSIVLEME_KURALLARI,
  saklamaSuresi,
} from '@/lib/archiving/veri-arsivleme'
import { useAccent, type AccentColor } from '@/lib/context/accent-context'
import { Shield, Archive, Palette, Clock, Calendar, StickyNote } from 'lucide-react'

const NOTES_KEY = 'yisa-settings-notes'
const ACCENT_OPTIONS: { value: AccentColor; label: string; color: string; selectedClass: string }[] = [
  { value: 'cyan', label: 'Cyan', color: 'bg-cyan-500', selectedClass: 'border-cyan-500 bg-cyan-500/20' },
  { value: 'pink', label: 'Pembe', color: 'bg-pink-500', selectedClass: 'border-pink-500 bg-pink-500/20' },
  { value: 'blue', label: 'Mavi', color: 'bg-blue-500', selectedClass: 'border-blue-500 bg-blue-500/20' },
  { value: 'amber', label: 'Turuncu', color: 'bg-amber-500', selectedClass: 'border-amber-500 bg-amber-500/20' },
  { value: 'green', label: 'Yeşil', color: 'bg-green-500', selectedClass: 'border-green-500 bg-green-500/20' },
  { value: 'emerald', label: 'Zümrüt', color: 'bg-emerald-500', selectedClass: 'border-emerald-500 bg-emerald-500/20' },
]

const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

export default function SettingsPage() {
  const { accent, setAccent, textClass } = useAccent()
  const [time, setTime] = useState<string>('')
  const [notes, setNotesState] = useState('')

  const loadNotes = useCallback(() => {
    try {
      const v = localStorage.getItem(NOTES_KEY)
      if (v) setNotesState(v)
    } catch {}
  }, [])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const saveNotes = (v: string) => {
    setNotesState(v)
    try {
      localStorage.setItem(NOTES_KEY, v)
    } catch {}
  }

  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const startDay = (monthStart.getDay() + 6) % 7 // Pazartesi = 0
  const daysInMonth = monthEnd.getDate()
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startDay; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)
  const currentDay = today.getDate()

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
        <p className="text-gray-400">Tema rengi, saat, takvim, not defteri — güvenlik kuralları aşağıda.</p>
      </div>

      {/* Düzenlenebilir Alanlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Tema Rengi */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Palette size={20} className={textClass} />
            Tema Rengi
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Panel vurgu rengini değiştirin. Menü ve öne çıkan alanlar bu rengi kullanır.
          </p>
          <div className="flex flex-wrap gap-3">
            {ACCENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAccent(opt.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                  accent === opt.value
                    ? `${opt.selectedClass} text-white`
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${opt.color}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Saat */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Clock size={20} className={textClass} />
            Saat
          </h2>
          <p className="text-4xl font-mono font-bold text-white tabular-nums">{time || '--:--:--'}</p>
          <p className="text-sm text-gray-500 mt-2">
            {today.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Mini Takvim */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Calendar size={20} className={textClass} />
            Takvim
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            {MONTHS_TR[today.getMonth()]} {today.getFullYear()}
          </p>
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAYS_TR.map((d) => (
              <div key={d} className="text-xs text-gray-500 font-medium py-1">
                {d}
              </div>
            ))}
            {calendarDays.map((d, i) => (
              <div
                key={i}
                className={`py-1.5 rounded-lg text-sm ${
                  d === null ? 'invisible' : d === currentDay ? `${textClass} font-bold bg-white/10` : 'text-gray-400'
                }`}
              >
                {d ?? ''}
              </div>
            ))}
          </div>
        </div>

        {/* Not Defteri */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <StickyNote size={20} className={textClass} />
            Not Defteri
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Kendi notlarınızı yazın. Tarayıcıda saklanır; silinmez.
          </p>
          <textarea
            value={notes}
            onChange={(e) => saveNotes(e.target.value)}
            placeholder="Notlarınızı buraya yazın..."
            className="w-full h-32 px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 resize-none"
          />
        </div>
      </div>

      {/* Güvenlik Kuralları (mevcut) */}
      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">AI için Yasak Alanlar</h2>
          <div className="flex flex-wrap gap-2">
            {FORBIDDEN_FOR_AI.map((term) => (
              <span
                key={term}
                className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20"
              >
                {term}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Patron Onayı Gerektiren İşlemler</h2>
          <div className="flex flex-wrap gap-2">
            {REQUIRE_PATRON_APPROVAL.map((term) => (
              <span
                key={term}
                className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-sm border border-amber-500/20"
              >
                {term}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Shield size={20} className="text-amber-400" />
            Siber Güvenlik (Katman 2)
          </h2>
          <p className="text-gray-400 text-sm mb-3">
            Log alanları: {SIBER_GUVENLIK_KURALLARI.LOG_ALANLARI.join(', ')}. Audit anahtarları:{' '}
            {SIBER_GUVENLIK_KURALLARI.AUDIT_KEYWORDS.slice(0, 4).join(', ')}…
          </p>
          <div className="flex flex-wrap gap-2">
            {SIBER_GUVENLIK_KURALLARI.LOG_ALANLARI.map((a) => (
              <span
                key={a}
                className="px-3 py-1 rounded-lg bg-gray-800/50 text-gray-300 text-sm"
              >
                {a} {logAlaniDenetlenebilir(a) ? '✓' : ''}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Archive size={20} className="text-amber-400" />
            Veri Arşivleme (Katman 3)
          </h2>
          <p className="text-gray-400 text-sm mb-3">
            Arşivlenebilir: {VERI_ARSIVLEME_KURALLARI.ARSIVLENEBILIR.join(', ')}. Format:{' '}
            {VERI_ARSIVLEME_KURALLARI.FORMAT}.
          </p>
          <div className="flex flex-wrap gap-2">
            {VERI_ARSIVLEME_KURALLARI.ARSIVLENEBILIR.map((t) => (
              <span key={t} className="px-3 py-1 rounded-lg bg-gray-800/50 text-gray-300 text-sm">
                {t} → {saklamaSuresi(t)} gün
              </span>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-400">
            <strong className="text-white">.env / .env.local / API key:</strong> Değiştirilmez.
            Deploy ve commit sadece Patron onayı ile.
          </p>
        </div>
      </div>
    </div>
  )
}

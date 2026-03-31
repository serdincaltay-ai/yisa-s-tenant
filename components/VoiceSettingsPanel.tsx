'use client'

import { useVoice, type VoiceSpeed, type VoiceTone } from '@/lib/context/voice-context'
import { Volume2, VolumeX, Gauge, Mic, PlayCircle } from 'lucide-react'

/* ================================================================
   Ses Ayarları Paneli — dropdown olarak gösterilir
   Hız, ton, seviye, otomatik okuma ayarları
   ================================================================ */

const SPEED_OPTIONS: { value: VoiceSpeed; label: string }[] = [
  { value: 'yavas', label: 'Yavaş' },
  { value: 'normal', label: 'Normal' },
  { value: 'hizli', label: 'Hızlı' },
]

const TONE_OPTIONS: { value: VoiceTone; label: string }[] = [
  { value: 'erkek', label: 'Erkek' },
  { value: 'kadin', label: 'Kadın' },
  { value: 'robot', label: 'Robot' },
]

export default function VoiceSettingsPanel({ onClose }: { onClose: () => void }) {
  const { speed, tone, volume, autoRead, setSpeed, setTone, setVolume, setAutoRead, speak } = useVoice()

  const testVoice = () => {
    speak('Merhaba! Ben YiSA-S yapay zeka asistanıyım.')
  }

  return (
    <div
      className="absolute right-0 top-full mt-1 z-50 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl p-3 space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-300">Ses Ayarları</span>
        <button onClick={onClose} className="text-xs text-zinc-500 hover:text-zinc-300">
          Kapat
        </button>
      </div>

      {/* Hız */}
      <div>
        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-1">
          <Gauge className="w-3 h-3" /> Hız
        </label>
        <div className="flex gap-1">
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSpeed(opt.value)}
              className={`flex-1 px-2 py-1 rounded-lg text-[11px] border transition-all ${
                speed === opt.value
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ton */}
      <div>
        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-1">
          <Mic className="w-3 h-3" /> Ses Tonu
        </label>
        <div className="flex gap-1">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTone(opt.value)}
              className={`flex-1 px-2 py-1 rounded-lg text-[11px] border transition-all ${
                tone === opt.value
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ses Seviyesi */}
      <div>
        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-1">
          {volume > 0 ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          Ses Seviyesi: {Math.round(volume * 100)}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
          className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      </div>

      {/* Otomatik Okuma */}
      <label className="flex items-center gap-2 text-[11px] text-zinc-400 cursor-pointer">
        <input
          type="checkbox"
          checked={autoRead}
          onChange={(e) => setAutoRead(e.target.checked)}
          className="rounded border-zinc-600 bg-zinc-800 text-cyan-500 w-3.5 h-3.5"
        />
        <PlayCircle className="w-3 h-3" />
        Yeni mesajı otomatik oku
      </label>

      {/* Test */}
      <button
        onClick={testVoice}
        className="w-full px-2 py-1.5 rounded-lg text-[11px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all"
      >
        Sesi Test Et
      </button>
    </div>
  )
}

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

/* ================================================================
   Ses Ayarları Context — TTS + STT kontrolleri
   - Ses açık/kapalı toggle
   - Hız (yavas/normal/hizli)
   - Ses tonu (erkek/kadin/robot)
   - Ses seviyesi (0–1)
   - Otomatik okuma modu
   ================================================================ */

export type VoiceSpeed = 'yavas' | 'normal' | 'hizli'
export type VoiceTone = 'erkek' | 'kadin' | 'robot'

const SPEED_MAP: Record<VoiceSpeed, number> = {
  yavas: 0.7,
  normal: 1.0,
  hizli: 1.4,
}

const STORAGE_KEY = 'yisa-voice-settings'

interface VoiceSettings {
  enabled: boolean
  autoRead: boolean
  speed: VoiceSpeed
  tone: VoiceTone
  volume: number
}

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: true,
  autoRead: false,
  speed: 'normal',
  tone: 'kadin',
  volume: 0.8,
}

interface VoiceContextValue extends VoiceSettings {
  setEnabled: (v: boolean) => void
  setAutoRead: (v: boolean) => void
  setSpeed: (v: VoiceSpeed) => void
  setTone: (v: VoiceTone) => void
  setVolume: (v: number) => void
  speak: (text: string, onBoundary?: (charIndex: number, charLength: number) => void) => void
  stop: () => void
  isSpeaking: boolean
  speedRate: number
}

const VoiceContext = createContext<VoiceContextValue | null>(null)

function getVoiceForTone(tone: VoiceTone, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const turkishVoices = voices.filter((v) => v.lang.startsWith('tr'))

  if (turkishVoices.length === 0) {
    return voices.find((v) => v.lang.startsWith('tr')) ?? voices[0]
  }

  if (tone === 'erkek') {
    return (
      turkishVoices.find((v) => v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('female')) ??
      turkishVoices[turkishVoices.length - 1]
    )
  }
  if (tone === 'kadin') {
    return (
      turkishVoices.find((v) => v.name.toLowerCase().includes('female')) ??
      turkishVoices[0]
    )
  }
  // robot — first available Turkish voice with lower pitch handled separately
  return turkishVoices[0]
}

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS)
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<VoiceSettings>
        setSettings((prev) => ({ ...prev, ...parsed }))
      }
    } catch { /* ignore */ }
  }, [])

  const persist = useCallback((update: Partial<VoiceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...update }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch { /* ignore */ }
      return next
    })
  }, [])

  const setEnabled = useCallback((v: boolean) => {
    persist({ enabled: v })
    if (!v && typeof window !== 'undefined') {
      window.speechSynthesis?.cancel()
      setIsSpeaking(false)
    }
  }, [persist])

  const setAutoRead = useCallback((v: boolean) => {
    persist({ autoRead: v })
  }, [persist])

  const setSpeed = useCallback((v: VoiceSpeed) => {
    persist({ speed: v })
  }, [persist])

  const setTone = useCallback((v: VoiceTone) => {
    persist({ tone: v })
  }, [persist])

  const setVolume = useCallback((v: number) => {
    persist({ volume: Math.max(0, Math.min(1, v)) })
  }, [persist])

  const stop = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis?.cancel()
      setIsSpeaking(false)
    }
  }, [])

  const speak = useCallback(
    (text: string, onBoundary?: (charIndex: number, charLength: number) => void) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'tr-TR'
      utterance.rate = SPEED_MAP[settings.speed]
      utterance.volume = settings.volume

      if (settings.tone === 'robot') {
        utterance.pitch = 0.3
      } else if (settings.tone === 'erkek') {
        utterance.pitch = 0.8
      } else {
        utterance.pitch = 1.2
      }

      const voices = window.speechSynthesis.getVoices()
      const voice = getVoiceForTone(settings.tone, voices)
      if (voice) utterance.voice = voice

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      if (onBoundary) {
        utterance.onboundary = (e) => {
          onBoundary(e.charIndex, e.charLength)
        }
      }

      window.speechSynthesis.speak(utterance)
    },
    [settings.speed, settings.volume, settings.tone],
  )

  const value: VoiceContextValue = {
    ...settings,
    setEnabled,
    setAutoRead,
    setSpeed,
    setTone,
    setVolume,
    speak,
    stop,
    isSpeaking,
    speedRate: SPEED_MAP[settings.speed],
  }

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
}

export function useVoice(): VoiceContextValue {
  const ctx = useContext(VoiceContext)
  return (
    ctx ?? {
      ...DEFAULT_SETTINGS,
      setEnabled: () => {},
      setAutoRead: () => {},
      setSpeed: () => {},
      setTone: () => {},
      setVolume: () => {},
      speak: () => {},
      stop: () => {},
      isSpeaking: false,
      speedRate: 1.0,
    }
  )
}

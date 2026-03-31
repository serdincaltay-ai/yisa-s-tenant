'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type AccentColor = 'cyan' | 'pink' | 'blue' | 'amber' | 'green' | 'emerald'

const STORAGE_KEY = 'yisa-accent'
const DEFAULT: AccentColor = 'cyan'

type AccentContextValue = {
  accent: AccentColor
  setAccent: (c: AccentColor) => void
  activeClass: string
  textClass: string
  borderClass: string
}

const ACCENT_CLASSES: Record<AccentColor, { active: string; text: string; border: string }> = {
  cyan: { active: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  pink: { active: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  blue: { active: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  amber: { active: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  green: { active: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  emerald: { active: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
}

const AccentContext = createContext<AccentContextValue | null>(null)

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentColor>(DEFAULT)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as AccentColor | null
      if (stored && ACCENT_CLASSES[stored]) setAccentState(stored)
    } catch {}
    setMounted(true)
  }, [])

  const setAccent = useCallback((c: AccentColor) => {
    setAccentState(c)
    try {
      localStorage.setItem(STORAGE_KEY, c)
    } catch {}
  }, [])

  const classes = ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.pink

  const value: AccentContextValue = {
    accent,
    setAccent,
    activeClass: classes.active,
    textClass: classes.text,
    borderClass: classes.border,
  }

  return <AccentContext.Provider value={value}>{children}</AccentContext.Provider>
}

export function useAccent() {
  const ctx = useContext(AccentContext)
  return ctx ?? {
    accent: DEFAULT as AccentColor,
    setAccent: () => {},
    activeClass: ACCENT_CLASSES.cyan.active,
    textClass: ACCENT_CLASSES.cyan.text,
    borderClass: ACCENT_CLASSES.cyan.border,
  }
}

/**
 * YİSA-S CELF AI Havuzu — Direktörlük API yapılandırması
 * Orkestratör: CELF Gemini. Direktörlükler: V0, Cursor, GitHub, Claude, GPT, Together.
 * Tarih: 30 Ocak 2026
 */

import type { DirectorKey } from '@/lib/robots/celf-center'

function env(key: string): string | undefined {
  const v = process.env[key]
  return typeof v === 'string' ? v.trim() || undefined : undefined
}

/** CELF orkestratör (Gemini) anahtarı */
export function getCelfOrchestratorKey(): string | undefined {
  return env('CELF_GOOGLE_API_KEY') ?? env('CELF_GOOGLE_GEMINI_API_KEY') ?? env('GOOGLE_GEMINI_API_KEY')
}

/** Direktörlük dış API anahtarları */
export const CELF_POOL_KEYS = {
  /** V0 (tasarım/UI) — CPO */
  v0: () => env('V0_API_KEY'),
  /** Cursor (kod/tasarım incelemesi) — CTO, CPO */
  cursor: () => env('CURSOR_API_KEY'),
  /** GitHub (commit/push) — CTO, Patron onayı sonrası */
  github: () => env('GITHUB_TOKEN'),
  /** Vercel deploy — Patron onayı sonrası */
  vercel: () => env('VERCEL_TOKEN'),
  /** Railway deploy — Patron onayı sonrası */
  railway: () => env('RAILWAY_TOKEN'),
  /** Claude — CTO, CHRO, CLO, CCO, CISO */
  claude: () => env('CELF_ANTHROPIC_API_KEY') ?? env('ANTHROPIC_API_KEY'),
  /** GPT — CFO, CIO, CMO, CDO, CSO_SATIS, CSO_STRATEJI */
  gpt: () => env('CELF_OPENAI_API_KEY') ?? env('OPENAI_API_KEY'),
  /** Gemini — direktörlük yedek */
  gemini: () => getCelfOrchestratorKey(),
  /** Together — CDO, veri analiz */
  together: () => env('CELF_TOGETHER_API_KEY') ?? env('TOGETHER_API_KEY'),
  /** ManyChat — CMO, pazarlama, lead gönderimi */
  manychat: () => env('MANYCHAT_API_KEY'),
  /** FAL — CPO, görsel üretim */
  fal: () => env('FAL_API_KEY'),
} as const

/** Hangi direktörlük hangi dış API'leri kullanır (CELF motor akışı için) */
export const CELF_DIRECTOR_EXTERNAL_APIS: Record<DirectorKey, string[]> = {
  CFO: ['gpt', 'gemini'],
  CTO: ['claude', 'cursor', 'github'],
  CIO: ['gpt'],
  CMO: ['gpt', 'claude', 'manychat'],
  CHRO: ['claude'],
  CLO: ['claude'],
  CSO_SATIS: ['gpt'],
  CPO: ['v0', 'cursor'],
  CDO: ['together', 'gemini', 'gpt'],
  CISO: ['claude'],
  CCO: ['gemini', 'gpt'],
  CSO_STRATEJI: ['gpt', 'gemini'],
  CSPO: ['claude', 'gemini'],
  COO: ['gemini', 'claude', 'vercel'],
  RND: ['claude', 'together', 'github'],
}

/** CPO direktörlüğü mü (V0 + Cursor) */
export function isCpoDirector(key: DirectorKey): boolean {
  return key === 'CPO'
}

/** CTO direktörlüğü mü (Claude + Cursor + GitHub) */
export function isCtoDirector(key: DirectorKey): boolean {
  return key === 'CTO'
}

/**
 * Patron doğrudan talimatları — "V0 çalıştır", "Cursor çalıştır", "CFO'ya şunu yaptır", "CTO'yu hatırlat"
 * Asistan tam yetki: Patron sadece GPT ile konuşur; bu komutlar CIO/CEO/CELF'e yönlendirilir.
 * Tarih: 3 Şubat 2026
 */

import type { DirectorKey } from './celf-center'
import { CELF_DIRECTORATES } from './celf-center'

export type PatronDirectiveType = 'v0' | 'cursor' | 'celf' | 'director' | 'remind' | null

export interface PatronDirective {
  type: PatronDirectiveType
  /** Hedef direktör (director / remind için) */
  director?: DirectorKey
  /** Görev metni (direktörden sonraki kısım veya tüm mesaj) */
  task?: string
  /** Orijinal mesajın kendisi */
  rawMessage: string
}

const DIRECTOR_ALIASES: Record<string, DirectorKey> = {
  cfo: 'CFO',
  cto: 'CTO',
  cio: 'CIO',
  cmo: 'CMO',
  chro: 'CHRO',
  clo: 'CLO',
  cso: 'CSO_SATIS',
  cso_satis: 'CSO_SATIS',
  cso_strateji: 'CSO_STRATEJI',
  cpo: 'CPO',
  cdo: 'CDO',
  ciso: 'CISO',
  cco: 'CCO',
  cspo: 'CSPO',
  coo: 'COO',
  rnd: 'RND',
}

const DIRECTOR_NAMES_TR: Record<string, DirectorKey> = {
  finans: 'CFO',
  teknoloji: 'CTO',
  'bilgi sistemleri': 'CIO',
  pazarlama: 'CMO',
  'insan kaynakları': 'CHRO',
  hukuk: 'CLO',
  satış: 'CSO_SATIS',
  ürün: 'CPO',
  veri: 'CDO',
  güvenlik: 'CISO',
  müşteri: 'CCO',
  strateji: 'CSO_STRATEJI',
  spor: 'CSPO',
}

/**
 * Patron mesajından doğrudan talimat çıkar (V0, Cursor, CELF, X direktörüne Y yaptır, X direktörünü hatırlat).
 */
export function parsePatronDirective(message: string): PatronDirective {
  const raw = (message || '').trim()
  const lower = raw.toLowerCase()

  // "V0 çalıştır", "v0'da şunu yap", "v0 ile tasarım", "v0'a gönder", "v0'u çağır", "v0'u görevlendir"
  if (/\bv0\b|\bv\s*0\b/.test(lower)) {
    const task = raw.replace(/\b(v0|v\s*0)\s*('u\s*çağır|'a\s*gönder|'u\s*görevlendir|çalıştır|ile|'da|da|'a|'u)?\s*/gi, '').trim() || raw
    return { type: 'v0', task: task || undefined, rawMessage: raw }
  }

  // "Cursor çalıştır", "cursor'a gönder", "cursor ile kod", "cursor'u çağır"
  if (/\bcursor\b/.test(lower)) {
    const task = raw.replace(/\bcursor\s*(çalıştır|ile|'a|a gönder|'u|u çağır)?\s*/gi, '').trim() || raw
    return { type: 'cursor', task: task || undefined, rawMessage: raw }
  }

  // "CELF çalıştır", "celf'e gönder"
  if (/\bcelf\b/.test(lower) && (lower.includes('çalıştır') || lower.includes('gönder') || lower.includes("'e"))) {
    const task = raw.replace(/\bcelf\s*(çalıştır|'e|e gönder)?\s*/gi, '').trim() || raw
    return { type: 'celf', task: task || undefined, rawMessage: raw }
  }

  // "CFO'yu hatırlat", "CTO'yu hatırlat", "CSPO'yu hatırlat"
  for (const [alias, key] of Object.entries(DIRECTOR_ALIASES)) {
    if (lower.includes(`${alias}'yu hatırlat`) || lower.includes(`${alias} yu hatırlat`) || lower.includes(`${alias} hatırlat`)) {
      return { type: 'remind', director: key, rawMessage: raw }
    }
  }

  // "CFO'ya şunu yaptır", "CTO'ya ... yaptır", "CSPO'ya rapor hazırla"
  for (const [alias, key] of Object.entries(DIRECTOR_ALIASES)) {
    const re = new RegExp(`${alias}'ya\\s+(.+)`, 'i')
    const m = raw.match(re)
    if (m) {
      return { type: 'director', director: key, task: m[1].trim(), rawMessage: raw }
    }
  }
  for (const [nameTr, key] of Object.entries(DIRECTOR_NAMES_TR)) {
    const re = new RegExp(`${nameTr}(?:'ya|ya)\\s+(.+)`, 'i')
    const m = raw.match(re)
    if (m) {
      return { type: 'director', director: key, task: m[1].trim(), rawMessage: raw }
    }
  }

  return { type: null, rawMessage: raw }
}

/**
 * Direktif varsa CIO'ya iletilmek üzere birincil direktör ve görev metnini döndür.
 * Flow'da: directive.director varsa CEO route'u bu direktöre zorla yönlendirir.
 */
export function getDirectorFromDirective(directive: PatronDirective): DirectorKey | null {
  if (directive.type === 'director' || directive.type === 'remind') {
    return directive.director ?? null
  }
  return null
}

export function isValidDirectorKey(key: string): key is DirectorKey {
  return key in CELF_DIRECTORATES
}

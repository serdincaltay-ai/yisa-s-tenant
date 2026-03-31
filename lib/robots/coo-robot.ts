/**
 * YİSA-S COO Robot - Operasyon yönetimi (Katman 6)
 * Rutin görevleri zamanında çalıştırır; platform operasyonları.
 * Tarih: 30 Ocak 2026
 */

import type { DirectorKey } from './celf-center'
import {
  getDueRoutineTasks,
  updateRoutineTaskLastRun,
  computeNextRun,
  type RoutineTaskRow,
  type ScheduleType,
} from '@/lib/db/routine-tasks'

export type OperationType =
  | 'daily_ops'
  | 'facility_coord'
  | 'franchise_coord'
  | 'process_track'
  | 'resource_alloc'
  | 'unknown'

export const COO_OPERATIONS: Record<
  OperationType,
  { label: string; keywords: string[] }
> = {
  daily_ops: {
    label: 'Günlük operasyonlar',
    keywords: ['günlük', 'operasyon', 'takvim', 'görev', 'deadline'],
  },
  facility_coord: {
    label: 'Tesis koordinasyonu',
    keywords: ['tesis', 'salon', 'merkez', 'lokasyon', 'kapasite'],
  },
  franchise_coord: {
    label: 'Franchise koordinasyonu',
    keywords: ['franchise', 'bayi', 'partner', 'vitrin', 'yayılım'],
  },
  process_track: {
    label: 'Süreç takibi',
    keywords: ['süreç', 'iş akışı', 'onay', 'rapor', 'durum'],
  },
  resource_alloc: {
    label: 'Kaynak tahsisi',
    keywords: ['kaynak', 'tahsis', 'atama', 'ekip', 'budget'],
  },
  unknown: { label: 'Belirsiz', keywords: [] },
}

/**
 * Operasyon tipini metinden çıkarır.
 */
export function resolveOperationType(input: string): OperationType {
  const lower = input.toLowerCase().trim()
  for (const [type, config] of Object.entries(COO_OPERATIONS)) {
    if (type === 'unknown') continue
    const match = config.keywords.some((k) => lower.includes(k))
    if (match) return type as OperationType
  }
  return 'unknown'
}

/**
 * CELF direktörlüğü ile COO operasyonu eşleştirme (çoğul operasyonlar için).
 */
export function mapDirectorToCOO(director: DirectorKey): OperationType {
  const map: Partial<Record<DirectorKey, OperationType>> = {
    CFO: 'resource_alloc',
    CTO: 'process_track',
    CIO: 'process_track',
    CMO: 'franchise_coord',
    CHRO: 'resource_alloc',
    CSO_SATIS: 'franchise_coord',
    CPO: 'daily_ops',
    CDO: 'process_track',
    CISO: 'process_track',
    CCO: 'facility_coord',
    CSO_STRATEJI: 'daily_ops',
  }
  return map[director] ?? 'daily_ops'
}

/** Zamanı gelen rutin görevleri döner (COO çalıştırmak için) */
export async function getDueRoutines(): Promise<{
  data?: RoutineTaskRow[]
  error?: string
}> {
  return getDueRoutineTasks()
}

/** Rutin görev çalıştırıldıktan sonra next_run güncelle */
export async function markRoutineRun(
  id: string,
  schedule: ScheduleType,
  scheduleTime?: string
): Promise<{ error?: string }> {
  const nextRun = computeNextRun(schedule, scheduleTime)
  if (!nextRun) return { error: 'Geçersiz schedule' }
  return updateRoutineTaskLastRun(id, nextRun)
}

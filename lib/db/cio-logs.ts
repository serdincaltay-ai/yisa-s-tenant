/**
 * CIO Analiz Logları - Supabase yazma
 * CIO strateji analizi ve önceliklendirme kayıtları
 * Tarih: 31 Ocak 2026
 */

import { getSupabaseServer } from '@/lib/supabase'
import type { CIOAnalysisResult, CIOWorkOrder } from '@/lib/robots/cio-robot'

export interface CIOLogEntry {
  ceo_task_id?: string
  command: string
  task_type: string
  classification: 'company' | 'private' | 'unclear'
  primary_director: string | null
  target_directors: string[]
  priority: string
  is_routine: boolean
  estimated_token_cost: number
  strategy_notes: string[]
  conflict_warnings: string[]
  work_order_id?: string
}

/**
 * CIO analiz sonucunu veritabanına kaydet
 */
export async function logCIOAnalysis(
  analysis: CIOAnalysisResult,
  ceoTaskId?: string
): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const entry: CIOLogEntry = {
    ceo_task_id: ceoTaskId,
    command: analysis.ceoWorkOrder?.command ?? '',
    task_type: analysis.taskType,
    classification: analysis.classification,
    primary_director: analysis.primaryDirector,
    target_directors: analysis.targetDirectors,
    priority: analysis.priority,
    is_routine: analysis.isRoutine,
    estimated_token_cost: analysis.estimatedTokenCost,
    strategy_notes: analysis.strategyNotes,
    conflict_warnings: analysis.conflictWarnings,
    work_order_id: analysis.ceoWorkOrder?.id,
  }

  const { error, data } = await db
    .from('cio_analysis_logs')
    .insert(entry)
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data?.id }
}

/**
 * Günlük token kullanımını hesapla (CIO bütçe kontrolü için)
 */
export async function getDailyTokenUsage(date?: Date): Promise<{ used: number; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { used: 0, error: 'Supabase bağlantısı yok' }

  const targetDate = date ?? new Date()
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  const { data, error } = await db
    .from('cio_analysis_logs')
    .select('estimated_token_cost')
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())

  if (error) return { used: 0, error: error.message }

  const total = (data ?? []).reduce((sum, row) => {
    return sum + (row.estimated_token_cost ?? 0)
  }, 0)

  return { used: total }
}

/**
 * CIO öncelik dağılımı raporu
 */
export async function getCIOPriorityReport(days: number = 7): Promise<{
  report?: Record<string, number>
  error?: string
}> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await db
    .from('cio_analysis_logs')
    .select('priority')
    .gte('created_at', startDate.toISOString())

  if (error) return { error: error.message }

  const report: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  }

  for (const row of data ?? []) {
    const p = row.priority as string
    if (p in report) {
      report[p]++
    }
  }

  return { report }
}

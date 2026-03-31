/**
 * YİSA-S CELF Denetim Logları
 * check_type: data_access, protection, approval, veto
 * check_result: passed, failed, warning
 */

import { getSupabaseServer } from '@/lib/supabase'

export type CelfCheckType = 'data_access' | 'protection' | 'approval' | 'veto'
export type CelfCheckResult = 'passed' | 'failed' | 'warning'

export interface LogCelfAuditParams {
  task_id?: string
  director_key: string
  check_type: CelfCheckType
  check_result: CelfCheckResult
  details?: Record<string, unknown>
}

export async function logCelfAudit(params: LogCelfAuditParams): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { error, data } = await db
    .from('celf_audit_logs')
    .insert({
      task_id: params.task_id ?? null,
      director_key: params.director_key,
      check_type: params.check_type,
      check_result: params.check_result,
      details: params.details ?? {},
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data?.id }
}

export async function getCelfAuditLogs(params: {
  task_id?: string
  director_key?: string
  limit?: number
}): Promise<{ data?: { id: string; director_key: string; check_type: string; check_result: string; details: unknown; created_at: string }[]; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  let q = db.from('celf_audit_logs').select('id, director_key, check_type, check_result, details, created_at').order('created_at', { ascending: false }).limit(params.limit ?? 100)
  if (params.task_id) q = q.eq('task_id', params.task_id)
  if (params.director_key) q = q.eq('director_key', params.director_key)
  const { data, error } = await q
  if (error) return { error: error.message }
  return { data: (data ?? []) as { id: string; director_key: string; check_type: string; check_result: string; details: unknown; created_at: string }[] }
}

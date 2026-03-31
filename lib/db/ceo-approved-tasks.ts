/**
 * YİSA-S CEO Onaylı İşler Arşivi (ceo_approved_tasks)
 */

import { getSupabaseServer } from '@/lib/supabase'

export interface ArchiveApprovedTaskParams {
  task_id: string
  task_type: string
  director_key: string
  original_command: string
  final_result?: Record<string, unknown>
  data_used?: string[]
  data_changed?: string[]
  approved_by?: string
  can_become_routine?: boolean
  became_routine_id?: string
}

export async function archiveApprovedTask(params: ArchiveApprovedTaskParams): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { error, data } = await db
    .from('ceo_approved_tasks')
    .insert({
      task_id: params.task_id,
      task_type: params.task_type,
      director_key: params.director_key,
      original_command: params.original_command,
      final_result: params.final_result ?? null,
      data_used: params.data_used ?? [],
      data_changed: params.data_changed ?? [],
      approved_by: params.approved_by ?? null,
      can_become_routine: params.can_become_routine ?? true,
      became_routine_id: params.became_routine_id ?? null,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { id: data?.id }
}

export async function findSimilarApprovedTasks(command: string, limit = 5): Promise<{ data?: { id: string; original_command: string; director_key: string }[]; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { data, error } = await db
    .from('ceo_approved_tasks')
    .select('id, original_command, director_key')
    .ilike('original_command', `%${command.substring(0, 50)}%`)
    .order('approved_at', { ascending: false })
    .limit(limit)
  if (error) return { error: error.message }
  return { data: (data ?? []) as { id: string; original_command: string; director_key: string }[] }
}

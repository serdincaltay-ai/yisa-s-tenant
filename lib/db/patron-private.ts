/**
 * YİSA-S Patron Özel İşler
 * Şirketle ilgisi olmayan, CELF'e gitmeyen işler.
 */

import { getSupabaseServer } from '@/lib/supabase'

export interface SavePrivateTaskParams {
  patron_id: string
  task_type?: string
  command: string
  result?: string
  ai_providers?: string[]
}

export async function savePrivateTask(params: SavePrivateTaskParams): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { error, data } = await db
    .from('patron_private_tasks')
    .insert({
      patron_id: params.patron_id,
      task_type: params.task_type ?? null,
      command: params.command,
      result: params.result ?? null,
      ai_providers: params.ai_providers ?? [],
      is_private: true,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data?.id }
}

export async function updatePrivateTaskResult(id: string, result: string): Promise<{ error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { error } = await db.from('patron_private_tasks').update({ result }).eq('id', id)
  return error ? { error: error.message } : {}
}

export async function getPrivateTasks(patronId: string, limit = 50): Promise<{
  data?: { id: string; command: string; result: string | null; task_type: string | null; created_at: string }[]
  error?: string
}> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { data, error } = await db
    .from('patron_private_tasks')
    .select('id, command, result, task_type, created_at')
    .eq('patron_id', patronId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return { error: error.message }
  return { data: (data ?? []) as { id: string; command: string; result: string | null; task_type: string | null; created_at: string }[] }
}

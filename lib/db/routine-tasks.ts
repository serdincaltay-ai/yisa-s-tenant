/**
 * YİSA-S Rutin Görevler - routine_tasks CRUD
 * "Bu rutin olsun" → CEO kaydeder, COO zamanı gelince çalıştırır.
 */

import { getSupabaseServer } from '@/lib/supabase'

export type ScheduleType = 'daily' | 'weekly' | 'monthly'

export interface RoutineTaskRow {
  id: string
  task_type: string
  director_key: string
  command: string
  schedule: ScheduleType
  schedule_time: string | null
  last_run: string | null
  next_run: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
}

export interface CreateRoutineTaskParams {
  task_type: string
  director_key: string
  command: string
  schedule: ScheduleType
  schedule_time?: string
  created_by?: string
}

export async function createRoutineTask(
  params: CreateRoutineTaskParams
): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const nextRun = computeNextRun(params.schedule, params.schedule_time)
  const { error, data } = await db
    .from('routine_tasks')
    .insert({
      task_type: params.task_type,
      director_key: params.director_key,
      command: params.command,
      schedule: params.schedule,
      schedule_time: params.schedule_time ?? null,
      next_run: nextRun?.toISOString() ?? null,
      is_active: true,
      created_by: params.created_by ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data?.id }
}

export async function getRoutineTasks(activeOnly = false): Promise<{
  data?: RoutineTaskRow[]
  error?: string
}> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  let q = db.from('routine_tasks').select('*').order('next_run', { ascending: true, nullsFirst: false })
  if (activeOnly) q = q.eq('is_active', true)
  const { data, error } = await q
  if (error) return { error: error.message }
  return { data: (data ?? []) as RoutineTaskRow[] }
}

export async function getDueRoutineTasks(): Promise<{
  data?: RoutineTaskRow[]
  error?: string
}> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const now = new Date().toISOString()
  const { data, error } = await db
    .from('routine_tasks')
    .select('*')
    .eq('is_active', true)
    .lte('next_run', now)
    .order('next_run', { ascending: true })
  if (error) return { error: error.message }
  return { data: (data ?? []) as RoutineTaskRow[] }
}

export async function updateRoutineTaskLastRun(
  id: string,
  nextRun: Date
): Promise<{ error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { error } = await db
    .from('routine_tasks')
    .update({
      last_run: new Date().toISOString(),
      next_run: nextRun.toISOString(),
    })
    .eq('id', id)
  return error ? { error: error.message } : {}
}

export async function toggleRoutineTask(id: string, isActive: boolean): Promise<{ error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { error } = await db.from('routine_tasks').update({ is_active: isActive }).eq('id', id)
  return error ? { error: error.message } : {}
}

export async function deleteRoutineTask(id: string): Promise<{ error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { error } = await db.from('routine_tasks').delete().eq('id', id)
  return error ? { error: error.message } : {}
}

/** schedule + schedule_time'a göre bir sonraki çalışma anını hesapla */
export function computeNextRun(schedule: ScheduleType, scheduleTime?: string): Date | null {
  const now = new Date()
  const next = new Date(now)

  const [hour = 2, minute = 0] = (scheduleTime ?? '02:00').split(':').map(Number)
  next.setHours(hour, minute, 0, 0)

  if (schedule === 'daily') {
    if (next <= now) next.setDate(next.getDate() + 1)
    return next
  }
  if (schedule === 'weekly') {
    while (next <= now) next.setDate(next.getDate() + 7)
    return next
  }
  if (schedule === 'monthly') {
    next.setDate(1)
    if (next <= now) next.setMonth(next.getMonth() + 1)
    return next
  }
  return null
}

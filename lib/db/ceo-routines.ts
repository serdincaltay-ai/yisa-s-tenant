/**
 * YİSA-S CEO Rutin Havuzu (ceo_routines)
 */

import { getSupabaseServer } from '@/lib/supabase'

export type RoutineType = 'rapor' | 'kontrol' | 'bildirim' | 'sync'
export type ScheduleType = 'daily' | 'weekly' | 'monthly'

export interface CreateCeoRoutineParams {
  routine_name: string
  routine_type: RoutineType
  director_key: string
  command_template: string
  data_sources?: string[]
  schedule: ScheduleType
  schedule_time?: string
  created_by?: string
}

function computeNextRun(schedule: ScheduleType, scheduleTime?: string): Date | null {
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

export async function createCeoRoutine(params: CreateCeoRoutineParams): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const nextRun = computeNextRun(params.schedule, params.schedule_time)
  const { error, data } = await db
    .from('ceo_routines')
    .insert({
      routine_name: params.routine_name,
      routine_type: params.routine_type,
      director_key: params.director_key,
      command_template: params.command_template,
      data_sources: params.data_sources ?? [],
      schedule: params.schedule,
      schedule_time: params.schedule_time ?? null,
      is_active: true,
      next_run: nextRun?.toISOString() ?? null,
      created_by: params.created_by ?? null,
      approved_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { id: data?.id }
}

export async function getActiveCeoRoutines(): Promise<{ data?: unknown[]; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { data, error } = await db.from('ceo_routines').select('*').eq('is_active', true).order('next_run', { ascending: true, nullsFirst: false })
  if (error) return { error: error.message }
  return { data: data ?? [] }
}

export async function getDueCeoRoutines(): Promise<{ data?: unknown[]; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const now = new Date().toISOString()
  const { data, error } = await db.from('ceo_routines').select('*').eq('is_active', true).lte('next_run', now).order('next_run', { ascending: true })
  if (error) return { error: error.message }
  return { data: data ?? [] }
}

export async function updateCeoRoutineResult(id: string, lastResult: Record<string, unknown>, nextRun: string): Promise<{ error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { error } = await db.from('ceo_routines').update({ last_result: lastResult, last_run: new Date().toISOString(), next_run: nextRun }).eq('id', id)
  return error ? { error: error.message } : {}
}

export async function deactivateCeoRoutine(id: string): Promise<{ error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { error } = await db.from('ceo_routines').update({ is_active: false }).eq('id', id)
  return error ? { error: error.message } : {}
}

export { computeNextRun }

/**
 * CELF görevleri (v2: celf_tasks), CELF logları, Patron komutları - Supabase yazma.
 * API route'lardan çağrılır.
 *
 * v2 migration: ceo_tasks → celf_tasks, celf_logs.ceo_task_id → celf_logs.task_id
 */

import { getSupabaseServer } from '@/lib/supabase'

/** Aynı kullanıcı için bekleyen (henüz tamamlanmamış) CELF görevi sayısı. Tek bekleyen iş kuralı için. */
const PENDING_CELF_STATUSES = ['queued', 'running', 'awaiting_approval']

/** Onay Kuyruğu ile aynı kaynak: patron_commands. UI'da "bekleyen iş" bu tablodan gelir. */
export async function getPendingPatronCommandCount(
  userId: string | undefined
): Promise<{ count: number; error?: string }> {
  if (!userId) return { count: 0 }
  const db = getSupabaseServer()
  if (!db) return { count: 0, error: 'Supabase bağlantısı yok' }
  const { count, error } = await db
    .from('patron_commands')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending')
  if (error) return { count: 0, error: error.message }
  return { count: count ?? 0 }
}

/** Patron için en son bekleyen (pending) komutu getirir. Chat'te "onaylıyorum" denince bu komut onaylanır. */
export async function getLatestPendingPatronCommand(userId: string | undefined): Promise<{
  id?: string
  command?: string
  output_payload?: Record<string, unknown>
  ceo_task_id?: string | null
  error?: string
}> {
  if (!userId) return {}
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { data, error } = await db
    .from('patron_commands')
    .select('id, command, output_payload, ceo_task_id')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return { error: error.message }
  if (!data) return {}
  return {
    id: data.id as string,
    command: data.command as string | undefined,
    output_payload: (data.output_payload as Record<string, unknown>) ?? {},
    ceo_task_id: data.ceo_task_id as string | null | undefined,
  }
}

export async function getPendingCeoTaskCount(userId: string | undefined): Promise<{ count: number; error?: string }> {
  if (!userId) return { count: 0 }
  const db = getSupabaseServer()
  if (!db) return { count: 0, error: 'Supabase bağlantısı yok' }
  const { count, error } = await db
    .from('celf_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('lock_owner_user_id', userId)
    .in('status', PENDING_CELF_STATUSES)
  if (error) return { count: 0, error: error.message }
  return { count: count ?? 0 }
}

/** Aynı user_id + idempotency_key ile mevcut task var mı (retry/idempotency için). */
export async function getCeoTaskByUserAndIdempotency(
  userId: string | undefined,
  idempotencyKey: string
): Promise<{ id?: string; error?: string }> {
  if (!userId || !idempotencyKey) return {}
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { data, error } = await db
    .from('celf_tasks')
    .select('id')
    .eq('lock_owner_user_id', userId)
    .contains('output_ref', { idempotency_key: idempotencyKey })
    .limit(1)
    .maybeSingle()
  if (error) return { error: error.message }
  return { id: data?.id }
}

export async function createCeoTask(params: {
  user_id?: string
  task_description: string
  task_type: string
  director_key: string | null
  idempotency_key?: string
}): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const idempotencyKey = params.idempotency_key?.trim() || undefined

  if (idempotencyKey && params.user_id) {
    const existing = await getCeoTaskByUserAndIdempotency(params.user_id, idempotencyKey)
    if (existing.error) return { error: existing.error }
    if (existing.id) return { id: existing.id }
  }

  const insertPayload = {
    title: params.task_description.substring(0, 200),
    description: params.task_description,
    task_type: params.task_type,
    directorate: params.director_key ?? 'CCO',
    target: params.director_key ?? 'CCO',
    status: 'queued' as const,
    lock_owner_user_id: params.user_id ?? null,
    output_ref: {
      ...(idempotencyKey && { idempotency_key: idempotencyKey }),
    },
  }

  const { error, data } = await db
    .from('celf_tasks')
    .insert(insertPayload)
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505' && idempotencyKey && params.user_id) {
      const existing = await getCeoTaskByUserAndIdempotency(params.user_id, idempotencyKey)
      if (existing.id) return { id: existing.id }
    }
    return { error: error.message }
  }
  return { id: data?.id }
}

export async function updateCeoTask(
  id: string,
  updates: { status?: string; result_payload?: Record<string, unknown>; patron_command_id?: string }
): Promise<{ error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const row: Record<string, unknown> = {}
  if (updates.status) row.status = updates.status
  if (updates.result_payload) row.output_result = updates.result_payload
  if (updates.patron_command_id) {
    const existing = await db.from('celf_tasks').select('output_ref').eq('id', id).single()
    const currentRef = (existing.data?.output_ref as Record<string, unknown>) ?? {}
    row.output_ref = { ...currentRef, patron_command_id: updates.patron_command_id }
  }
  row.updated_at = new Date().toISOString()

  const { error } = await db.from('celf_tasks').update(row).eq('id', id)
  return error ? { error: error.message } : {}
}

export async function insertCelfLog(params: {
  ceo_task_id?: string
  director_key: string
  action?: string
  input_summary?: string
  output_summary?: string
  payload?: Record<string, unknown>
}): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { error, data } = await db
    .from('celf_logs')
    .insert({
      task_id: params.ceo_task_id ?? null,
      director_key: params.director_key,
      action: params.action ?? null,
      input_summary: params.input_summary ?? null,
      output_summary: params.output_summary ?? null,
      payload: params.payload ?? {},
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data?.id }
}

export async function createPatronCommand(params: {
  user_id?: string
  command: string
  ceo_task_id?: string
  output_payload?: Record<string, unknown>
}): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { error, data } = await db
    .from('patron_commands')
    .insert({
      user_id: params.user_id ?? null,
      command: params.command,
      status: 'pending',
      ceo_task_id: params.ceo_task_id ?? null,
      output_payload: params.output_payload ?? {},
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data?.id }
}

export async function getPatronCommand(id: string): Promise<{
  command?: string
  output_payload?: Record<string, unknown>
  ceo_task_id?: string | null
  error?: string
}> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { data, error } = await db
    .from('patron_commands')
    .select('command, output_payload, ceo_task_id')
    .eq('id', id)
    .single()

  if (error) return { error: error.message }
  return {
    command: data?.command as string | undefined,
    output_payload: (data?.output_payload as Record<string, unknown>) ?? {},
    ceo_task_id: data?.ceo_task_id as string | null | undefined,
  }
}

export async function updatePatronCommand(
  id: string,
  updates: {
    status?: string
    decision?: string
    decision_at?: string
    modify_text?: string
    completed_at?: string
    sonuc?: Record<string, unknown>
    durum?: string
  }
): Promise<{ error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const row: Record<string, unknown> = { ...updates }
  if (updates.status === 'approved' && !updates.completed_at) {
    row.completed_at = new Date().toISOString()
    row.durum = 'tamamlandi'
  }
  const { error } = await db.from('patron_commands').update(row).eq('id', id)
  return error ? { error: error.message } : {}
}

export async function insertAuditLog(params: {
  action: string
  entity_type?: string
  entity_id?: string
  user_id?: string
  payload?: Record<string, unknown>
}): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { error, data } = await db
    .from('audit_log')
    .insert({
      action: params.action,
      entity_type: params.entity_type ?? null,
      entity_id: params.entity_id ?? null,
      user_id: params.user_id ?? null,
      payload: params.payload ?? {},
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data?.id }
}

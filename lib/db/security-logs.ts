/**
 * YİSA-S Güvenlik Logları - security_logs (Siber Güvenlik Katman 2)
 * 4 seviye: sari, turuncu, kirmizi, acil
 */

import { getSupabaseServer } from '@/lib/supabase'

export type SecuritySeverity = 'sari' | 'turuncu' | 'kirmizi' | 'acil'

export interface CreateSecurityLogParams {
  event_type: string
  severity: SecuritySeverity
  description?: string
  user_id?: string
  ip_address?: string
  blocked?: boolean
  device?: string
  success?: boolean
}

export async function createSecurityLog(
  params: CreateSecurityLogParams
): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { error, data } = await db
    .from('security_logs')
    .insert({
      event_type: params.event_type,
      severity: params.severity,
      description: params.description ?? null,
      user_id: params.user_id ?? null,
      ip_address: params.ip_address ?? null,
      blocked: params.blocked ?? false,
      device: params.device ?? null,
      success: params.success ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data?.id }
}

export async function getSecurityLogs(limit = 100): Promise<{
  data?: { id: string; event_type: string; severity: string; description: string | null; blocked: boolean; created_at: string }[]
  error?: string
}> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { data, error } = await db
    .from('security_logs')
    .select('id, event_type, severity, description, blocked, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return { error: error.message }
  return { data: (data ?? []) as { id: string; event_type: string; severity: string; description: string | null; blocked: boolean; created_at: string }[] }
}

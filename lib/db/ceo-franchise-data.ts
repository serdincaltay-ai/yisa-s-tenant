/**
 * YİSA-S CEO Franchise Veri Havuzu (ceo_franchise_data)
 */

import { getSupabaseServer } from '@/lib/supabase'

export interface UpsertFranchiseDataParams {
  franchise_id: string
  data_type: string
  data_value: Record<string, unknown>
  period?: string
}

export async function upsertCeoFranchiseData(params: UpsertFranchiseDataParams): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { error, data } = await db
    .from('ceo_franchise_data')
    .insert({
      franchise_id: params.franchise_id,
      data_type: params.data_type,
      data_value: params.data_value,
      period: params.period ?? null,
      synced_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { id: data?.id }
}

export async function getCeoFranchiseData(franchiseId: string, dataType?: string, period?: string): Promise<{ data?: unknown[]; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  let q = db.from('ceo_franchise_data').select('*').eq('franchise_id', franchiseId)
  if (dataType) q = q.eq('data_type', dataType)
  if (period) q = q.eq('period', period)
  const { data, error } = await q.order('reported_at', { ascending: false })
  if (error) return { error: error.message }
  return { data: data ?? [] }
}

export async function getAllFranchisesSummary(dataType: string, period?: string): Promise<{ data?: unknown[]; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  let q = db.from('ceo_franchise_data').select('*').eq('data_type', dataType)
  if (period) q = q.eq('period', period)
  const { data, error } = await q.order('franchise_id')
  if (error) return { error: error.message }
  return { data: data ?? [] }
}

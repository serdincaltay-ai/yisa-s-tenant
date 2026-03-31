/**
 * YİSA-S CELF Maliyet Raporları (celf_cost_reports)
 * CELF/CFO maliyet raporu oluşturur; Patron maliyeti buradan görür.
 * Tarih: 30 Ocak 2026
 */

import { getSupabaseServer } from '@/lib/supabase'

export type CostReportType =
  | 'franchise_package'
  | 'student_tier'
  | 'robot'
  | 'veli_extra'
  | 'one_time'
  | 'monthly'
  | 'custom'

export interface CostBreakdown {
  api_cost?: number
  infra_cost?: number
  ops_cost?: number
  total_cost: number
  currency?: string
  [key: string]: unknown
}

export interface CreateCostReportParams {
  report_type: CostReportType
  period?: string
  description: string
  product_key?: string
  cost_breakdown: CostBreakdown
  director_key?: string
  created_by?: string
}

export interface CostReportRow {
  id: string
  report_type: string
  period: string | null
  description: string
  product_key: string | null
  cost_breakdown: CostBreakdown
  director_key: string | null
  created_at: string
  created_by: string | null
}

/** CELF maliyet raporu ekler (CELF/CFO tarafından çağrılır) */
export async function insertCostReport(
  params: CreateCostReportParams
): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { error, data } = await db
    .from('celf_cost_reports')
    .insert({
      report_type: params.report_type,
      period: params.period ?? null,
      description: params.description,
      product_key: params.product_key ?? null,
      cost_breakdown: params.cost_breakdown,
      director_key: params.director_key ?? 'CFO',
      created_by: params.created_by ?? null,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { id: data?.id }
}

/** Maliyet raporlarını listeler (Patron paneli için) */
export async function getCostReports(params?: {
  report_type?: CostReportType
  product_key?: string
  limit?: number
}): Promise<{ data?: CostReportRow[]; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  let q = db
    .from('celf_cost_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(params?.limit ?? 100)
  if (params?.report_type) q = q.eq('report_type', params.report_type)
  if (params?.product_key) q = q.eq('product_key', params.product_key)
  const { data, error } = await q
  if (error) return { error: error.message }
  return { data: (data ?? []) as CostReportRow[] }
}

/** Ürün kalemi için en güncel maliyet raporu */
export async function getLatestCostReportByProduct(
  product_key: string
): Promise<{ data?: CostReportRow; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { data, error } = await db
    .from('celf_cost_reports')
    .select('*')
    .eq('product_key', product_key)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return { error: error.message }
  return { data: data as CostReportRow | undefined }
}

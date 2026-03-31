/**
 * YİSA-S CEO Kural Havuzu (ceo_rules)
 */

import { getSupabaseServer } from '@/lib/supabase'

export type CeoRuleType = 'validation' | 'automation' | 'restriction' | 'notification'

export interface CreateCeoRuleParams {
  rule_name: string
  rule_type: CeoRuleType
  applies_to?: string[]
  condition: Record<string, unknown>
  action: Record<string, unknown>
  priority?: number
  created_by?: string
}

export async function addCeoRule(params: CreateCeoRuleParams): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { error, data } = await db
    .from('ceo_rules')
    .insert({
      rule_name: params.rule_name,
      rule_type: params.rule_type,
      applies_to: params.applies_to ?? [],
      condition: params.condition,
      action: params.action,
      priority: params.priority ?? 5,
      is_active: true,
      created_by: params.created_by ?? null,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { id: data?.id }
}

export async function getCeoRules(activeOnly = true): Promise<{ data?: unknown[]; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  let q = db.from('ceo_rules').select('*').order('priority', { ascending: true })
  if (activeOnly) q = q.eq('is_active', true)
  const { data, error } = await q
  if (error) return { error: error.message }
  return { data: data ?? [] }
}

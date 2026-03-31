/**
 * YİSA-S CEO Şablon Havuzu (ceo_templates)
 */

import { getSupabaseServer } from '@/lib/supabase'

export type TemplateType = 'rapor' | 'dashboard' | 'ui' | 'email' | 'bildirim'

export interface SaveCeoTemplateParams {
  template_name: string
  template_type: TemplateType
  director_key?: string
  content: Record<string, unknown>
  variables?: string[]
  data_sources?: string[]
  is_approved?: boolean
  approved_by?: string
}

export async function saveCeoTemplate(params: SaveCeoTemplateParams): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { error, data } = await db
    .from('ceo_templates')
    .insert({
      template_name: params.template_name,
      template_type: params.template_type,
      director_key: params.director_key ?? null,
      content: params.content,
      variables: params.variables ?? [],
      data_sources: params.data_sources ?? [],
      is_approved: params.is_approved ?? false,
      approved_by: params.approved_by ?? null,
      approved_at: params.is_approved ? new Date().toISOString() : null,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { id: data?.id }
}

export async function getCeoTemplate(id: string): Promise<{ data?: unknown; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { data, error } = await db.from('ceo_templates').select('*').eq('id', id).single()
  if (error) return { error: error.message }
  return { data }
}

export async function approveCeoTemplate(id: string, approvedBy: string): Promise<{ error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { error } = await db.from('ceo_templates').update({ is_approved: true, approved_by: approvedBy, approved_at: new Date().toISOString() }).eq('id', id)
  return error ? { error: error.message } : {}
}

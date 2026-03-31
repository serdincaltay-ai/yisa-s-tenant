/**
 * YİSA-S Direktörlük Kuralları (director_rules) — Dinamik CELF görevlendirme
 * Güncelleme sadece Patron onayı ile; rutine bağlanamaz.
 * Tarih: 30 Ocak 2026
 */

import { getSupabaseServer } from '@/lib/supabase'
import type { DirectorKey } from '@/lib/robots/celf-center'
import type { CelfAIProvider } from '@/lib/robots/celf-center'

export interface DirectorRuleRow {
  id: string
  director_key: string
  data_access: string[]
  read_only: string[]
  protected_data: string[]
  requires_approval: string[]
  has_veto: boolean
  ai_providers: string[]
  triggers: string[]
  updated_at: string
}

/** Veritabanından tüm director_rules kayıtlarını alır (dinamik override için) */
export async function getDirectorRulesFromDb(): Promise<{
  data?: Record<string, DirectorRuleRow>
  error?: string
}> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { data, error } = await db
    .from('director_rules')
    .select('id, director_key, data_access, read_only, protected_data, requires_approval, has_veto, ai_providers, triggers, updated_at')
  if (error) return { error: error.message }
  const byKey: Record<string, DirectorRuleRow> = {}
  for (const row of data ?? []) {
    byKey[row.director_key] = row as DirectorRuleRow
  }
  return { data: byKey }
}

/** Tek direktörlük için DB kuralı (varsa) */
export async function getDirectorRuleByKey(directorKey: string): Promise<{
  data?: DirectorRuleRow
  error?: string
}> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { data, error } = await db
    .from('director_rules')
    .select('*')
    .eq('director_key', directorKey)
    .maybeSingle()
  if (error) return { error: error.message }
  return { data: data as DirectorRuleRow | undefined }
}

export interface UpsertDirectorRuleParams {
  director_key: string
  ai_providers?: string[]
  triggers?: string[]
  data_access?: string[]
  read_only?: string[]
  protected_data?: string[]
  requires_approval?: string[]
  has_veto?: boolean
  /** Patron onayı gerekir — API tarafında patron_approved: true ile çağrılmalı */
}

/**
 * director_rules günceller veya ekler.
 * NOT: Çağıran taraf Patron onayı almış olmalı; bu fonksiyon sadece DB yazar.
 * Rutin görev ile çağrılmaz; sadece Patron onayı sonrası.
 */
export async function upsertDirectorRule(params: UpsertDirectorRuleParams): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const {
    director_key,
    ai_providers = [],
    triggers = [],
    data_access = [],
    read_only = [],
    protected_data = [],
    requires_approval = [],
    has_veto = false,
  } = params
  const { error, data } = await db
    .from('director_rules')
    .upsert(
      {
        director_key,
        ai_providers,
        triggers,
        data_access,
        read_only,
        protected_data,
        requires_approval,
        has_veto,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'director_key' }
    )
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { id: data?.id }
}

/**
 * CELF Kasa - Gelir/gider kayıtları
 * Satış yapıldığında gelir buraya yazılır.
 */

import { getSupabaseServer } from '@/lib/supabase'

export interface CelfKasaRow {
  id: string
  hareket_tipi: 'gelir' | 'gider'
  aciklama: string
  tutar: number
  para_birimi: string
  referans_tipi?: string
  referans_id?: string
  franchise_id?: string
  tenant_id?: string
  kaynak?: string
  odeme_tarihi?: string
  created_at: string
}

export interface RecordKasaParams {
  hareket_tipi: 'gelir' | 'gider'
  aciklama: string
  tutar: number
  para_birimi?: string
  referans_tipi?: string
  referans_id?: string
  franchise_id?: string
  tenant_id?: string
  kaynak?: string
}

/** Kasa hareketi kaydet (satış geliri veya gider) */
export async function recordKasaHareket(
  params: RecordKasaParams
): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { error, data } = await db
    .from('celf_kasa')
    .insert({
      hareket_tipi: params.hareket_tipi,
      aciklama: params.aciklama,
      tutar: params.tutar,
      para_birimi: params.para_birimi ?? 'TRY',
      referans_tipi: params.referans_tipi ?? null,
      referans_id: params.referans_id ?? null,
      franchise_id: params.franchise_id ?? null,
      tenant_id: params.tenant_id ?? null,
      kaynak: params.kaynak ?? null,
      odeme_tarihi: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { id: data?.id }
}

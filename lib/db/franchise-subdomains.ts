/**
 * Franchise subdomain'leri — Asistan komutla eklenebilir
 */

import { getSupabaseServer } from '@/lib/supabase'

let cachedList: string[] | null = null
let cacheTime = 0
const CACHE_TTL_MS = 60_000 // 1 dakika

/** Tüm aktif subdomain'leri getir (cache'li) */
export async function getFranchiseSubdomains(): Promise<string[]> {
  const now = Date.now()
  if (cachedList && now - cacheTime < CACHE_TTL_MS) return cachedList

  const db = getSupabaseServer()
  if (!db) return ['bjktuzlacimnastik', 'fenerbahceatasehir', 'feneratasehir', 'kartalcimnastik']

  const { data } = await db
    .from('franchise_subdomains')
    .select('subdomain')
    .order('created_at', { ascending: true })

  const list = (data ?? []).map((r) => String(r.subdomain).toLowerCase()).filter(Boolean)
  cachedList = list.length > 0 ? list : ['bjktuzlacimnastik', 'fenerbahceatasehir', 'feneratasehir', 'kartalcimnastik']
  cacheTime = now
  return cachedList
}

/** Yeni subdomain ekle — Patron veya asistan komutu */
export async function addFranchiseSubdomain(params: {
  subdomain: string
  franchise_name?: string
  tenant_id?: string
  created_by?: string
}): Promise<{ ok: boolean; error?: string }> {
  const slug = params.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!slug || slug.length < 3) return { ok: false, error: 'Subdomain en az 3 karakter olmalı' }

  const db = getSupabaseServer()
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok' }

  const { error } = await db.from('franchise_subdomains').insert({
    subdomain: slug,
    franchise_name: params.franchise_name ?? slug,
    tenant_id: params.tenant_id ?? null,
    created_by: params.created_by ?? null,
  })

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Bu subdomain zaten kayıtlı' }
    return { ok: false, error: error.message }
  }

  cachedList = null
  return { ok: true }
}

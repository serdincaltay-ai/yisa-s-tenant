/**
 * YİSA-S Patron Satış Fiyatları (patron_sales_prices)
 * Patron maliyet raporuna göre satış fiyatı belirler.
 * Tarih: 30 Ocak 2026
 */

import { getSupabaseServer } from '@/lib/supabase'

export interface SalesPriceRow {
  id: string
  product_key: string
  display_name: string
  description: string | null
  cost_report_id: string | null
  sales_price_amount: number
  currency: string
  effective_from: string
  effective_to: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface SetSalesPriceParams {
  product_key: string
  display_name: string
  description?: string
  cost_report_id?: string
  sales_price_amount: number
  currency?: string
  approved_by?: string
}

/** Patron satış fiyatı belirler veya günceller (Patron onayı ile çağrılır) */
export async function setSalesPrice(
  params: SetSalesPriceParams
): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const now = new Date().toISOString()
  const { error, data } = await db
    .from('patron_sales_prices')
    .upsert(
      {
        product_key: params.product_key,
        display_name: params.display_name,
        description: params.description ?? null,
        cost_report_id: params.cost_report_id ?? null,
        sales_price_amount: params.sales_price_amount,
        currency: params.currency ?? 'USD',
        approved_by: params.approved_by ?? null,
        approved_at: now,
        updated_at: now,
      },
      { onConflict: 'product_key' }
    )
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { id: data?.id }
}

/** Tüm satış fiyatlarını listeler (Patron paneli + demo fiyat gösterme) */
export async function getSalesPrices(params?: {
  product_key?: string
  limit?: number
}): Promise<{ data?: SalesPriceRow[]; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  let q = db
    .from('patron_sales_prices')
    .select('*')
    .order('product_key', { ascending: true })
    .limit(params?.limit ?? 200)
  if (params?.product_key) q = q.eq('product_key', params.product_key)
  const { data, error } = await q
  if (error) return { error: error.message }
  return { data: (data ?? []) as SalesPriceRow[] }
}

/** Tek ürün için geçerli satış fiyatı */
export async function getSalesPriceByProduct(
  product_key: string
): Promise<{ data?: SalesPriceRow; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }
  const { data, error } = await db
    .from('patron_sales_prices')
    .select('*')
    .eq('product_key', product_key)
    .maybeSingle()
  if (error) return { error: error.message }
  return { data: data as SalesPriceRow | undefined }
}

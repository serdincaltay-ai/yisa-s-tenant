/**
 * Push Notification Abonelikleri — push_subscriptions tablosu
 * Kullanıcı bazlı Web Push subscription yönetimi
 */

import { getSupabaseServer } from '@/lib/supabase'

export interface PushSubscriptionRow {
  id: string
  user_id: string
  endpoint: string
  keys_p256dh: string
  keys_auth: string
  created_at: string
}

/**
 * Push subscription kaydet veya güncelle (upsert by endpoint)
 */
export async function upsertPushSubscription(params: {
  user_id: string
  endpoint: string
  keys_p256dh: string
  keys_auth: string
}): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { data, error } = await db
    .from('push_subscriptions')
    .upsert(
      {
        user_id: params.user_id,
        endpoint: params.endpoint,
        keys_p256dh: params.keys_p256dh,
        keys_auth: params.keys_auth,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    )
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data?.id }
}

/**
 * Kullanıcının tüm push subscription'larını getir
 */
export async function getUserSubscriptions(
  userId: string
): Promise<{ data?: PushSubscriptionRow[]; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { data, error } = await db
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data: (data ?? []) as PushSubscriptionRow[] }
}

/**
 * Bir push subscription'ı sil (endpoint + user_id ile — IDOR koruması)
 */
export async function deletePushSubscription(
  endpoint: string,
  userId: string
): Promise<{ error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { error } = await db
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_id', userId)

  if (error) return { error: error.message }
  return {}
}

/**
 * Bildirim tercihleri kaydet/güncelle
 */
export async function upsertNotificationPreferences(params: {
  user_id: string
  yoklama_sonucu: boolean
  odeme_hatirlatma: boolean
  duyuru: boolean
  belge_uyari?: boolean
  haftalik_rapor?: boolean
}): Promise<{ error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { error } = await db
    .from('notification_preferences')
    .upsert(
      {
        user_id: params.user_id,
        yoklama_sonucu: params.yoklama_sonucu,
        odeme_hatirlatma: params.odeme_hatirlatma,
        duyuru: params.duyuru,
        belge_uyari: params.belge_uyari ?? true,
        haftalik_rapor: params.haftalik_rapor ?? true,
      },
      { onConflict: 'user_id' }
    )

  if (error) return { error: error.message }
  return {}
}

/**
 * Kullanıcının bildirim tercihlerini getir
 */
export async function getNotificationPreferences(userId: string): Promise<{
  data?: { yoklama_sonucu: boolean; odeme_hatirlatma: boolean; duyuru: boolean; belge_uyari: boolean; haftalik_rapor: boolean }
  error?: string
}> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { data, error } = await db
    .from('notification_preferences')
    .select('yoklama_sonucu, odeme_hatirlatma, duyuru, belge_uyari, haftalik_rapor')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') return { error: error.message }
  return {
    data: data
      ? { yoklama_sonucu: data.yoklama_sonucu, odeme_hatirlatma: data.odeme_hatirlatma, duyuru: data.duyuru, belge_uyari: data.belge_uyari ?? true, haftalik_rapor: data.haftalik_rapor ?? true }
      : { yoklama_sonucu: true, odeme_hatirlatma: true, duyuru: true, belge_uyari: true, haftalik_rapor: true },
  }
}

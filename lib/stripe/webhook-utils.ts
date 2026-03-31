/**
 * Stripe Webhook yardımcı fonksiyonları
 * - İdempotency guard (aynı event tekrar işlenmez)
 * - Event loglama (audit trail)
 * - Hata yönetimi yardımcıları
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface WebhookEventLog {
  stripe_event_id: string
  event_type: string
  stripe_session_id: string | null
  status: 'processing' | 'processed' | 'skipped' | 'error'
  metadata: Record<string, unknown>
  error_message?: string | null
  created_at?: string
}

/**
 * Aynı stripe_event_id daha önce başarıyla işlenmiş mi kontrol eder.
 * webhook_events tablosu yoksa false döner (graceful degradation).
 */
export async function isEventAlreadyProcessed(
  service: SupabaseClient,
  stripeEventId: string
): Promise<boolean> {
  try {
    const { data, error } = await service
      .from('stripe_webhook_events')
      .select('id')
      .eq('stripe_event_id', stripeEventId)
      .in('status', ['processed'])
      .limit(1)

    if (error) {
      // Tablo yoksa (42P01) veya başka hata → idempotency kontrolü atla
      console.warn('[webhook-utils] idempotency check atlanamadi:', error.message)
      return false
    }

    return (data?.length ?? 0) > 0
  } catch {
    return false
  }
}

/**
 * Webhook event kaydı oluşturur / günceller.
 * stripe_webhook_events tablosu yoksa sessizce atlar.
 */
export async function logWebhookEvent(
  service: SupabaseClient,
  log: WebhookEventLog
): Promise<void> {
  try {
    const { error } = await service
      .from('stripe_webhook_events')
      .upsert(
        {
          stripe_event_id: log.stripe_event_id,
          event_type: log.event_type,
          stripe_session_id: log.stripe_session_id,
          status: log.status,
          metadata: log.metadata,
          error_message: log.error_message ?? null,
          created_at: log.created_at ?? new Date().toISOString(),
        },
        { onConflict: 'stripe_event_id' }
      )

    if (error) {
      // Tablo yoksa loglama atla — ana akışı etkilememeli
      console.warn('[webhook-utils] event log yazilamadi:', error.message)
    }
  } catch {
    // Sessiz hata — loglama başarısızlığı ödeme akışını durdurmamalı
  }
}

/**
 * Geçici (transient) hataları ayırt eder.
 * Geçici hata → 500 dönülmeli (Stripe retry yapabilir).
 * Kalıcı hata → 200 dönülmeli (retry döngüsü önlenir).
 */
export function isTransientError(error: unknown): boolean {
  if (!error) return false

  // Handle Error instances, plain objects with .message (Supabase/Postgrest), and strings
  let message: string
  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    message = String((error as { message: unknown }).message)
  } else {
    message = String(error)
  }
  const lower = message.toLowerCase()

  const transientPatterns = [
    'timeout',
    'econnrefused',
    'econnreset',
    'network',
    'socket hang up',
    'too many requests',
    '429',
    '503',
    'service unavailable',
    'temporarily unavailable',
  ]

  return transientPatterns.some((p) => lower.includes(p))
}

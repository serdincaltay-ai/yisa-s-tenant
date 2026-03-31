/**
 * SSOT — Vitrin Bildirim Yardımcısı
 *
 * Tenant verisi değiştiğinde vitrin cache'ini invalidate etmek için
 * /api/webhooks/vitrin-sync endpoint'ine istek gönderir.
 *
 * Kullanım:
 *   import { notifyVitrinChange } from '@/lib/ssot/notify-vitrin'
 *   await notifyVitrinChange({ event: 'tenant.updated', tenantId, slug })
 */

import type { TenantChangeWebhookPayload } from '@/types/ssot'

const VITRIN_SYNC_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/vitrin-sync`
  : process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/vitrin-sync`
    : 'https://app.yisa-s.com/api/webhooks/vitrin-sync'

const WEBHOOK_SECRET = process.env.SSOT_WEBHOOK_SECRET || ''

/**
 * Tenant değişikliğini vitrin'e bildir (non-blocking).
 * Hata fırlatmaz — sadece log yazar.
 */
export async function notifyVitrinChange(
  payload: Omit<TenantChangeWebhookPayload, 'timestamp'>
): Promise<boolean> {
  try {
    const fullPayload: TenantChangeWebhookPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
    }

    const res = await fetch(VITRIN_SYNC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(WEBHOOK_SECRET ? { 'x-webhook-secret': WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify(fullPayload),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      console.warn('[notifyVitrinChange] Webhook failed:', res.status)
      return false
    }

    return true
  } catch (err) {
    console.warn('[notifyVitrinChange] Error:', err)
    return false
  }
}

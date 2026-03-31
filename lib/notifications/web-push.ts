/**
 * Web Push Notification altyapısı
 * VAPID key yönetimi ve push gönderimi
 */

// web-push has no TypeScript types
// eslint-disable-next-line @typescript-eslint/no-require-imports
const webpush = require('web-push') as {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void
  sendNotification: (
    subscription: PushSubscriptionData,
    payload: string,
    options?: { TTL?: number }
  ) => Promise<{ statusCode: number; body: string }>
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export type NotificationType = 'yoklama_sonucu' | 'odeme_hatirlatma' | 'duyuru' | 'belge_uyari' | 'haftalik_rapor'

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  yoklama_sonucu: 'Yoklama Sonucu',
  odeme_hatirlatma: 'Ödeme Hatırlatma',
  duyuru: 'Duyuru',
  belge_uyari: 'Belge Geçerlilik Uyarısı',
  haftalik_rapor: 'Haftalık Rapor',
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:info@yisa-s.com'

let configured = false

function ensureConfigured(): boolean {
  if (configured) return true
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[WebPush] VAPID anahtarları tanımlanmamış. NEXT_PUBLIC_VAPID_PUBLIC_KEY ve VAPID_PRIVATE_KEY gerekli.')
    return false
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  configured = true
  return true
}

export interface PushPayload {
  title: string
  body: string
  notification_type: NotificationType
  url?: string
  data?: Record<string, unknown>
}

/**
 * Tek bir aboneliğe push bildirimi gönder
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ ok: boolean; error?: string }> {
  if (!ensureConfigured()) {
    return { ok: false, error: 'VAPID anahtarları yapılandırılmamış' }
  }

  try {
    const payloadStr = JSON.stringify({
      title: payload.title,
      body: payload.body,
      notification_type: payload.notification_type,
      url: payload.url ?? '/veli/bildirimler',
      data: payload.data,
    })

    await webpush.sendNotification(subscription, payloadStr, { TTL: 60 * 60 })
    return { ok: true }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return { ok: false, error: err }
  }
}

/**
 * VAPID public key'i döndür (client tarafında kullanım için)
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY
}

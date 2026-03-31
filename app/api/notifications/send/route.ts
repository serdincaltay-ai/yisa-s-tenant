/**
 * POST /api/notifications/send
 * Belirli bir kullanıcıya push bildirim gönder
 * Sadece Patron veya yetkili roller kullanabilir
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePatronOrFlow } from '@/lib/auth/api-auth'
import { getUserSubscriptions, getNotificationPreferences } from '@/lib/db/push-subscriptions'
import {
  sendPushNotification,
  type NotificationType,
  type PushSubscriptionData,
} from '@/lib/notifications/web-push'

export const dynamic = 'force-dynamic'

const VALID_TYPES: NotificationType[] = ['yoklama_sonucu', 'odeme_hatirlatma', 'duyuru', 'belge_uyari', 'haftalik_rapor']

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePatronOrFlow()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()

    const userId = typeof body.user_id === 'string' ? body.user_id.trim() : ''
    const notificationType = body.notification_type as NotificationType
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const notifBody = typeof body.body === 'string' ? body.body.trim() : ''
    const url = typeof body.url === 'string' ? body.url : undefined

    if (!userId) {
      return NextResponse.json({ error: 'user_id alanı gerekli.' }, { status: 400 })
    }

    if (!VALID_TYPES.includes(notificationType)) {
      return NextResponse.json(
        { error: `Geçersiz bildirim türü. Geçerli türler: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!title) {
      return NextResponse.json({ error: 'title alanı gerekli.' }, { status: 400 })
    }

    // Kullanıcının bildirim tercihlerini kontrol et
    const { data: prefs, error: prefsError } = await getNotificationPreferences(userId)
    if (prefsError) {
      return NextResponse.json({ error: 'Bildirim tercihleri kontrol edilemedi.' }, { status: 500 })
    }
    if (prefs && !prefs[notificationType]) {
      return NextResponse.json(
        { ok: false, error: 'Kullanıcı bu bildirim türünü devre dışı bırakmış.' },
        { status: 200 }
      )
    }

    // Kullanıcının subscription'larını getir
    const { data: subscriptions, error: subError } = await getUserSubscriptions(userId)

    if (subError) {
      return NextResponse.json({ error: subError }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Kullanıcının aktif push aboneliği yok.' },
        { status: 404 }
      )
    }

    // Her subscription'a bildirim gönder
    const results: { endpoint: string; ok: boolean; error?: string }[] = []

    for (const sub of subscriptions) {
      const pushSub: PushSubscriptionData = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys_p256dh,
          auth: sub.keys_auth,
        },
      }

      const result = await sendPushNotification(pushSub, {
        title,
        body: notifBody,
        notification_type: notificationType,
        url,
      })

      results.push({
        endpoint: sub.endpoint.substring(0, 50) + '...',
        ok: result.ok,
        error: result.error,
      })
    }

    const basarili = results.filter((r) => r.ok).length

    return NextResponse.json({
      ok: basarili > 0,
      gonderilen: basarili,
      toplam_abonelik: subscriptions.length,
      detaylar: results,
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: 'Bildirim gönderme hatası', detail: err },
      { status: 500 }
    )
  }
}

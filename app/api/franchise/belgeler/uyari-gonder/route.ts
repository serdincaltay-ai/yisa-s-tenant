/**
 * POST /api/franchise/belgeler/uyari-gonder
 * Belirli bir sporcunun velisine belge geçerlilik uyarısı gönderir.
 * Franchise sahibi yetkisi gerektirir.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'
import {
  sendPushNotification,
  type PushSubscriptionData,
} from '@/lib/notifications/web-push'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const body = await req.json()
    const athleteId = typeof body.athlete_id === 'string' ? body.athlete_id.trim() : ''
    if (!athleteId) return NextResponse.json({ error: 'athlete_id zorunludur' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    // Sporcuyu doğrula ve veli bilgisini al
    const { data: athlete } = await service
      .from('athletes')
      .select('id, name, surname, parent_user_id, tenant_id')
      .eq('id', athleteId)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (!athlete) return NextResponse.json({ error: 'Sporcu bulunamadı' }, { status: 404 })
    if (!athlete.parent_user_id) return NextResponse.json({ error: 'Bu sporcunun veli bağlantısı yok' }, { status: 400 })

    const veliId = athlete.parent_user_id as string

    // En son sağlık kaydını bul (geçerlilik bilgisi için)
    const { data: lastRecord } = await service
      .from('athlete_health_records')
      .select('saglik_raporu_gecerlilik')
      .eq('athlete_id', athleteId)
      .not('saglik_raporu_gecerlilik', 'is', null)
      .order('saglik_raporu_gecerlilik', { ascending: false })
      .limit(1)
      .maybeSingle()

    const gecerlilik = lastRecord?.saglik_raporu_gecerlilik as string | null
    const cocukAdi = [athlete.name, athlete.surname].filter(Boolean).join(' ')

    let bodyText: string
    if (gecerlilik) {
      const gecerlilikTarih = new Date(gecerlilik + 'T00:00:00').toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
      const bugun = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00')
      const gecerlilikDate = new Date(gecerlilik + 'T00:00:00')
      if (gecerlilikDate < bugun) {
        bodyText = `${cocukAdi} adlı sporcunuzun sağlık raporunun süresi ${gecerlilikTarih} tarihinde dolmuştur. Lütfen en kısa sürede yeni sağlık raporu temin ediniz.`
      } else {
        bodyText = `${cocukAdi} adlı sporcunuzun sağlık raporunun son geçerlilik tarihi ${gecerlilikTarih}. Lütfen süresi dolmadan yeni rapor temin ediniz.`
      }
    } else {
      bodyText = `${cocukAdi} adlı sporcunuz için güncel sağlık raporu gereklidir. Lütfen en kısa sürede sağlık raporu temin ediniz.`
    }

    // Velinin bildirim tercihini kontrol et
    const { data: pref } = await service
      .from('notification_preferences')
      .select('belge_uyari')
      .eq('user_id', veliId)
      .maybeSingle()

    if (pref && pref.belge_uyari === false) {
      return NextResponse.json({ ok: false, error: 'Veli belge uyarı bildirimlerini devre dışı bırakmış.' })
    }

    // Velinin push subscription'larını getir
    const { data: subs } = await service
      .from('push_subscriptions')
      .select('endpoint, keys_p256dh, keys_auth')
      .eq('user_id', veliId)
      .eq('is_active', true)

    const typedSubs = (subs ?? []) as Array<{ endpoint: string; keys_p256dh: string; keys_auth: string }>

    if (typedSubs.length === 0) {
      return NextResponse.json({ ok: false, error: 'Velinin aktif push aboneliği yok. Bildirim gönderilemedi.' })
    }

    let gonderildi = false
    for (const sub of typedSubs) {
      const pushSub: PushSubscriptionData = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
      }

      const result = await sendPushNotification(pushSub, {
        title: 'Belge Geçerlilik Uyarısı',
        body: bodyText,
        notification_type: 'belge_uyari',
        url: '/veli/belgeler',
      })

      if (result.ok) gonderildi = true
    }

    return NextResponse.json({
      ok: gonderildi,
      mesaj: gonderildi ? 'Veliye bildirim gönderildi' : 'Bildirim gönderilemedi',
    })
  } catch (e) {
    console.error('[belgeler/uyari-gonder POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

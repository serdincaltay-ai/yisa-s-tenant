/**
 * GET /api/coo/belge-kontrol
 * Haftalık cron: Süresi dolacak veya dolmuş belgeleri tespit edip patron'a bildirim gönderir.
 * vercel.json'da haftalık (Pazartesi 08:00 UTC) olarak tanımlanır.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  sendPushNotification,
  type PushSubscriptionData,
} from '@/lib/notifications/web-push'
import { requireCronOrPatron } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

interface RecordRow {
  id: string
  athlete_id: string
  saglik_raporu_gecerlilik: string | null
  record_type: string
  athletes: { name?: string; surname?: string; tenant_id?: string } | null
}

interface SubscriptionRow {
  endpoint: string
  keys_p256dh: string
  keys_auth: string
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireCronOrPatron(req)
    if (auth instanceof NextResponse) return auth

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: 'Sunucu yapılandırma hatası' }, { status: 500 })
    }

    const service = createServiceClient(url, key)

    const bugun = new Date()
    const otuzGunSonra = new Date(bugun)
    otuzGunSonra.setDate(otuzGunSonra.getDate() + 30)
    const bugunStr = bugun.toISOString().slice(0, 10)
    const otuzGunStr = otuzGunSonra.toISOString().slice(0, 10)

    // Süresi dolmuş veya 30 gün içinde dolacak kayıtları bul
    const { data: records, error: recErr } = await service
      .from('athlete_health_records')
      .select('id, athlete_id, saglik_raporu_gecerlilik, record_type, athletes(name, surname, tenant_id)')
      .not('saglik_raporu_gecerlilik', 'is', null)
      .lte('saglik_raporu_gecerlilik', otuzGunStr)
      .order('saglik_raporu_gecerlilik', { ascending: true })

    if (recErr) {
      console.error('[belge-kontrol] Sorgu hatası:', recErr.message)
      return NextResponse.json({ error: recErr.message }, { status: 500 })
    }

    const typedRecords = (records ?? []) as unknown as RecordRow[]

    if (typedRecords.length === 0) {
      return NextResponse.json({ ok: true, bildirim_sayisi: 0, mesaj: 'Süresi dolacak belge yok' })
    }

    // Gecikmiş ve yaklaşan olarak ayır
    const gecmis = typedRecords.filter((r) => r.saglik_raporu_gecerlilik && r.saglik_raporu_gecerlilik < bugunStr)
    const yaklasan = typedRecords.filter((r) => r.saglik_raporu_gecerlilik && r.saglik_raporu_gecerlilik >= bugunStr)

    // Tenant bazında grupla
    const tenantMap = new Map<string, RecordRow[]>()
    for (const r of typedRecords) {
      const tid = r.athletes?.tenant_id
      if (!tid) continue
      const list = tenantMap.get(tid) ?? []
      list.push(r)
      tenantMap.set(tid, list)
    }

    // Her tenant'ın sahibine (owner) bildirim gönder
    let bildirilenToplam = 0

    for (const [tenantId, tenantRecords] of tenantMap) {
      // Tenant owner'ını bul
      const { data: ownerRows } = await service
        .from('user_tenants')
        .select('user_id')
        .eq('tenant_id', tenantId)
        .eq('role', 'owner')
        .limit(1)

      const ownerId = (ownerRows ?? [])[0]?.user_id as string | undefined
      if (!ownerId) continue

      // Owner'ın push subscription'larını getir
      const { data: subs } = await service
        .from('push_subscriptions')
        .select('endpoint, keys_p256dh, keys_auth')
        .eq('user_id', ownerId)
        .eq('is_active', true)

      const typedSubs = (subs ?? []) as SubscriptionRow[]
      if (typedSubs.length === 0) continue

      const gecmisCount = tenantRecords.filter((r) => r.saglik_raporu_gecerlilik && r.saglik_raporu_gecerlilik < bugunStr).length
      const yaklasanCount = tenantRecords.length - gecmisCount

      const sporcuIsimleri = tenantRecords
        .slice(0, 5)
        .map((r) => {
          const a = r.athletes
          return a ? `${a.name ?? ''} ${a.surname ?? ''}`.trim() : '—'
        })
        .join(', ')

      const title = 'Belge Geçerlilik Uyarısı'
      const body = [
        gecmisCount > 0 ? `${gecmisCount} belgenin süresi dolmuş` : '',
        yaklasanCount > 0 ? `${yaklasanCount} belge 30 gün içinde dolacak` : '',
      ].filter(Boolean).join(', ') + `. Sporcular: ${sporcuIsimleri}${tenantRecords.length > 5 ? '...' : ''}`

      for (const sub of typedSubs) {
        const pushSub: PushSubscriptionData = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
        }

        const result = await sendPushNotification(pushSub, {
          title,
          body,
          notification_type: 'belge_uyari',
          url: '/franchise/belgeler',
        })

        if (result.ok) bildirilenToplam++
      }
    }

    return NextResponse.json({
      ok: true,
      bildirim_sayisi: bildirilenToplam,
      toplam_kayit: typedRecords.length,
      gecmis: gecmis.length,
      yaklasan: yaklasan.length,
      tenant_sayisi: tenantMap.size,
      tarih: bugunStr,
    })
  } catch (e) {
    console.error('[belge-kontrol]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

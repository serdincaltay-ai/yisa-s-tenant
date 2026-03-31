/**
 * POST /api/sms/send
 * Manuel SMS gönderimi — sadece Patron veya yetkili roller
 * Body: { to: string, message: string, trigger_type?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePatronOrFlow } from '@/lib/auth/api-auth'
import { sendSMS, isSmsConfigured } from '@/lib/sms/provider'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const MAX_MESSAGE_LEN = 480 // SMS segment sınırı (Türkçe karakter ile ~2 segment)

// --- Basit in-memory rate limiter ---
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 dakika pencere
const RATE_LIMIT_MAX = 10 // Pencere başına maks istek
const rateBuckets = new Map<string, { count: number; resetAt: number }>()
let rateBucketCleanCounter = 0

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePatronOrFlow()
    if (auth instanceof NextResponse) return auth

    if (!isSmsConfigured()) {
      return NextResponse.json(
        { error: 'SMS servisi yapılandırılmamış. Lütfen sistem yöneticinize başvurun.' },
        { status: 503 }
      )
    }

    // Rate limiting — kullanıcı başına dakikada maks RATE_LIMIT_MAX istek
    const userId = auth.user.id
    const now = Date.now()
    const bucket = rateBuckets.get(userId)
    if (bucket && now < bucket.resetAt) {
      if (bucket.count >= RATE_LIMIT_MAX) {
        return NextResponse.json(
          { error: `Çok fazla istek. Lütfen ${Math.ceil((bucket.resetAt - now) / 1000)} saniye bekleyin.` },
          { status: 429 }
        )
      }
      bucket.count++
    } else {
      rateBuckets.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    }

    // Süresi dolmuş bucket'ları temizle (her 100 istekte bir)
    if (++rateBucketCleanCounter % 100 === 0) {
      for (const [key, val] of rateBuckets) {
        if (now >= val.resetAt) rateBuckets.delete(key)
      }
    }

    const tenantId = await getTenantIdWithFallback(userId, req)

    const body = await req.json()
    const to = typeof body.to === 'string' ? body.to.trim() : ''
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const triggerType = typeof body.trigger_type === 'string' ? body.trigger_type : 'manual'

    if (!to) {
      return NextResponse.json({ error: 'Telefon numarası (to) gerekli.' }, { status: 400 })
    }

    if (!message) {
      return NextResponse.json({ error: 'Mesaj içeriği (message) gerekli.' }, { status: 400 })
    }

    if (message.length > MAX_MESSAGE_LEN) {
      return NextResponse.json(
        { error: `Mesaj çok uzun. Maksimum ${MAX_MESSAGE_LEN} karakter.` },
        { status: 400 }
      )
    }

    const result = await sendSMS(to, message, {
      tenant_id: tenantId ?? undefined,
      trigger_type: triggerType,
    })

    if (result.ok) {
      return NextResponse.json({ ok: true, sid: result.sid })
    }

    return NextResponse.json({ error: result.error ?? 'SMS gönderilemedi' }, { status: 500 })
  } catch (e) {
    console.error('[api/sms/send]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

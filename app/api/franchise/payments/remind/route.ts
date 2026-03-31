import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

/**
 * Aidat hatırlatma — Bekleyen/gecikmiş ödemeler için app-yisa-s SMS/aidat-reminder API tetiği.
 * Body: { payment_ids?: string[] } (seçili kayıtlar) veya boş (tüm bekleyen/gecikmiş).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const paymentIds = Array.isArray(body.payment_ids) ? body.payment_ids.filter((id: unknown) => typeof id === 'string') : []

    const appYisaUrl = process.env.APP_YISA_S_API_URL ?? process.env.NEXT_PUBLIC_APP_YISA_S_API_URL
    const aidatReminderPath = process.env.APP_YISA_S_AIDAT_REMINDER_PATH ?? '/api/reminder/aidat'

    if (!appYisaUrl) {
      return NextResponse.json({ ok: false, error: 'Hatırlatma servisi yapılandırılmamış (APP_YISA_S_API_URL)' }, { status: 503 })
    }

    const base = appYisaUrl.replace(/\/$/, '')
    const path = aidatReminderPath.startsWith('/') ? aidatReminderPath : `/${aidatReminderPath}`

    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenantId,
        payment_ids: paymentIds.length > 0 ? paymentIds : undefined,
        target: paymentIds.length === 0 ? 'overdue_and_pending' : undefined,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.warn('[franchise/payments/remind] app-yisa-s yanıt:', res.status, errText)
      return NextResponse.json({ ok: false, error: 'Hatırlatma servisi yanıt vermedi' }, { status: 502 })
    }

    const data = await res.json().catch(() => ({}))
    return NextResponse.json({ ok: true, message: 'Hatırlatma tetiklendi', ...data })
  } catch (e) {
    console.error('[franchise/payments/remind]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

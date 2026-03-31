import { NextRequest, NextResponse } from 'next/server'
import type { TenantChangeWebhookPayload, WebhookResponse } from '@/types/ssot'

export const dynamic = 'force-dynamic'

/**
 * SSOT Vitrin Sync Webhook
 *
 * POST /api/webhooks/vitrin-sync
 *
 * Tenant verisi değiştiğinde vitrin (yisa-s.com) cache'ini invalidate eder.
 * Bu endpoint tenant-yisa-s içinden çağrılır (tenant update sonrası).
 *
 * Akış:
 *   1. Tenant güncellenir (franchise/tenant PATCH, provisioning, vb.)
 *   2. Bu endpoint çağrılır
 *   3. yisa-s.com'un /api/webhooks/tenant-sync endpoint'ine POST gönderilir
 *   4. Vitrin cache'i invalidate olur (revalidate-on-demand)
 */

const VITRIN_WEBHOOK_URL = process.env.VITRIN_WEBHOOK_URL || 'https://www.yisa-s.com/api/webhooks/tenant-sync'
const WEBHOOK_SECRET = process.env.SSOT_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  try {
    // Basit güvenlik kontrolü
    const authHeader = req.headers.get('x-webhook-secret') ?? ''
    if (!WEBHOOK_SECRET || authHeader !== WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false, revalidated: [], error: 'Yetkisiz' } satisfies WebhookResponse, { status: 401 })
    }

    const body = await req.json() as Partial<TenantChangeWebhookPayload>

    if (!body.tenantId || !body.slug || !body.event) {
      return NextResponse.json(
        { ok: false, revalidated: [], error: 'tenantId, slug ve event alanları zorunlu' } satisfies WebhookResponse,
        { status: 400 }
      )
    }

    const payload: TenantChangeWebhookPayload = {
      event: body.event,
      tenantId: body.tenantId,
      slug: body.slug,
      changedFields: body.changedFields ?? [],
      timestamp: new Date().toISOString(),
    }

    // Vitrin'e webhook gönder
    const revalidated: string[] = []

    try {
      const vitrinResponse = await fetch(VITRIN_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': WEBHOOK_SECRET,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      })

      if (vitrinResponse.ok) {
        const vitrinResult = await vitrinResponse.json() as WebhookResponse
        revalidated.push(...(vitrinResult.revalidated ?? []))
      } else {
        console.warn('[vitrin-sync] Vitrin webhook failed:', vitrinResponse.status)
      }
    } catch (fetchErr) {
      // Vitrin erişilemezse log yaz ama hata fırlatma (non-fatal)
      console.warn('[vitrin-sync] Vitrin webhook unreachable:', fetchErr)
    }

    return NextResponse.json({
      ok: true,
      revalidated,
    } satisfies WebhookResponse)
  } catch (e) {
    console.error('[vitrin-sync]', e)
    return NextResponse.json(
      { ok: false, revalidated: [], error: 'Sunucu hatası' } satisfies WebhookResponse,
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { getSupabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST /api/notifications/subscribe
 * Registers a push subscription for the authenticated user.
 *
 * Body: {
 *   subscription: PushSubscription (endpoint, keys.p256dh, keys.auth)
 *   tenant_id?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const userId = auth.user.id

    const body = await req.json()
    const subscription = body.subscription
    const tenantId = typeof body.tenant_id === 'string' ? body.tenant_id : null

    if (
      !subscription ||
      typeof subscription.endpoint !== 'string' ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      return NextResponse.json(
        { error: 'Geçersiz subscription nesnesi. endpoint, keys.p256dh ve keys.auth gerekli.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServer()
    if (!supabase) {
      return NextResponse.json({ error: 'Sunucu yapılandırma hatası.' }, { status: 500 })
    }

    // Upsert: aynı endpoint varsa güncelle (kullanıcı değişse bile), yoksa ekle
    const { error: upsertErr } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          tenant_id: tenantId,
          endpoint: subscription.endpoint,
          keys_p256dh: subscription.keys.p256dh,
          keys_auth: subscription.keys.auth,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      )

    if (upsertErr) {
      console.error('[notifications/subscribe] Upsert error:', upsertErr)
      return NextResponse.json({ error: 'Abonelik kaydı sırasında hata.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'Push aboneliği kaydedildi.' })
  } catch (e) {
    console.error('[notifications/subscribe] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}

/**
 * DELETE /api/notifications/subscribe
 * Removes a push subscription.
 *
 * Body: { endpoint: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const endpoint = typeof body.endpoint === 'string' ? body.endpoint : null

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint gerekli.' }, { status: 400 })
    }

    const supabase = getSupabaseServer()
    if (!supabase) {
      return NextResponse.json({ error: 'Sunucu yapılandırma hatası.' }, { status: 500 })
    }

    // Soft-delete: mark as inactive (IDOR koruması: user_id filtresi)
    const { error: deleteErr } = await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('endpoint', endpoint)
      .eq('user_id', auth.user.id)

    if (deleteErr) {
      console.error('[notifications/subscribe] DELETE update error:', deleteErr)
      return NextResponse.json({ error: 'Abonelik kaldırma sırasında hata.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'Push aboneliği kaldırıldı.' })
  } catch (e) {
    console.error('[notifications/subscribe] DELETE error:', e)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}

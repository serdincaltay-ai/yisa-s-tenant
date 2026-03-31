/**
 * PATCH /api/franchise/onaylar/[id]
 * Body: { aksiyon: 'onayla' | 'reddet', karar_notu?: string }
 * Sadece franchise_mudur, mudur, patron rolleri onaylayabilir.
 * franchise_approval_queue: durum, karar_veren_user_id, karar_tarihi, karar_notu güncellenir.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const YETKILI_ROLLER = ['franchise_mudur', 'mudur', 'patron', 'owner', 'admin', 'manager', 'tesis_muduru']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = (await req.json()) as { aksiyon?: string; karar_notu?: string }
    const aksiyon = body.aksiyon === 'onayla' ? 'onayla' : body.aksiyon === 'reddet' ? 'reddet' : null
    if (!aksiyon) return NextResponse.json({ error: "aksiyon: 'onayla' veya 'reddet' gerekli" }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    const { data: staffRow, error: staffErr } = await service
      .from('staff')
      .select('id, role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (staffErr || !staffRow) return NextResponse.json({ error: 'Personel kaydı bulunamadı' }, { status: 403 })

    const role = (staffRow as { role: string | null }).role ?? ''
    const yetkili = YETKILI_ROLLER.some((r) => role.toLowerCase() === r.toLowerCase())
    const { data: ut } = await service.from('user_tenants').select('role').eq('user_id', user.id).eq('tenant_id', tenantId).maybeSingle()
    const utRole = (ut as { role?: string } | null)?.role ?? ''
    const yetkiliUt = ['owner', 'admin', 'manager', 'patron', 'tesis_muduru'].some((r) => utRole.toLowerCase() === r.toLowerCase())
    if (!yetkili && !yetkiliUt) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok (sadece yetkili/müdür)' }, { status: 403 })
    }

    const { data: row, error: findErr } = await service
      .from('franchise_approval_queue')
      .select('id, durum')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (findErr || !row) return NextResponse.json({ error: 'Talep bulunamadı' }, { status: 404 })
    if ((row as { durum: string }).durum !== 'bekliyor') {
      return NextResponse.json({ error: 'Talep zaten işlenmiş' }, { status: 400 })
    }

    const karar_notu = typeof body.karar_notu === 'string' ? body.karar_notu.trim() || null : null
    const now = new Date().toISOString()

    if (aksiyon === 'onayla') {
      const { error: updErr } = await service
        .from('franchise_approval_queue')
        .update({
          durum: 'onaylandi',
          karar_veren_user_id: user.id,
          karar_tarihi: now,
          karar_notu,
          guncelleme_tarihi: now,
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    const { error: updErr } = await service
      .from('franchise_approval_queue')
      .update({
        durum: 'reddedildi',
        karar_veren_user_id: user.id,
        karar_tarihi: now,
        karar_notu,
        guncelleme_tarihi: now,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/onaylar PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

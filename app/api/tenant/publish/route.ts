/**
 * POST /api/tenant/publish
 * Yayın engeli kontrolü — zorunlu slotlar dolu değilse site yayına açılmaz.
 * Zorunlu slotlar: hero, program, kayit, iletisim, cta
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'
import { REQUIRED_SLOT_KEYS } from '@/lib/templates/slot-definitions'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    // Tenant'ın aktif slotlarını getir
    const { data: slots } = await service
      .from('tenant_template_slots')
      .select('slot_key, icerik, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    const filledSlots = (slots ?? []).filter(s => {
      const icerik = s.icerik as Record<string, unknown> | null
      return icerik && Object.keys(icerik).length > 0
    })
    const filledKeys = filledSlots.map(s => s.slot_key as string)

    // Zorunlu slotlardan eksik olanları bul
    const missingSlots = REQUIRED_SLOT_KEYS.filter(k => !filledKeys.includes(k))

    if (missingSlots.length > 0) {
      return NextResponse.json({
        ok: false,
        publishable: false,
        missing_slots: missingSlots,
        error: `Yayın için zorunlu slotlar eksik: ${missingSlots.join(', ')}`,
      }, { status: 422 })
    }

    // Yayın onayı — tenant durumunu güncelle
    const { error: updateErr } = await service
      .from('tenants')
      .update({
        durum: 'yayinda',
        published_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', tenantId)

    if (updateErr) {
      return NextResponse.json({ error: 'Yayın durumu güncellenemedi: ' + updateErr.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      publishable: true,
      message: 'Site başarıyla yayına alındı!',
    })
  } catch (e) {
    console.error('[tenant/publish] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

/** GET: Yayınlanabilirlik durumunu kontrol et */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    // Slotları getir
    const { data: slots } = await service
      .from('tenant_template_slots')
      .select('slot_key, slot_title, icerik, is_active, sira')
      .eq('tenant_id', tenantId)
      .order('sira', { ascending: true })

    const filledSlots = (slots ?? []).filter(s => {
      const icerik = s.icerik as Record<string, unknown> | null
      return s.is_active && icerik && Object.keys(icerik).length > 0
    })
    const filledKeys = filledSlots.map(s => s.slot_key as string)
    const missingSlots = REQUIRED_SLOT_KEYS.filter(k => !filledKeys.includes(k))

    return NextResponse.json({
      ok: true,
      publishable: missingSlots.length === 0,
      missing_slots: missingSlots,
      slots: slots ?? [],
      total_slots: slots?.length ?? 0,
      filled_slots: filledSlots.length,
    })
  } catch (e) {
    console.error('[tenant/publish GET] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

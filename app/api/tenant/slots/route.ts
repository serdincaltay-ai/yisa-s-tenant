/**
 * GET/PUT /api/tenant/slots
 * Tenant'ın template slotlarını listele ve güncelle
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

/** GET: Tenant'ın tüm slotlarını listele */
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

    const { data: slots, error } = await service
      .from('tenant_template_slots')
      .select('id, slot_key, slot_title, icerik, sira, is_active, template_id, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .order('sira', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Slotlar getirilemedi: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, slots: slots ?? [] })
  } catch (e) {
    console.error('[tenant/slots GET] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

/** PUT: Bir slot'un içeriğini güncelle */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 400 })

    const body = await req.json()
    const { slot_key, icerik, is_active } = body as {
      slot_key: string
      icerik?: Record<string, unknown>
      is_active?: boolean
    }

    if (!slot_key) {
      return NextResponse.json({ error: 'slot_key gerekli' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (icerik !== undefined) updateData.icerik = icerik
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: updated, error } = await service
      .from('tenant_template_slots')
      .update(updateData)
      .eq('tenant_id', tenantId)
      .eq('slot_key', slot_key)
      .select('id, slot_key, slot_title, icerik, is_active, sira')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Slot güncellenemedi: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, slot: updated })
  } catch (e) {
    console.error('[tenant/slots PUT] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

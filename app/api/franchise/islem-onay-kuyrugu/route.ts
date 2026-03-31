/**
 * GET /api/franchise/islem-onay-kuyrugu
 * List franchise işlem onay kuyruğu (franchise_islem_onay_kuyrugu).
 * Query: ?durum=bekliyor|onaylandi|reddedildi
 * RLS/tenant: getTenantIdWithFallback.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export type IslemOnayItem = {
  id: string
  tenant_id: string
  islem_tipi: string
  talep_eden_staff_id: string
  talep_eden_ad: string | null
  musteri_id: string | null
  musteri_ad: string | null
  islem_detay: Record<string, unknown>
  mesaj: string | null
  durum: string
  onaylayan_staff_id: string | null
  onay_tarihi: string | null
  created_at: string
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const durum = req.nextUrl.searchParams.get('durum')?.trim()
    const service = createServiceClient(url, key)

    let q = service
      .from('franchise_islem_onay_kuyrugu')
      .select('id, tenant_id, islem_tipi, talep_eden_staff_id, talep_eden_ad, musteri_id, musteri_ad, islem_detay, mesaj, durum, onaylayan_staff_id, onay_tarihi, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (durum && ['bekliyor', 'onaylandi', 'reddedildi'].includes(durum)) {
      q = q.eq('durum', durum)
    }

    const { data, error } = await q
    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({ items: (data ?? []) as IslemOnayItem[] })
  } catch (e) {
    console.error('[franchise/islem-onay-kuyrugu GET]', e)
    return NextResponse.json({ items: [] })
  }
}

/**
 * POST /api/franchise/islem-onay-kuyrugu
 * Yeni işlem onay talebi oluştur. talep_eden_staff_id = current user'ın staff kaydı.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const body = await req.json()
    const islem_tipi = typeof body.islem_tipi === 'string' && ['paket_ekleme', 'yeni_uye', 'indirim', 'iade'].includes(body.islem_tipi) ? body.islem_tipi : null
    const musteri_id = typeof body.musteri_id === 'string' ? body.musteri_id.trim() || null : null
    const musteri_ad = typeof body.musteri_ad === 'string' ? body.musteri_ad.trim() || null : null
    const islem_detay = body.islem_detay != null && typeof body.islem_detay === 'object' ? body.islem_detay : {}
    const mesaj = typeof body.mesaj === 'string' ? body.mesaj.trim() || null : null

    if (!islem_tipi) return NextResponse.json({ error: 'islem_tipi zorunludur (paket_ekleme, yeni_uye, indirim, iade)' }, { status: 400 })

    const service = createServiceClient(url, key)
    const { data: staffRow } = await service
      .from('staff')
      .select('id, name, surname')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!staffRow?.id) return NextResponse.json({ error: 'Bu kullanıcı için personel kaydı bulunamadı' }, { status: 403 })

    const talep_eden_ad = [staffRow.name, staffRow.surname].filter(Boolean).join(' ').trim() || null

    const { data: row, error } = await service
      .from('franchise_islem_onay_kuyrugu')
      .insert({
        tenant_id: tenantId,
        islem_tipi,
        talep_eden_staff_id: staffRow.id,
        talep_eden_ad,
        musteri_id: musteri_id || null,
        musteri_ad: musteri_ad || null,
        islem_detay: islem_detay as Record<string, unknown>,
        mesaj: mesaj || null,
        durum: 'bekliyor',
      })
      .select('id, islem_tipi, durum, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: row })
  } catch (e) {
    console.error('[franchise/islem-onay-kuyrugu POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

/**
 * POST /api/franchise/market/satis
 * Body: { product_id, miktar, musteri_id? }
 * Stok düş, market_stock_movements'a kaydet
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = (await req.json()) as { product_id?: string; miktar?: number; musteri_id?: string }
    const product_id = typeof body.product_id === 'string' ? body.product_id.trim() : null
    const miktar = typeof body.miktar === 'number' ? Math.floor(body.miktar) : 0
    if (!product_id || miktar <= 0) return NextResponse.json({ error: 'product_id ve miktar (pozitif) gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    const { data: product, error: pErr } = await service
      .from('market_products')
      .select('id, stok_miktari, satis_fiyati')
      .eq('id', product_id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (pErr || !product) return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })

    const stok = Number((product as { stok_miktari: number }).stok_miktari) ?? 0
    if (stok < miktar) return NextResponse.json({ error: 'Yetersiz stok' }, { status: 400 })

    const birim_fiyat = Number((product as { satis_fiyati: number }).satis_fiyati) ?? 0
    const toplam_tutar = Math.round(birim_fiyat * miktar * 100) / 100

    const { error: updErr } = await service
      .from('market_products')
      .update({ stok_miktari: stok - miktar })
      .eq('id', product_id)
      .eq('tenant_id', tenantId)

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    const { error: movErr } = await service
      .from('market_stock_movements')
      .insert({
        tenant_id: tenantId,
        product_id,
        hareket_tipi: 'satis',
        miktar: -miktar,
        birim_fiyat,
        toplam_tutar,
        aciklama: body.musteri_id ? `Müşteri: ${body.musteri_id}` : null,
        islem_yapan: user.id,
      })

    if (movErr) return NextResponse.json({ error: movErr.message }, { status: 500 })
    return NextResponse.json({ ok: true, toplam_tutar })
  } catch (e) {
    console.error('[franchise/market/satis]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

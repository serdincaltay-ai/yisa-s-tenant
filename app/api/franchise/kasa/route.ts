/**
 * Kasa defteri: listele, yeni kayıt
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [], bugunOzet: null })

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const tur = searchParams.get('tur')
    const kategori = searchParams.get('kategori')
    const bugun = new Date().toISOString().slice(0, 10)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [], bugunOzet: null })

    const service = createServiceClient(url, key)

    let query = service.from('cash_register').select('*').eq('tenant_id', tenantId).order('tarih', { ascending: false }).order('created_at', { ascending: false })
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) query = query.gte('tarih', from)
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) query = query.lte('tarih', to)
    if (tur === 'gelir' || tur === 'gider') query = query.eq('tur', tur)
    if (kategori) query = query.eq('kategori', kategori)

    const { data: items } = await query.limit(200)

    const { data: bugunKayitlar } = await service
      .from('cash_register')
      .select('tur, tutar')
      .eq('tenant_id', tenantId)
      .eq('tarih', bugun)

    let toplamGelir = 0
    let toplamGider = 0
    for (const r of bugunKayitlar ?? []) {
      const t = Number(r.tutar) || 0
      if (r.tur === 'gelir') toplamGelir += t
      else toplamGider += t
    }

    return NextResponse.json({
      items: items ?? [],
      bugunOzet: { toplamGelir, toplamGider, net: toplamGelir - toplamGider, tarih: bugun },
    })
  } catch (e) {
    console.error('[franchise/kasa GET]', e)
    return NextResponse.json({ items: [], bugunOzet: null })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json()
    const tur = body.tur === 'gider' ? 'gider' : 'gelir'
    const kategori = ['aidat', 'ders_ucreti', 'kira', 'maas', 'malzeme', 'diger'].includes(body.kategori) ? body.kategori : 'diger'
    const aciklama = typeof body.aciklama === 'string' ? body.aciklama.trim() : ''
    const tutar = Math.abs(Number(body.tutar) || 0)
    const odeme_yontemi = ['nakit', 'havale', 'kart'].includes(body.odeme_yontemi) ? body.odeme_yontemi : 'nakit'
    const tarih = typeof body.tarih === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.tarih) ? body.tarih : new Date().toISOString().slice(0, 10)

    if (tutar <= 0) return NextResponse.json({ error: 'Tutar 0\'dan büyük olmalı' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { error } = await service.from('cash_register').insert({
      tenant_id: tenantId,
      tarih,
      tur,
      kategori,
      aciklama,
      tutar,
      odeme_yontemi,
      kaydeden_id: user.id,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/kasa POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

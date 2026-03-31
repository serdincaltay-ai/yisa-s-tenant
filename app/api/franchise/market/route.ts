/**
 * GET/POST /api/franchise/market
 * GET: Ürün listesi (kategori filtreli)
 * POST: Yeni ürün ekle
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const KATEGORILER = ['icecek', 'gida', 'ekipman', 'aksesuar'] as const
const HAREKET_TIPLERI = ['giris', 'satis', 'iade', 'fire'] as const

export type MarketProductRow = {
  id: string
  tenant_id: string
  kategori: string
  urun_adi: string
  barkod: string | null
  stok_miktari: number
  satis_fiyati: number
  alis_fiyati: number | null
  is_active: boolean
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

    const service = createServiceClient(url, key)
    const kategori = req.nextUrl.searchParams.get('kategori')?.trim()

    let q = service
      .from('market_products')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('urun_adi')

    if (kategori && KATEGORILER.includes(kategori as (typeof KATEGORILER)[number])) {
      q = q.eq('kategori', kategori)
    }

    const { data, error } = await q
    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({ items: (data ?? []) as MarketProductRow[] })
  } catch (e) {
    console.error('[franchise/market GET]', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = (await req.json()) as Record<string, unknown>
    const kategori = typeof body.kategori === 'string' && KATEGORILER.includes(body.kategori as (typeof KATEGORILER)[number]) ? body.kategori : 'gida'
    const urun_adi = typeof body.urun_adi === 'string' ? body.urun_adi.trim() : ''
    if (!urun_adi) return NextResponse.json({ error: 'urun_adi gerekli' }, { status: 400 })

    const barkod = typeof body.barkod === 'string' ? body.barkod.trim() || null : null
    const stok_miktari = typeof body.stok_miktari === 'number' ? Math.max(0, Math.floor(body.stok_miktari)) : 0
    const satis_fiyati = typeof body.satis_fiyati === 'number' && body.satis_fiyati >= 0 ? Number(body.satis_fiyati) : 0
    const alis_fiyati = typeof body.alis_fiyati === 'number' && body.alis_fiyati >= 0 ? Number(body.alis_fiyati) : null
    const is_active = typeof body.is_active === 'boolean' ? body.is_active : true

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data: row, error } = await service
      .from('market_products')
      .insert({
        tenant_id: tenantId,
        kategori,
        urun_adi,
        barkod,
        stok_miktari,
        satis_fiyati,
        alis_fiyati,
        is_active,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: (row as { id: string })?.id })
  } catch (e) {
    console.error('[franchise/market POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

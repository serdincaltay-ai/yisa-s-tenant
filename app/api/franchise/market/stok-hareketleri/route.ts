/**
 * GET /api/franchise/market/stok-hareketleri
 * Query: ?product_id=xxx&son_gun=30
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export type StockMovementRow = {
  id: string
  product_id: string
  hareket_tipi: string
  miktar: number
  birim_fiyat: number | null
  toplam_tutar: number | null
  aciklama: string | null
  created_at: string
  urun_adi?: string
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

    const product_id = req.nextUrl.searchParams.get('product_id')?.trim() ?? null
    const son_gun = parseInt(req.nextUrl.searchParams.get('son_gun') ?? '30', 10)
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - Math.max(1, Math.min(365, son_gun)))
    const from = fromDate.toISOString().slice(0, 10) + 'T00:00:00'

    const service = createServiceClient(url, key)
    let q = service
      .from('market_stock_movements')
      .select('id, product_id, hareket_tipi, miktar, birim_fiyat, toplam_tutar, aciklama, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', from)
      .order('created_at', { ascending: false })
      .limit(200)

    if (product_id) q = q.eq('product_id', product_id)

    const { data: rows, error } = await q
    if (error) return NextResponse.json({ items: [], error: error.message })

    const list = (rows ?? []) as Array<Record<string, unknown>>
    const productIds = [...new Set(list.map((r) => r.product_id as string))]
    const nameMap: Record<string, string> = {}
    if (productIds.length > 0) {
      const { data: products } = await service
        .from('market_products')
        .select('id, urun_adi')
        .in('id', productIds)
      for (const p of products ?? []) {
        const row = p as { id: string; urun_adi: string }
        nameMap[row.id] = row.urun_adi ?? '—'
      }
    }

    const items: StockMovementRow[] = list.map((r) => ({
      id: r.id as string,
      product_id: r.product_id as string,
      hareket_tipi: r.hareket_tipi as string,
      miktar: Number(r.miktar) ?? 0,
      birim_fiyat: r.birim_fiyat != null ? Number(r.birim_fiyat) : null,
      toplam_tutar: r.toplam_tutar != null ? Number(r.toplam_tutar) : null,
      aciklama: (r.aciklama as string | null) ?? null,
      created_at: r.created_at as string,
      urun_adi: nameMap[r.product_id as string] ?? '—',
    }))

    return NextResponse.json({ items })
  } catch (e) {
    console.error('[franchise/market/stok-hareketleri]', e)
    return NextResponse.json({ items: [] })
  }
}

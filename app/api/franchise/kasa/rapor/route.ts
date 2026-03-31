/**
 * Kasa aylık rapor: gelir-gider grafiği, kategori dağılımı
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
    if (!tenantId) return NextResponse.json({ aylik: [], kategoriler: [] })

    const { searchParams } = new URL(req.url)
    const yil = parseInt(searchParams.get('yil') ?? String(new Date().getFullYear()), 10)
    const ayMin = 1
    const ayMax = 12

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ aylik: [], kategoriler: [] })

    const service = createServiceClient(url, key)
    const from = `${yil}-01-01`
    const to = `${yil}-12-31`

    const { data: kayitlar } = await service
      .from('cash_register')
      .select('tarih, tur, kategori, tutar')
      .eq('tenant_id', tenantId)
      .gte('tarih', from)
      .lte('tarih', to)

    const aylik: Array<{ ay: number; gelir: number; gider: number; net: number }> = []
    for (let ay = 1; ay <= 12; ay++) {
      aylik.push({ ay, gelir: 0, gider: 0, net: 0 })
    }

    const kategoriler: Record<string, { gelir: number; gider: number }> = {}

    for (const r of kayitlar ?? []) {
      const ay = parseInt(String(r.tarih).slice(5, 7), 10)
      if (ay >= 1 && ay <= 12) {
        const t = Number(r.tutar) || 0
        if (r.tur === 'gelir') {
          aylik[ay - 1].gelir += t
          const k = r.kategori ?? 'diger'
          if (!kategoriler[k]) kategoriler[k] = { gelir: 0, gider: 0 }
          kategoriler[k].gelir += t
        } else {
          aylik[ay - 1].gider += t
          const k = r.kategori ?? 'diger'
          if (!kategoriler[k]) kategoriler[k] = { gelir: 0, gider: 0 }
          kategoriler[k].gider += t
        }
      }
    }

    for (const a of aylik) {
      a.net = a.gelir - a.gider
    }

    const kategorilerListe = Object.entries(kategoriler).map(([ad, v]) => ({
      kategori: ad,
      gelir: v.gelir,
      gider: v.gider,
    }))

    return NextResponse.json({ aylik, kategoriler: kategorilerListe, yil })
  } catch (e) {
    console.error('[franchise/kasa/rapor]', e)
    return NextResponse.json({ aylik: [], kategoriler: [] })
  }
}

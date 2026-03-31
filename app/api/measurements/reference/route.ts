/**
 * GET /api/measurements/reference
 * Yas grubu bazli referans degerleri getir
 * Query params: yas (number), brans (string, opsiyonel)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      return NextResponse.json({ error: 'Sunucu yapılandırma hatası' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const yasStr = searchParams.get('yas')
    const brans = searchParams.get('brans') || 'genel'

    if (!yasStr) {
      return NextResponse.json({ error: 'yas parametresi gerekli' }, { status: 400 })
    }

    const yas = parseInt(yasStr, 10)
    if (isNaN(yas) || yas < 3 || yas > 25) {
      return NextResponse.json({ error: 'Geçersiz yaş değeri' }, { status: 400 })
    }

    const service = createClient(url, key)

    // Brans bazli referanslari getir
    let query = service
      .from('measurement_reference_ranges')
      .select('*')
      .lte('yas_min', yas)
      .gte('yas_max', yas)

    if (brans && brans !== 'genel') {
      // Brans bazli + genel referanslari birlikte getir
      query = query.in('brans', [brans, 'genel'])
    } else {
      query = query.eq('brans', 'genel')
    }

    const { data: referanslar, error } = await query

    if (error) {
      console.error('[measurements/reference GET]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Brans bazli olanlar oncelikli
    const gruplu: Record<string, {
      parametre: string
      parametre_label: string
      birim: string
      deger_min: number
      deger_max: number
      brans: string
    }> = {}

    for (const r of referanslar ?? []) {
      const key = r.parametre
      // Brans-specific referans varsa onu kullan, yoksa genel
      if (!gruplu[key] || r.brans !== 'genel') {
        gruplu[key] = {
          parametre: r.parametre,
          parametre_label: r.parametre_label,
          birim: r.birim,
          deger_min: Number(r.deger_min),
          deger_max: Number(r.deger_max),
          brans: r.brans,
        }
      }
    }

    // Yas grubunu belirle
    let yasGrubu = ''
    if (yas >= 6 && yas <= 8) yasGrubu = '6-8'
    else if (yas >= 9 && yas <= 11) yasGrubu = '9-11'
    else if (yas >= 12 && yas <= 14) yasGrubu = '12-14'
    else if (yas >= 15 && yas <= 17) yasGrubu = '15-17'

    return NextResponse.json({
      yas,
      yas_grubu: yasGrubu,
      brans,
      referanslar: Object.values(gruplu),
    })
  } catch (e) {
    console.error('[measurements/reference GET]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

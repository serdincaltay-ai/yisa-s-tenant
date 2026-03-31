/**
 * POST /api/measurements/validate
 * Girilen degeri yas grubuna gore dogrula
 * Body: { parametre, deger, yas, brans? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { degerDogrula } from '@/lib/measurements/reference-ranges'
import { requireAuth } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const { parametre, deger, yas, brans } = body

    if (!parametre || deger == null || yas == null) {
      return NextResponse.json(
        { error: 'parametre, deger ve yas alanları gerekli' },
        { status: 400 }
      )
    }

    const degerNum = Number(deger)
    const yasNum = Number(yas)

    if (isNaN(degerNum) || isNaN(yasNum)) {
      return NextResponse.json({ error: 'Geçersiz sayısal değer' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    let referansMin: number | null = null
    let referansMax: number | null = null

    if (url && key) {
      const service = createClient(url, key)

      // Brans bazli referans ara
      const bransFilter = brans && brans !== 'genel' ? [brans, 'genel'] : ['genel']
      const { data: refs } = await service
        .from('measurement_reference_ranges')
        .select('*')
        .eq('parametre', parametre)
        .lte('yas_min', yasNum)
        .gte('yas_max', yasNum)
        .in('brans', bransFilter)
        .order('brans', { ascending: false }) // brans-specific once gelsin

      if (refs && refs.length > 0) {
        // Brans-specific varsa onu kullan
        const ref = refs.find((r: { brans: string }) => r.brans !== 'genel') ?? refs[0]
        referansMin = Number(ref.deger_min)
        referansMax = Number(ref.deger_max)
      }
    }

    if (referansMin == null || referansMax == null) {
      return NextResponse.json({
        parametre,
        deger: degerNum,
        durum: 'bilinmiyor',
        mesaj: 'Bu parametre için referans değeri bulunamadı',
        referans_min: null,
        referans_max: null,
        renk: 'yesil',
      })
    }

    const sonuc = degerDogrula(parametre, degerNum, referansMin, referansMax)

    return NextResponse.json(sonuc)
  } catch (e) {
    console.error('[measurements/validate POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

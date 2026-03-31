/**
 * Antrenör: Bugünkü dersler — saate göre gruplu, her dersin öğrenci listesi
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const GUN_MAP: Record<number, string> = {
  0: 'Pazar', 1: 'Pazartesi', 2: 'Sali', 3: 'Carsamba', 4: 'Persembe', 5: 'Cuma', 6: 'Cumartesi',
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' })

    const service = createServiceClient(url, key)
    const bugunGun = GUN_MAP[new Date().getDay()] ?? 'Pazartesi'

    // Bugünün dersleri
    const { data: schedules } = await service
      .from('tenant_schedule')
      .select('id, gun, saat, ders_adi, brans')
      .eq('tenant_id', tenantId)
      .eq('gun', bugunGun)
      .order('saat')

    const dersler = schedules ?? []

    // Antrenöre atanmış tüm sporcuları tek seferde getir (N+1 sorgu yerine)
    const { data: allAthletes } = await service
      .from('athletes')
      .select('id, name, surname, level, "group", branch')
      .eq('tenant_id', tenantId)
      .eq('coach_user_id', user.id)

    const athleteList = allAthletes ?? []

    // Her ders için ilgili sporcuları eşleştir
    const derslerWithStudents = dersler.map((ders) => {
      const sporcular = athleteList.filter(
        (a) => !ders.brans || !a.branch || a.branch === ders.brans
      )
      return { ...ders, sporcular }
    })

    // Saate göre grupla
    const grouped: Record<string, typeof derslerWithStudents> = {}
    for (const ders of derslerWithStudents) {
      const saat = ders.saat ?? 'Belirsiz'
      if (!grouped[saat]) grouped[saat] = []
      grouped[saat].push(ders)
    }

    return NextResponse.json({
      gun: bugunGun,
      tarih: new Date().toISOString().slice(0, 10),
      dersler: derslerWithStudents,
      saatGruplari: grouped,
    })
  } catch (e) {
    console.error('[antrenor/bugunku-dersler]', e)
    return NextResponse.json({ error: 'Sunucu hatası' })
  }
}

/**
 * GET /api/measurements/ilk-olcum-kontrol?athlete_id=XXX
 * Sporcunun ilk olcumunun yapilip yapilmadigini kontrol et
 *
 * POST /api/measurements/ilk-olcum-kontrol
 * Ilk olcum randevusu olustur
 * Body: { athlete_id, randevu_tarihi? }
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
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const athleteId = searchParams.get('athlete_id')
    if (!athleteId) return NextResponse.json({ error: 'athlete_id gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    // Sporcu bilgisi
    const { data: athlete } = await service
      .from('athletes')
      .select('id, name, surname, birth_date, gender, ilk_olcum_yapildi, ilk_olcum_tarihi')
      .eq('id', athleteId)
      .eq('tenant_id', tenantId)
      .single()

    if (!athlete) return NextResponse.json({ error: 'Sporcu bulunamadı' }, { status: 404 })

    // Mevcut olcum sayisi
    const { count: olcumSayisi } = await service
      .from('athlete_measurements')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)
      .eq('tenant_id', tenantId)

    // Bekleyen randevu
    const { data: randevu } = await service
      .from('measurement_appointments')
      .select('*')
      .eq('athlete_id', athleteId)
      .eq('tenant_id', tenantId)
      .eq('durum', 'bekliyor')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const ilkOlcumYapildi = athlete.ilk_olcum_yapildi === true || (olcumSayisi ?? 0) > 0

    return NextResponse.json({
      athlete_id: athleteId,
      ilk_olcum_yapildi: ilkOlcumYapildi,
      ilk_olcum_tarihi: athlete.ilk_olcum_tarihi,
      olcum_sayisi: olcumSayisi ?? 0,
      bekleyen_randevu: randevu ?? null,
      uyari: ilkOlcumYapildi
        ? null
        : 'Bu sporcu için henüz ilk ölçüm yapılmamış. Ölçüm yapılmadan derse başlayamaz.',
    })
  } catch (e) {
    console.error('[measurements/ilk-olcum-kontrol GET]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
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
    const { athlete_id, randevu_tarihi } = body
    if (!athlete_id) return NextResponse.json({ error: 'athlete_id gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    // Sporcu tenant kontrolu
    const { data: athlete } = await service
      .from('athletes')
      .select('id, name, surname')
      .eq('id', athlete_id)
      .eq('tenant_id', tenantId)
      .single()

    if (!athlete) return NextResponse.json({ error: 'Sporcu bulunamadı' }, { status: 404 })

    // Randevu olustur
    const tarih = randevu_tarihi || new Date().toISOString().slice(0, 10)
    const { data: randevu, error } = await service
      .from('measurement_appointments')
      .insert({
        tenant_id: tenantId,
        athlete_id: athlete_id,
        randevu_tarihi: tarih,
        durum: 'bekliyor',
        olusturan_id: user.id,
        notlar: `${athlete.name} ${athlete.surname ?? ''} için ilk ölçüm randevusu otomatik oluşturuldu.`,
      })
      .select('id, randevu_tarihi, durum')
      .single()

    if (error) {
      console.error('[measurements/ilk-olcum-kontrol POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      randevu,
      mesaj: `İlk ölçüm randevusu ${tarih} tarihine oluşturuldu.`,
    })
  } catch (e) {
    console.error('[measurements/ilk-olcum-kontrol POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

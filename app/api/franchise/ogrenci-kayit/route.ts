/**
 * POST /api/franchise/ogrenci-kayit
 * Hızlı sporcu kaydı: athletes INSERT + isteğe bağlı student_packages (paket_id).
 * Body: { ad, soyad, cinsiyet, sube, gsm, dogum_tarihi?, not?, paket_id? }
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
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const body = await req.json()
    const ad = typeof body.ad === 'string' ? body.ad.trim() : ''
    const soyad = typeof body.soyad === 'string' ? body.soyad.trim() : ''
    const cinsiyet = typeof body.cinsiyet === 'string' && ['E', 'K', 'diger'].includes(body.cinsiyet) ? body.cinsiyet : null
    const sube = typeof body.sube === 'string' ? body.sube.trim() || null : null
    const gsm = typeof body.gsm === 'string' ? body.gsm.trim() || null : null
    const dogumTarihi = typeof body.dogum_tarihi === 'string' && body.dogum_tarihi ? body.dogum_tarihi : null
    const not = typeof body.not === 'string' ? body.not.trim() || null : null
    const paketId = typeof body.paket_id === 'string' ? body.paket_id.trim() || null : null

    if (!ad) return NextResponse.json({ error: 'Ad zorunludur' }, { status: 400 })
    if (!soyad) return NextResponse.json({ error: 'Soyad zorunludur' }, { status: 400 })
    if (!cinsiyet) return NextResponse.json({ error: 'Cinsiyet zorunludur (E veya K)' }, { status: 400 })
    if (!sube) return NextResponse.json({ error: 'Şube zorunludur' }, { status: 400 })
    if (!gsm) return NextResponse.json({ error: 'GSM zorunludur' }, { status: 400 })

    const service = createServiceClient(url, key)

    const { data: athlete, error: athleteError } = await service
      .from('athletes')
      .insert({
        tenant_id: tenantId,
        name: ad,
        surname: soyad,
        birth_date: dogumTarihi,
        gender: cinsiyet,
        branch: sube,
        status: 'active',
        parent_phone: gsm,
        notes: not,
      } as Record<string, unknown>)
      .select('id, name, surname, created_at')
      .single()

    if (athleteError) {
      console.error('[franchise/ogrenci-kayit] athleteError:', athleteError.message)
      return NextResponse.json({ error: athleteError.message }, { status: 500 })
    }

    if (paketId && athlete?.id) {
      const { data: pkg } = await service
        .from('seans_packages')
        .select('id, seans_count')
        .eq('id', paketId)
        .eq('tenant_id', tenantId)
        .single()

      if (pkg && pkg.seans_count) {
        const today = new Date().toISOString().slice(0, 10)
        const { error: spError } = await service
          .from('student_packages')
          .insert({
            tenant_id: tenantId,
            athlete_id: athlete.id,
            package_id: paketId,
            toplam_seans: pkg.seans_count as number,
            kalan_seans: pkg.seans_count as number,
            baslangic_tarihi: today,
            status: 'aktif',
          })

        if (spError) {
          console.error('[franchise/ogrenci-kayit] student_packages insert:', spError.message)
          // Athlete already created; don't rollback, just report
        }
      }
    }

    return NextResponse.json({ ok: true, athlete })
  } catch (e) {
    console.error('[franchise/ogrenci-kayit]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

/**
 * GET /api/veli/profil-tamamla — Profil tamamlanmis mi kontrol et
 * POST /api/veli/profil-tamamla — Veli profilini kaydet/guncelle (parent_profiles)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/** GET: Profil tamamlanmis mi kontrol et */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
    const service = createServiceClient(url, key)

    // Tenant ID bul (GET icin de tenant bazli sorgulama)
    const { data: ut } = await service
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('role', 'veli')
      .maybeSingle()

    if (!ut) {
      return NextResponse.json({ ok: true, completed: false, profile: null })
    }

    const { data: profile } = await service
      .from('parent_profiles')
      .select('id, ad_soyad, telefon, email')
      .eq('user_id', user.id)
      .eq('tenant_id', ut.tenant_id)
      .maybeSingle()

    return NextResponse.json({
      ok: true,
      completed: !!profile,
      profile: profile ?? null,
    })
  } catch (e) {
    console.error('[veli/profil-tamamla GET] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}

/** POST: Veli profilini kaydet/guncelle */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
    const service = createServiceClient(url, key)

    const body = await req.json()
    const adSoyad = typeof body.ad_soyad === 'string' ? body.ad_soyad.trim() : ''
    const telefon = typeof body.telefon === 'string' ? body.telefon.trim() : null
    const email = typeof body.email === 'string' ? body.email.trim() : null
    const adres = typeof body.adres === 'string' ? body.adres.trim() : null
    const tcKimlik = typeof body.tc_kimlik === 'string' ? body.tc_kimlik.trim() : null
    const acilIletisimAdi = typeof body.acil_iletisim_adi === 'string' ? body.acil_iletisim_adi.trim() : null
    const acilIletisimTel = typeof body.acil_iletisim_tel === 'string' ? body.acil_iletisim_tel.trim() : null

    if (!adSoyad) {
      return NextResponse.json({ error: 'Ad soyad zorunludur' }, { status: 400 })
    }

    // Tenant ID bul
    const { data: ut } = await service
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('role', 'veli')
      .maybeSingle()

    if (!ut) {
      return NextResponse.json({ error: 'Tenant bulunamadi' }, { status: 400 })
    }

    const profileData = {
      user_id: user.id,
      tenant_id: ut.tenant_id,
      ad_soyad: adSoyad,
      telefon,
      email,
      adres,
      tc_kimlik: tcKimlik,
      acil_iletisim_adi: acilIletisimAdi,
      acil_iletisim_tel: acilIletisimTel,
      updated_at: new Date().toISOString(),
    }

    // Mevcut profil var mi?
    const { data: existing } = await service
      .from('parent_profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('tenant_id', ut.tenant_id)
      .maybeSingle()

    if (existing) {
      const { error: updateErr } = await service
        .from('parent_profiles')
        .update(profileData)
        .eq('id', existing.id)

      if (updateErr) {
        return NextResponse.json({ error: 'Profil guncellenemedi: ' + updateErr.message }, { status: 500 })
      }
    } else {
      const { error: insertErr } = await service
        .from('parent_profiles')
        .insert(profileData)

      if (insertErr) {
        return NextResponse.json({ error: 'Profil olusturulamadi: ' + insertErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true, message: 'Profil basariyla kaydedildi' })
  } catch (e) {
    console.error('[veli/profil-tamamla POST] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}

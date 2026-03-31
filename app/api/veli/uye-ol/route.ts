/**
 * Veli self-registration (public - login gerekmez)
 * tenant_id: x-tenant-id header (middleware)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getTenantId(req: NextRequest): string | null {
  const tid = req.headers.get('x-tenant-id')
  if (tid && /^[0-9a-f-]{36}$/i.test(String(tid).trim())) return tid.trim()
  const demo = process.env.NEXT_PUBLIC_DEMO_TENANT_ID?.trim()
  if (demo && /^[0-9a-f-]{36}$/i.test(demo)) return demo
  return null
}

export async function GET(req: NextRequest) {
  const tenantId = getTenantId(req)
  if (!tenantId) return NextResponse.json({ error: 'Tesis bulunamadı', sportsBranches: [] }, { status: 404 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

  const service = createClient(url, key)
  const { data: sportsBranches } = await service
    .from('sports_branches')
    .select('id, kod, isim, kategori')
    .order('isim')

  return NextResponse.json({ sportsBranches: sportsBranches ?? [] })
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis bulunamadı. Lütfen tesis sayfasından erişin.' }, { status: 404 })

    const body = await req.json()
    const veliAd = typeof body.veliAd === 'string' ? body.veliAd.trim() : ''
    const veliSoyad = typeof body.veliSoyad === 'string' ? body.veliSoyad.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const telefon = typeof body.telefon === 'string' ? body.telefon.trim() : ''
    const sifre = typeof body.sifre === 'string' ? body.sifre : ''
    const cocuklar = Array.isArray(body.cocuklar) ? body.cocuklar : []

    if (!veliAd || !email || !sifre) return NextResponse.json({ error: 'Ad, email ve şifre zorunludur' }, { status: 400 })
    if (sifre.length < 6) return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Geçerli email girin' }, { status: 400 })
    if (cocuklar.length === 0) return NextResponse.json({ error: 'En az bir çocuk bilgisi girin' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createClient(url, key)
    const { data: authData, error: authError } = await service.auth.admin.createUser({
      email,
      password: sifre,
      email_confirm: true,
      user_metadata: { full_name: `${veliAd} ${veliSoyad}`.trim(), name: veliAd },
    })

    if (authError) {
      if (authError.message?.includes('already') || authError.message?.includes('registered'))
        return NextResponse.json({ error: 'Bu email ile üyelik var. Giriş yapın.' }, { status: 400 })
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }
    const userId = authData?.user?.id
    if (!userId) return NextResponse.json({ error: 'Hesap oluşturulamadı' }, { status: 500 })

    const { error: utError } = await service.from('user_tenants').insert({
      user_id: userId,
      tenant_id: tenantId,
      role: 'veli',
    })
    if (utError) {
      await service.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: utError.message }, { status: 500 })
    }

    const parentName = `${veliAd} ${veliSoyad}`.trim()
    for (const c of cocuklar) {
      const ad = typeof c.ad === 'string' ? c.ad.trim() : ''
      const soyad = typeof c.soyad === 'string' ? c.soyad.trim() : ''
      const birthDate = typeof c.birth_date === 'string' && c.birth_date ? c.birth_date : null
      const gender = typeof c.gender === 'string' && ['E', 'K'].includes(c.gender) ? c.gender : null
      const branchName = typeof c.branch_name === 'string' ? c.branch_name.trim() : null
      const notes: string[] = []
      if (c.saglik_raporu) notes.push('Sağlık raporu var')
      if (c.fotograf_izni) notes.push('Fotoğraf izni var')
      if (c.video_izni) notes.push('Video izni var')
      if (c.ders_saati) notes.push(`Haftada ${c.ders_saati} saat`)
      if (c.tercih_gunler?.length) notes.push(`Tercih: ${c.tercih_gunler.join(', ')}`)

      if (!ad) continue
      await service.from('athletes').insert({
        tenant_id: tenantId,
        name: ad,
        surname: soyad || null,
        birth_date: birthDate,
        gender,
        branch: branchName,
        parent_user_id: userId,
        parent_email: email,
        parent_name: parentName,
        parent_phone: telefon || null,
        status: 'pending',
        notes: notes.length ? notes.join('; ') : null,
      })
    }

    return NextResponse.json({ ok: true, message: 'Kaydınız alındı. Tesis size dönüş yapacak.' })
  } catch (e) {
    console.error('[veli/uye-ol]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

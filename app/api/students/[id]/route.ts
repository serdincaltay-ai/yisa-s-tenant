import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function getTenantId(userId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const service = createServiceClient(url, key)
  const { data: ut } = await service
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (ut?.tenant_id) return ut.tenant_id
  const { data: t } = await service
    .from('tenants')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle()
  return t?.id ?? null
}

function validateTcKimlik(tc: string): boolean {
  if (!/^\d{11}$/.test(tc)) return false
  const digits = tc.split('').map(Number)
  const t1 = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7
  const t2 = digits[1] + digits[3] + digits[5] + digits[7]
  if ((t1 - t2) % 10 !== digits[9]) return false
  const t3 = digits.slice(0, 10).reduce((a, b) => a + b, 0)
  if (t3 % 10 !== digits[10]) return false
  return true
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 })
    return NextResponse.json(data)
  } catch (e) {
    console.error('[students GET id]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const body = await req.json()
    const adSoyad = typeof body.ad_soyad === 'string' ? body.ad_soyad.trim() : undefined
    const tcKimlik = typeof body.tc_kimlik === 'string' ? body.tc_kimlik.replace(/\D/g, '') : undefined
    const dogumTarihi = typeof body.dogum_tarihi === 'string' ? body.dogum_tarihi : undefined
    const cinsiyet = typeof body.cinsiyet === 'string' && ['E', 'K', 'diger'].includes(body.cinsiyet) ? body.cinsiyet : undefined
    const veliAdi = typeof body.veli_adi === 'string' ? body.veli_adi.trim() : undefined
    const veliTelefon = typeof body.veli_telefon === 'string' ? body.veli_telefon.trim() : undefined
    const veliEmail = typeof body.veli_email === 'string' ? body.veli_email.trim() : undefined
    const brans = typeof body.brans === 'string' ? body.brans.trim() : undefined
    const grupId = body.grup_id === null ? null : (typeof body.grup_id === 'string' && body.grup_id ? body.grup_id : undefined)
    const saglikNotu = typeof body.saglik_notu === 'string' ? body.saglik_notu.trim() : undefined

    if (adSoyad !== undefined && !adSoyad) return NextResponse.json({ error: 'Ad Soyad zorunludur' }, { status: 400 })
    if (tcKimlik !== undefined) {
      if (tcKimlik.length !== 11) return NextResponse.json({ error: 'TC Kimlik No 11 hane olmalıdır' }, { status: 400 })
      if (!validateTcKimlik(tcKimlik)) return NextResponse.json({ error: 'Geçersiz TC Kimlik No' }, { status: 400 })
    }
    if (dogumTarihi !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(dogumTarihi)) {
      return NextResponse.json({ error: 'Geçersiz doğum tarihi' }, { status: 400 })
    }
    if (veliTelefon !== undefined && veliTelefon && !/^[\d\s\+\-\(\)]{10,20}$/.test(veliTelefon)) {
      return NextResponse.json({ error: 'Geçersiz telefon formatı' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (adSoyad !== undefined) updates.ad_soyad = adSoyad
    if (tcKimlik !== undefined) updates.tc_kimlik = tcKimlik
    if (dogumTarihi !== undefined) updates.dogum_tarihi = dogumTarihi
    if (cinsiyet !== undefined) updates.cinsiyet = cinsiyet
    if (veliAdi !== undefined) updates.veli_adi = veliAdi
    if (veliTelefon !== undefined) updates.veli_telefon = veliTelefon
    if (veliEmail !== undefined) updates.veli_email = veliEmail
    if (brans !== undefined) updates.brans = brans
    if (grupId !== undefined) updates.grup_id = grupId
    if (saglikNotu !== undefined) updates.saglik_notu = saglikNotu

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('students')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .maybeSingle()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Bu TC Kimlik No zaten kayıtlı' }, { status: 400 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 })
    return NextResponse.json(data)
  } catch (e) {
    console.error('[students PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('students')
      .update({ status: 'pasif' })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id, status')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 })
    return NextResponse.json({ ok: true, student: data })
  } catch (e) {
    console.error('[students DELETE]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

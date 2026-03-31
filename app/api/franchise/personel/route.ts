/**
 * Personel yönetimi (user_tenants + auth)
 * GET: tenant_personnel_view
 * POST: Auth signUp + user_tenants INSERT
 * PATCH: role güncelle (pasif yap vb.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ROL_LABELS: Record<string, string> = {
  pasif: 'Pasif',
  tesis_muduru: 'Tesis İşletme Müdürü',
  sportif_direktor: 'Sportif Direktör',
  antrenor: 'Antrenör',
  yardimci_antrenor: 'Yardımcı Antrenör',
  kasa: 'Kasa / Kayıt Personeli',
  sekreter: 'Telefon / Karşılama',
  temizlik: 'Temizlik Personeli',
  guvenlik: 'Güvenlik Personeli',
  admin: 'Admin',
  manager: 'Tesis Müdürü',
  trainer: 'Antrenör',
  staff: 'Personel',
}

async function getTenantId(userId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const service = createServiceClient(url, key)
  const { data: ut } = await service.from('user_tenants').select('tenant_id').eq('user_id', userId).limit(1).maybeSingle()
  if (ut?.tenant_id) return ut.tenant_id
  const { data: t } = await service.from('tenants').select('id').eq('owner_id', userId).limit(1).maybeSingle()
  return t?.id ?? null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ items: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('tenant_personnel_view')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ items: [], message: 'View henüz oluşturulmadı' })
      return NextResponse.json({ items: [], error: error.message })
    }

    const items = (data ?? []).map((r: { role?: string }) => ({
      ...r,
      roleLabel: ROL_LABELS[r.role ?? ''] ?? r.role,
    }))
    return NextResponse.json({ items })
  } catch (e) {
    console.error('[franchise/personel] GET', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json()
    const ad = typeof body.ad === 'string' ? body.ad.trim() : ''
    const soyad = typeof body.soyad === 'string' ? body.soyad.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const rol = typeof body.rol === 'string' && body.rol.trim() ? body.rol.trim() : 'antrenor'

    if (!ad || !email) return NextResponse.json({ error: 'Ad ve email zorunludur' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Geçerli email girin' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const tempPassword = 'Demo123!' + Math.random().toString(36).slice(-4)

    const { data: authData, error: authError } = await service.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: `${ad} ${soyad}`.trim(), name: ad },
    })

    if (authError) {
      if (authError.message?.includes('already been registered')) return NextResponse.json({ error: 'Bu email zaten kayıtlı' }, { status: 400 })
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }
    const newUserId = authData?.user?.id
    if (!newUserId) return NextResponse.json({ error: 'Kullanıcı oluşturulamadı' }, { status: 500 })

    const { error: utError } = await service.from('user_tenants').insert({
      user_id: newUserId,
      tenant_id: tenantId,
      role: rol,
    })

    if (utError) {
      await service.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: utError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: 'Personel eklendi. Geçici şifre: ' + tempPassword + ' (ilk girişte değiştirmeli)',
    })
  } catch (e) {
    console.error('[franchise/personel] POST', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json()
    const id = body?.id
    const role = body?.role
    if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const update: Record<string, unknown> = {}
    if (role) update.role = role

    if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })

    const { error } = await service.from('user_tenants').update(update).eq('id', id).eq('tenant_id', tenantId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/personel] PATCH', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

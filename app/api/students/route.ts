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


export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ items: [], message: 'Tenant atanmamış' })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') ?? '').trim()
    const sortBy = searchParams.get('sort') ?? 'created_at'
    const sortOrder = searchParams.get('order') === 'asc' ? 'ascending' : 'descending'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const perPage = Math.min(50, Math.max(10, parseInt(searchParams.get('perPage') ?? '20', 10)))
    const statusFilter = searchParams.get('status')

    const service = createServiceClient(url, key)
    let query = service
      .from('athletes')
      .select('id, name, surname, birth_date, gender, branch, level, parent_name, parent_phone, parent_email, notes, status, created_at', { count: 'exact' })
      .eq('tenant_id', tenantId)

    if (statusFilter === 'active' || statusFilter === 'inactive') {
      query = query.eq('status', statusFilter)
    }

    if (q) {
      const safe = q.replace(/'/g, "''")
      if (/^\d{11}$/.test(q)) {
        query = query.or(`name.ilike.%${safe}%,surname.ilike.%${safe}%,parent_phone.ilike.%${safe}%`)
      } else {
        query = query.or(`name.ilike.%${safe}%,surname.ilike.%${safe}%,parent_phone.ilike.%${safe}%`)
      }
    }

    const validSortColumns = ['name', 'created_at', 'birth_date', 'branch']
    const orderColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at'

    const { data, error, count } = await query
      .order(orderColumn, { ascending: sortOrder === 'ascending' })
      .range((page - 1) * perPage, page * perPage - 1)

    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({
      items: data ?? [],
      total: count ?? 0,
      page,
      perPage,
      totalPages: Math.ceil((count ?? 0) / perPage),
    })
  } catch (e) {
    console.error('[students GET]', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const body = await req.json()
    const adSoyad = typeof body.ad_soyad === 'string' ? body.ad_soyad.trim() : ''
    const dogumTarihi = typeof body.dogum_tarihi === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.dogum_tarihi) ? body.dogum_tarihi : ''
    const cinsiyet = typeof body.cinsiyet === 'string' && ['E', 'K', 'diger'].includes(body.cinsiyet) ? body.cinsiyet : null
    const veliAdi = typeof body.veli_adi === 'string' ? body.veli_adi.trim() : null
    const veliTelefon = typeof body.veli_telefon === 'string' ? body.veli_telefon.trim() : null
    const veliEmail = typeof body.veli_email === 'string' ? body.veli_email.trim() : null
    const brans = typeof body.brans === 'string' ? body.brans.trim() : null
    const saglikNotu = typeof body.saglik_notu === 'string' ? body.saglik_notu.trim() : null

    if (!adSoyad) return NextResponse.json({ error: 'Ad Soyad zorunludur' }, { status: 400 })
    if (!dogumTarihi) return NextResponse.json({ error: 'Doğum tarihi zorunludur' }, { status: 400 })

    if (veliTelefon && !/^[\d\s\+\-\(\)]{10,20}$/.test(veliTelefon)) {
      return NextResponse.json({ error: 'Geçersiz telefon formatı' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('athletes')
      .insert({
        tenant_id: tenantId,
        name: adSoyad.split(' ')[0] || adSoyad,
        surname: adSoyad.split(' ').slice(1).join(' ') || null,
        birth_date: dogumTarihi || null,
        gender: cinsiyet,
        parent_name: veliAdi,
        parent_phone: veliTelefon,
        parent_email: veliEmail,
        branch: brans,
        notes: saglikNotu,
        status: 'active',
      } as Record<string, unknown>)
      .select('id, name, surname, created_at')
      .single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Bu kayıt zaten mevcut' }, { status: 400 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, student: data })
  } catch (e) {
    console.error('[students POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

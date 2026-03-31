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
      .from('students')
      .select('id, ad_soyad, tc_kimlik, dogum_tarihi, cinsiyet, veli_adi, veli_telefon, veli_email, brans, grup_id, saglik_notu, status, created_at', { count: 'exact' })
      .eq('tenant_id', tenantId)

    if (statusFilter === 'aktif' || statusFilter === 'pasif') {
      query = query.eq('status', statusFilter)
    }

    if (q) {
      const safe = q.replace(/'/g, "''")
      if (/^\d{11}$/.test(q)) {
        query = query.or(`ad_soyad.ilike.%${safe}%,tc_kimlik.eq.${q},veli_telefon.ilike.%${safe}%`)
      } else {
        query = query.or(`ad_soyad.ilike.%${safe}%,veli_telefon.ilike.%${safe}%`)
      }
    }

    const validSortColumns = ['ad_soyad', 'created_at', 'dogum_tarihi', 'brans']
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
    const tcKimlik = typeof body.tc_kimlik === 'string' ? body.tc_kimlik.replace(/\D/g, '') : ''
    const dogumTarihi = typeof body.dogum_tarihi === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.dogum_tarihi) ? body.dogum_tarihi : ''
    const cinsiyet = typeof body.cinsiyet === 'string' && ['E', 'K', 'diger'].includes(body.cinsiyet) ? body.cinsiyet : null
    const veliAdi = typeof body.veli_adi === 'string' ? body.veli_adi.trim() : null
    const veliTelefon = typeof body.veli_telefon === 'string' ? body.veli_telefon.trim() : null
    const veliEmail = typeof body.veli_email === 'string' ? body.veli_email.trim() : null
    const brans = typeof body.brans === 'string' ? body.brans.trim() : null
    const grupId = typeof body.grup_id === 'string' && body.grup_id ? body.grup_id : null
    const saglikNotu = typeof body.saglik_notu === 'string' ? body.saglik_notu.trim() : null

    if (!adSoyad) return NextResponse.json({ error: 'Ad Soyad zorunludur' }, { status: 400 })
    if (tcKimlik.length !== 11) return NextResponse.json({ error: 'TC Kimlik No 11 hane olmalıdır' }, { status: 400 })
    if (!validateTcKimlik(tcKimlik)) return NextResponse.json({ error: 'Geçersiz TC Kimlik No' }, { status: 400 })
    if (!dogumTarihi) return NextResponse.json({ error: 'Doğum tarihi zorunludur' }, { status: 400 })

    if (veliTelefon && !/^[\d\s\+\-\(\)]{10,20}$/.test(veliTelefon)) {
      return NextResponse.json({ error: 'Geçersiz telefon formatı' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('students')
      .insert({
        tenant_id: tenantId,
        ad_soyad: adSoyad,
        tc_kimlik: tcKimlik,
        dogum_tarihi: dogumTarihi,
        cinsiyet,
        veli_adi: veliAdi,
        veli_telefon: veliTelefon,
        veli_email: veliEmail,
        brans,
        grup_id: grupId,
        saglik_notu: saglikNotu,
        status: 'aktif',
      })
      .select('id, ad_soyad, tc_kimlik, created_at')
      .single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Bu TC Kimlik No zaten kayıtlı' }, { status: 400 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, student: data })
  } catch (e) {
    console.error('[students POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

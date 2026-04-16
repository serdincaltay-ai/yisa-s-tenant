import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

type LeadStatus = 'pending' | 'approved' | 'rejected' | 'converted'

const STATUS_MAP: Record<LeadStatus, string> = {
  pending: 'yeni',
  approved: 'iletisimde',
  rejected: 'kaybedildi',
  converted: 'kazanildi',
}

const STATUS_FROM_DB: Record<string, LeadStatus> = {
  yeni: 'pending',
  iletisimde: 'approved',
  demo_yapildi: 'approved',
  kazanildi: 'converted',
  kaybedildi: 'rejected',
}

function normalizeStatus(input: unknown): LeadStatus | null {
  if (typeof input !== 'string') return null
  const s = input.trim().toLowerCase() as LeadStatus
  return (['pending', 'approved', 'rejected', 'converted'] as LeadStatus[]).includes(s) ? s : null
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu yapılandırma hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    const status = normalizeStatus(req.nextUrl.searchParams.get('status'))
    let query = service
      .from('tenant_leads')
      .select('id, tenant_id, ad_soyad, telefon, email, kaynak, notlar, durum, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(200)
    if (status) query = query.eq('durum', STATUS_MAP[status])

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      items: (data ?? []).map((row) => ({
        ...row,
        status: STATUS_FROM_DB[String(row.durum ?? '').toLowerCase()] ?? 'pending',
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 403 })

    const body = await req.json()
    const adSoyad = typeof body.ad_soyad === 'string' ? body.ad_soyad.trim() : ''
    if (!adSoyad) return NextResponse.json({ error: 'ad_soyad zorunludur' }, { status: 400 })
    const status = normalizeStatus(body.status) ?? 'pending'

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu yapılandırma hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    const { data, error } = await service
      .from('tenant_leads')
      .insert({
        tenant_id: tenantId,
        ad_soyad: adSoyad,
        telefon: typeof body.telefon === 'string' ? body.telefon.trim() : null,
        email: typeof body.email === 'string' ? body.email.trim() : null,
        kaynak: typeof body.kaynak === 'string' ? body.kaynak.trim() : 'api',
        notlar: typeof body.notlar === 'string' ? body.notlar.trim() : null,
        durum: STATUS_MAP[status],
      })
      .select('id, tenant_id, ad_soyad, telefon, email, kaynak, notlar, durum, created_at, updated_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: { ...data, status } })
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 403 })

    const body = await req.json()
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    const status = normalizeStatus(body.status)
    if (!id || !status) {
      return NextResponse.json({ error: 'id ve geçerli status zorunludur' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu yapılandırma hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    const { data, error } = await service
      .from('tenant_leads')
      .update({ durum: STATUS_MAP[status], updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id, tenant_id, ad_soyad, telefon, email, kaynak, notlar, durum, created_at, updated_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: { ...data, status } })
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

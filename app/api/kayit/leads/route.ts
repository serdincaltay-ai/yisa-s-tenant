import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const LEAD_STATUS = ['yeni', 'iletisimde', 'demo_yapildi', 'kazanildi', 'kaybedildi'] as const
type LeadStatus = (typeof LEAD_STATUS)[number]

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createServiceClient(url, key)
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [] })

    const service = getServiceClient()
    if (!service) return NextResponse.json({ items: [] })

    const { data, error } = await service
      .from('tenant_leads')
      .select('id, ad_soyad, telefon, email, kaynak, notlar, durum, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[kayit/leads GET]', e)
    return NextResponse.json({ items: [] })
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
    const telefon = typeof body.telefon === 'string' ? body.telefon.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const kaynak = typeof body.kaynak === 'string' ? body.kaynak.trim() : 'manuel'
    const notlar = typeof body.notlar === 'string' ? body.notlar.trim() : ''
    const durumInput = typeof body.durum === 'string' ? body.durum.trim() : 'yeni'
    const durum: LeadStatus = LEAD_STATUS.includes(durumInput as LeadStatus) ? (durumInput as LeadStatus) : 'yeni'

    if (!adSoyad) return NextResponse.json({ error: 'ad_soyad zorunlu' }, { status: 400 })

    const service = getServiceClient()
    if (!service) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const { data, error } = await service
      .from('tenant_leads')
      .insert({
        tenant_id: tenantId,
        ad_soyad: adSoyad,
        telefon: telefon || null,
        email: email || null,
        kaynak,
        notlar: notlar || null,
        durum,
      })
      .select('id, ad_soyad, telefon, email, kaynak, notlar, durum, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: data })
  } catch (e) {
    console.error('[kayit/leads POST]', e)
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
    const durumInput = typeof body.durum === 'string' ? body.durum.trim() : ''
    const notlar = typeof body.notlar === 'string' ? body.notlar.trim() : null
    if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 })
    if (!LEAD_STATUS.includes(durumInput as LeadStatus)) {
      return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 })
    }

    const service = getServiceClient()
    if (!service) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const updatePayload: Record<string, unknown> = {
      durum: durumInput,
      updated_at: new Date().toISOString(),
    }
    if (notlar !== null) updatePayload.notlar = notlar || null

    const { data, error } = await service
      .from('tenant_leads')
      .update(updatePayload)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id, ad_soyad, durum, notlar, updated_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: data })
  } catch (e) {
    console.error('[kayit/leads PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

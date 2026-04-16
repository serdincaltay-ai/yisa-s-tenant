import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const TRIAL_STATUS = ['bekliyor', 'onaylandi', 'tamamlandi', 'iptal'] as const
type TrialStatus = (typeof TRIAL_STATUS)[number]

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
      .from('trial_requests')
      .select('id, lead_id, cocuk_adi, cocuk_yasi, veli_adi, veli_telefon, brans, tercih_gun, tercih_saat, durum, notlar, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[kayit/trial-requests GET]', e)
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
    const leadId = typeof body.lead_id === 'string' ? body.lead_id.trim() : null
    const cocukAdi = typeof body.cocuk_adi === 'string' ? body.cocuk_adi.trim() : ''
    const cocukYasi = typeof body.cocuk_yasi === 'number' ? body.cocuk_yasi : Number(body.cocuk_yasi)
    const veliAdi = typeof body.veli_adi === 'string' ? body.veli_adi.trim() : ''
    const veliTelefon = typeof body.veli_telefon === 'string' ? body.veli_telefon.trim() : ''
    const brans = typeof body.brans === 'string' ? body.brans.trim() : ''
    const tercihGun = typeof body.tercih_gun === 'string' ? body.tercih_gun.trim() : ''
    const tercihSaat = typeof body.tercih_saat === 'string' ? body.tercih_saat.trim() : ''
    const notlar = typeof body.notlar === 'string' ? body.notlar.trim() : ''

    if (!cocukAdi || !veliAdi || !veliTelefon) {
      return NextResponse.json({ error: 'cocuk_adi, veli_adi ve veli_telefon zorunlu' }, { status: 400 })
    }

    const service = getServiceClient()
    if (!service) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const { data, error } = await service
      .from('trial_requests')
      .insert({
        tenant_id: tenantId,
        lead_id: leadId || null,
        cocuk_adi: cocukAdi,
        cocuk_yasi: Number.isFinite(cocukYasi) ? cocukYasi : null,
        veli_adi: veliAdi,
        veli_telefon: veliTelefon,
        brans: brans || null,
        tercih_gun: tercihGun || null,
        tercih_saat: tercihSaat || null,
        notlar: notlar || null,
      })
      .select('id, cocuk_adi, veli_adi, durum, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Lead bağlantısı varsa lead durumunu iletişimdeye çek
    if (leadId) {
      await service
        .from('tenant_leads')
        .update({
          durum: 'iletisimde',
          updated_at: new Date().toISOString(),
          notlar: notlar ? `Deneme talebi: ${notlar}` : undefined,
        })
        .eq('tenant_id', tenantId)
        .eq('id', leadId)
    }

    return NextResponse.json({ ok: true, item: data })
  } catch (e) {
    console.error('[kayit/trial-requests POST]', e)
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
    if (!TRIAL_STATUS.includes(durumInput as TrialStatus)) {
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
      .from('trial_requests')
      .update(updatePayload)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id, durum, notlar, updated_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: data })
  } catch (e) {
    console.error('[kayit/trial-requests PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

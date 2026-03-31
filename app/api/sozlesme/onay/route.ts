/**
 * Sözleşme onay: kontrol, ekleme
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const TIPLER = ['franchise_sozlesme', 'is_sozlesmesi', 'gelisim_bedeli', 'sistem_guvenligi', 'kvkk', 'fotograf_izni', 'video_izni'] as const

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ onaylar: [], needsFranchise: false, needsPersonel: false, needsVeli: false })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ onaylar: [] })

    const service = createServiceClient(url, key)
    const { data: onaylar } = await service
      .from('sozlesme_onaylari')
      .select('sozlesme_tipi, onay_durumu')
      .eq('user_id', user.id)

    const map = new Map((onaylar ?? []).filter((o: { onay_durumu: boolean }) => o.onay_durumu).map((o: { sozlesme_tipi: string }) => [o.sozlesme_tipi, true]))

    const tenantId = await getTenantIdWithFallback(user.id, req)
    const { data: ut } = await service.from('user_tenants').select('role').eq('user_id', user.id).eq('tenant_id', tenantId ?? '').maybeSingle()
    const { data: t } = await service.from('tenants').select('id').eq('owner_id', user.id).maybeSingle()

    const isAdmin = t || (ut?.role && ['admin', 'owner', 'manager'].includes(String(ut.role)))
    const isPersonel = ut?.role && ['antrenor', 'tesis_muduru', 'sekreter', 'trainer'].includes(String(ut.role))
    const { data: parentChild } = await service.from('athletes').select('id').eq('parent_user_id', user.id).limit(1).maybeSingle()
    const isVeli = !!parentChild

    const needsFranchise = isAdmin && !map.get('franchise_sozlesme')
    const needsPersonel = isPersonel && (!map.get('is_sozlesmesi') || !map.get('gelisim_bedeli') || !map.get('sistem_guvenligi'))
    const needsVeli = isVeli && !map.get('kvkk')

    return NextResponse.json({
      onaylar: Object.fromEntries(map),
      needsFranchise: !!needsFranchise,
      needsPersonel: !!needsPersonel,
      needsVeli: !!needsVeli,
    })
  } catch (e) {
    console.error('[sozlesme/onay GET]', e)
    return NextResponse.json({ onaylar: [], needsFranchise: false, needsPersonel: false, needsVeli: false })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const body = await req.json()
    const tip = body.sozlesme_tipi
    if (!TIPLER.includes(tip)) return NextResponse.json({ error: 'Geçersiz sözleşme tipi' }, { status: 400 })

    const deger = tip === 'fotograf_izni' || tip === 'video_izni' ? !!body.deger : true

    const tenantId = await getTenantIdWithFallback(user.id, req)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { error } = await service.from('sozlesme_onaylari').insert({
      tenant_id: tenantId,
      user_id: user.id,
      sozlesme_tipi: tip,
      onay_durumu: deger,
      onay_tarihi: new Date().toISOString(),
      ip_adresi: ip,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (tip === 'fotograf_izni' || tip === 'video_izni') {
      const col = tip === 'fotograf_izni' ? 'fotograf_izni' : 'video_izni'
      await service.from('athletes').update({ [col]: deger }).eq('parent_user_id', user.id)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[sozlesme/onay POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

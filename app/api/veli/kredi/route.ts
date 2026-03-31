/**
 * Veli: kredi paketleri, satın alma
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

type KrediPaket = { isim: string; saat: number; fiyat: number }

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ packages: [], children: [] })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ packages: [], children: [] })

    const service = createServiceClient(url, key)
    let tid = tenantId

    if (!tid) {
      const { data: child } = await service.from('athletes').select('tenant_id').eq('parent_user_id', user.id).limit(1).maybeSingle()
      tid = child?.tenant_id ?? null
    }

    if (!tid) return NextResponse.json({ packages: [], children: [] })

    const { data: tenant } = await service.from('tenants').select('kredi_paketleri').eq('id', tid).single()
    const packages = (Array.isArray(tenant?.kredi_paketleri) ? tenant.kredi_paketleri : []) as KrediPaket[]
    const validPackages = packages.filter((p: unknown) => p && typeof p === 'object' && 'isim' in p && 'saat' in p && 'fiyat' in p)

    const { data: children } = await service
      .from('athletes')
      .select('id, name, surname, ders_kredisi, toplam_kredi')
      .eq('parent_user_id', user.id)
      .eq('tenant_id', tid)
      .order('name')

    return NextResponse.json({ packages: validPackages, children: children ?? [] })
  } catch (e) {
    console.error('[veli/kredi GET]', e)
    return NextResponse.json({ packages: [], children: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const body = await req.json()
    const athleteId = body.athlete_id as string | undefined
    const paketIndex = typeof body.paket_index === 'number' ? body.paket_index : parseInt(String(body.paket_index), 10)

    if (!athleteId || Number.isNaN(paketIndex)) return NextResponse.json({ error: 'athlete_id ve paket_index gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    const { data: athlete } = await service
      .from('athletes')
      .select('id, tenant_id, name, ders_kredisi, toplam_kredi')
      .eq('id', athleteId)
      .eq('parent_user_id', user.id)
      .single()

    if (!athlete) return NextResponse.json({ error: 'Sporcu bulunamadı' }, { status: 404 })

    const { data: tenant } = await service.from('tenants').select('kredi_paketleri').eq('id', athlete.tenant_id).single()
    const packages = (Array.isArray(tenant?.kredi_paketleri) ? tenant.kredi_paketleri : []) as KrediPaket[]
    const paket = packages[paketIndex]
    if (!paket || !paket.saat || !paket.fiyat) return NextResponse.json({ error: 'Geçersiz paket' }, { status: 400 })

    const mevcutKredi = Number(athlete.ders_kredisi) || 0
    const mevcutToplam = Number(athlete.toplam_kredi) || 0
    const yeniKredi = mevcutKredi + paket.saat
    const yeniToplam = mevcutToplam + paket.saat

    const odemeYontemi = body.odeme_yontemi === 'kart' ? 'kart' : body.odeme_yontemi === 'havale' ? 'havale' : 'nakit'

    const { data: payment } = await service
      .from('payments')
      .insert({
        tenant_id: athlete.tenant_id,
        athlete_id: athleteId,
        amount: paket.fiyat,
        payment_type: 'ekstra',
        status: 'paid',
        payment_method: odemeYontemi,
        paid_date: new Date().toISOString().slice(0, 10),
        notes: `Kredi paketi: ${paket.isim} (${paket.saat} ders)`,
      })
      .select('id')
      .single()

    await service.from('athletes').update({
      ders_kredisi: yeniKredi,
      toplam_kredi: yeniToplam,
    }).eq('id', athleteId)

    try {
      await service.from('cash_register').insert({
        tenant_id: athlete.tenant_id,
        tarih: new Date().toISOString().slice(0, 10),
        tur: 'gelir',
        kategori: 'ders_ucreti',
        aciklama: `Kredi: ${paket.isim} - ${athlete.name}`,
        tutar: paket.fiyat,
        odeme_yontemi: odemeYontemi,
        kaydeden_id: user.id,
      })
    } catch { /* opsiyonel */ }

    return NextResponse.json({ ok: true, ders_kredisi: yeniKredi, payment_id: payment?.id })
  } catch (e) {
    console.error('[veli/kredi POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

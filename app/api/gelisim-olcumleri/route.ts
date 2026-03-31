/**
 * Faz 4 — Veri Robotu: Gelişim Ölçümleri API
 * GET: Bir sporcunun tüm ölçümlerini getir (?athlete_id=xxx&tenant_id=xxx)
 * POST: Yeni ölçüm kaydet (şablon bazlı, JSONB olcum_verileri)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

function getService() {
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
    if (!tenantId) return NextResponse.json({ items: [], message: 'Tenant atanmamış' })

    const athleteId = req.nextUrl.searchParams.get('athlete_id')
    if (!athleteId) return NextResponse.json({ error: 'athlete_id parametresi gerekli' }, { status: 400 })

    const service = getService()
    if (!service) return NextResponse.json({ items: [] })

    const { data: items, error } = await service
      .from('gelisim_olcumleri')
      .select('id, tenant_id, athlete_id, template_id, olcum_tarihi, olcum_verileri, antrenor_notu, olcen_id, created_at')
      .eq('tenant_id', tenantId)
      .eq('athlete_id', athleteId)
      .order('olcum_tarihi', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({ items: items ?? [] })
  } catch (e) {
    console.error('[gelisim-olcumleri GET]', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const body = await req.json()
    const athleteId = typeof body.athlete_id === 'string' ? body.athlete_id.trim() : ''
    const templateId = typeof body.template_id === 'string' ? body.template_id.trim() : null
    const olcumTarihi = typeof body.olcum_tarihi === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.olcum_tarihi)
      ? body.olcum_tarihi
      : new Date().toISOString().slice(0, 10)
    const olcumVerileri = body.olcum_verileri != null && typeof body.olcum_verileri === 'object' && !Array.isArray(body.olcum_verileri)
      ? body.olcum_verileri
      : {}
    const antrenorNotu = typeof body.antrenor_notu === 'string' ? body.antrenor_notu.trim() : null

    if (!athleteId) return NextResponse.json({ error: 'athlete_id zorunludur' }, { status: 400 })

    const service = getService()
    if (!service) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    // Sporcu doğrula (aynı tenant'ta mı)
    const { data: athlete } = await service
      .from('athletes')
      .select('id, birth_date, gender')
      .eq('id', athleteId)
      .eq('tenant_id', tenantId)
      .single()

    if (!athlete) return NextResponse.json({ error: 'Sporcu bulunamadı veya bu tesise ait değil' }, { status: 404 })

    const { data: inserted, error } = await service
      .from('gelisim_olcumleri')
      .insert({
        tenant_id: tenantId,
        athlete_id: athleteId,
        template_id: templateId,
        olcum_tarihi: olcumTarihi,
        olcum_verileri: olcumVerileri,
        antrenor_notu: antrenorNotu,
        olcen_id: user.id,
      })
      .select('id, olcum_tarihi')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      id: inserted?.id,
      olcum_tarihi: inserted?.olcum_tarihi,
      message: 'Ölçüm kaydedildi',
    })
  } catch (e) {
    console.error('[gelisim-olcumleri POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

/**
 * Franchise haftalık ders programı
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const GUNLER = ['Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi', 'Pazar'] as const

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })
    const service = createServiceClient(url, key)

    const { data, error } = await service
      .from('tenant_schedule')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('gun')
      .order('saat')

    if (error) return NextResponse.json({ items: [] })
    return NextResponse.json({ items: data ?? [], gunler: GUNLER })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json()
    const gun = GUNLER.includes(body.gun as (typeof GUNLER)[number]) ? body.gun : 'Pazartesi'
    const saat = typeof body.saat === 'string' ? body.saat : '09:00'
    const dersAdi = typeof body.ders_adi === 'string' ? body.ders_adi.trim() : 'Ders'
    const antrenorId = typeof body.antrenor_id === 'string' ? body.antrenor_id : null
    const brans = typeof body.brans === 'string' ? body.brans : null
    const seviye = typeof body.seviye === 'string' ? body.seviye : null
    const kontenjanRaw = body.kontenjan
    const kontenjan = typeof kontenjanRaw === 'number' && kontenjanRaw >= 1 && kontenjanRaw <= 999
      ? Math.floor(kontenjanRaw)
      : 20

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    const { data, error } = await service
      .from('tenant_schedule')
      .upsert(
        { tenant_id: tenantId, gun, saat, ders_adi: dersAdi, antrenor_id: antrenorId, brans, seviye, kontenjan },
        { onConflict: 'tenant_id,gun,saat' }
      )
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e) {
    console.error('[franchise/schedule]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json()
    const items = Array.isArray(body.items) ? body.items : []
    if (items.length > 200) return NextResponse.json({ error: 'Maksimum 200 kayıt' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    // Boş program → tüm dersleri sil
    if (items.length === 0) {
      const { error: delErr } = await service
        .from('tenant_schedule')
        .delete()
        .eq('tenant_id', tenantId)
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
      return NextResponse.json({ ok: true, count: 0 })
    }

    // Atomik güncelleme: önce upsert, sonra eski kayıtları sil
    const rows = items.map((item: Record<string, unknown>) => {
      const k = item.kontenjan
      const kontenjan = typeof k === 'number' && k >= 1 && k <= 999 ? Math.floor(k) : 20
      return {
        tenant_id: tenantId,
        gun: GUNLER.includes(String(item.gun) as (typeof GUNLER)[number]) ? String(item.gun) : 'Pazartesi',
        saat: typeof item.saat === 'string' ? item.saat : '09:00',
        ders_adi: typeof item.ders_adi === 'string' ? item.ders_adi.trim() : 'Ders',
        brans: typeof item.brans === 'string' ? item.brans : null,
        seviye: typeof item.seviye === 'string' ? item.seviye : null,
        antrenor_id: typeof item.antrenor_id === 'string' ? item.antrenor_id : null,
        kontenjan,
      }
    })

    // 1) Upsert: mevcut hücreleri güncelle, yenileri ekle (veri kaybı yok)
    const { error: upsErr } = await service
      .from('tenant_schedule')
      .upsert(rows, { onConflict: 'tenant_id,gun,saat' })
    if (upsErr) return NextResponse.json({ error: upsErr.message }, { status: 500 })

    // 2) Kaldırılan hücreleri sil (yeni listede olmayan gun+saat çiftleri)
    const keepKeys = new Set(rows.map((r: { gun: string; saat: string }) => `${r.gun}|${r.saat}`))
    const { data: existing } = await service
      .from('tenant_schedule')
      .select('id, gun, saat')
      .eq('tenant_id', tenantId)
    const toDelete = (existing ?? []).filter((row: { id: string; gun: string; saat: string }) => !keepKeys.has(`${row.gun}|${row.saat}`))
    if (toDelete.length > 0) {
      const ids = toDelete.map((r: { id: string }) => r.id)
      const { error: delErr } = await service
        .from('tenant_schedule')
        .delete()
        .in('id', ids)
        .eq('tenant_id', tenantId)
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, count: rows.length })
  } catch (e) {
    console.error('[franchise/schedule PUT]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    const { error } = await service.from('tenant_schedule').delete().eq('id', id).eq('tenant_id', tenantId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/schedule]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

/**
 * Antrenör: sporcu hareketleri — GET (liste) / POST (yeni hareket ekle veya tamamla)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ items: [] }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [] })

    const { searchParams } = new URL(req.url)
    const athleteId = searchParams.get('athlete_id')
    if (!athleteId) return NextResponse.json({ items: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)

    // Antrenörün kendi sporcusu mu kontrol et
    const { data: athlete } = await service
      .from('athletes')
      .select('id')
      .eq('id', athleteId)
      .eq('tenant_id', tenantId)
      .eq('coach_user_id', user.id)
      .maybeSingle()

    if (!athlete) return NextResponse.json({ items: [], error: 'Sporcu bulunamadı' })

    const { data, error } = await service
      .from('athlete_movements')
      .select('id, movement_id, tamamlandi, tamamlanma_tarihi, antrenor_notu, created_at')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[antrenor/movements GET]', error)
      return NextResponse.json({ items: [] })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[antrenor/movements GET]', e)
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
    const { athlete_id, movement_id, tamamlandi, tamamlanma_tarihi, antrenor_notu, id: movementRecordId } = body as {
      athlete_id?: string
      movement_id?: string
      tamamlandi?: boolean
      tamamlanma_tarihi?: string
      antrenor_notu?: string
      id?: string
    }

    if (!athlete_id) return NextResponse.json({ error: 'athlete_id gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    // Antrenörün kendi sporcusu mu kontrol et
    const { data: athlete } = await service
      .from('athletes')
      .select('id')
      .eq('id', athlete_id)
      .eq('tenant_id', tenantId)
      .eq('coach_user_id', user.id)
      .maybeSingle()

    if (!athlete) return NextResponse.json({ error: 'Sporcu bulunamadı veya yetkiniz yok' }, { status: 403 })

    // Mevcut kaydı güncelleme (tamamlama işlemi)
    if (movementRecordId) {
      const updateData: Record<string, unknown> = {}
      if (typeof tamamlandi === 'boolean') updateData.tamamlandi = tamamlandi
      if (tamamlanma_tarihi) updateData.tamamlanma_tarihi = tamamlanma_tarihi
      if (typeof antrenor_notu === 'string') updateData.antrenor_notu = antrenor_notu

      const { error } = await service
        .from('athlete_movements')
        .update(updateData)
        .eq('id', movementRecordId)
        .eq('athlete_id', athlete_id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    // Yeni hareket kaydı ekleme
    const { data: inserted, error } = await service
      .from('athlete_movements')
      .insert({
        athlete_id,
        movement_id: movement_id ?? null,
        tamamlandi: tamamlandi ?? false,
        tamamlanma_tarihi: tamamlanma_tarihi ?? null,
        antrenor_notu: antrenor_notu ?? null,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: inserted.id })
  } catch (e) {
    console.error('[antrenor/movements POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

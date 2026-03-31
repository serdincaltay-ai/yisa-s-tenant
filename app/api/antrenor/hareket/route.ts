/**
 * Antrenör hareket havuzu: POST (hareket işaretle) + GET (sporcu hareketleri)
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
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 400 })

    const athleteId = req.nextUrl.searchParams.get('athlete_id')
    if (!athleteId) return NextResponse.json({ error: 'athlete_id gerekli' }, { status: 400 })

    // Antrenör sahiplik kontrolü
    const { data: athleteCheck } = await service
      .from('athletes')
      .select('id')
      .eq('id', athleteId)
      .eq('tenant_id', tenantId)
      .eq('coach_user_id', user.id)
      .maybeSingle()
    if (!athleteCheck) return NextResponse.json({ error: 'Sporcu bulunamadı' }, { status: 404 })

    const { data, error } = await service
      .from('athlete_movements')
      .select('id, movement_name, completed_at, notes')
      .eq('athlete_id', athleteId)
      .eq('tenant_id', tenantId)
      .order('completed_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: 'Hareketler yüklenemedi' }, { status: 500 })

    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[antrenor/hareket GET]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 400 })

    const body = await req.json()
    const athleteId = body.athlete_id
    const movementName = body.movement_name

    if (!athleteId || typeof athleteId !== 'string') {
      return NextResponse.json({ error: 'athlete_id gerekli' }, { status: 400 })
    }
    if (!movementName || typeof movementName !== 'string') {
      return NextResponse.json({ error: 'movement_name gerekli' }, { status: 400 })
    }

    // Antrenör sahiplik kontrolü
    const { data: athleteCheck } = await service
      .from('athletes')
      .select('id')
      .eq('id', athleteId)
      .eq('tenant_id', tenantId)
      .eq('coach_user_id', user.id)
      .maybeSingle()
    if (!athleteCheck) return NextResponse.json({ error: 'Sporcu bulunamadı' }, { status: 404 })

    const { error } = await service
      .from('athlete_movements')
      .insert({
        tenant_id: tenantId,
        athlete_id: athleteId,
        movement_name: movementName.trim(),
        marked_by: user.id,
        notes: typeof body.notes === 'string' ? body.notes.trim() : null,
      })

    if (error) return NextResponse.json({ error: 'Hareket kaydedilemedi' }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[antrenor/hareket POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

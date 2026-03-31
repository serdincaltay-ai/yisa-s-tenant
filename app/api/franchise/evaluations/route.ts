/**
 * Franchise sporcu değerlendirmeleri (ilk ölçüm, risk/program notları)
 * Tablo: franchise_athlete_evaluations (migration: 20260326120000)
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

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const athleteId = req.nextUrl.searchParams.get('athlete_id')
    if (!athleteId) return NextResponse.json({ error: 'athlete_id gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data: athlete } = await service.from('athletes').select('id').eq('id', athleteId).eq('tenant_id', tenantId).maybeSingle()
    if (!athlete) return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 })

    const { data, error } = await service
      .from('franchise_athlete_evaluations')
      .select('id, evaluation_type, scores, trainer_note, risk_flags, program_profile, created_at, created_by')
      .eq('tenant_id', tenantId)
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ items: [], warning: 'Tablo henüz oluşturulmadı: franchise_athlete_evaluations migration uygulayın.' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[franchise/evaluations GET]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
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
    const athleteId = typeof body.athlete_id === 'string' ? body.athlete_id : ''
    const evaluationType = typeof body.evaluation_type === 'string' ? body.evaluation_type.trim() : 'ilk_olcum'
    const scores = body.scores && typeof body.scores === 'object' ? body.scores : {}
    const trainerNote = typeof body.trainer_note === 'string' ? body.trainer_note.trim() : null
    const riskFlags = Array.isArray(body.risk_flags) ? body.risk_flags : []
    const programProfile = body.program_profile && typeof body.program_profile === 'object' ? body.program_profile : {}

    if (!athleteId) return NextResponse.json({ error: 'athlete_id gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data: athlete } = await service.from('athletes').select('id').eq('id', athleteId).eq('tenant_id', tenantId).maybeSingle()
    if (!athlete) return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 })

    const { data, error } = await service
      .from('franchise_athlete_evaluations')
      .insert({
        tenant_id: tenantId,
        athlete_id: athleteId,
        evaluation_type: evaluationType || 'ilk_olcum',
        scores,
        trainer_note: trainerNote,
        risk_flags: riskFlags,
        program_profile: programProfile,
        created_by: user.id,
      })
      .select('id, created_at')
      .single()

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Veritabanında franchise_athlete_evaluations tablosu yok. Supabase’e migration uygulayın.' },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, evaluation: data })
  } catch (e) {
    console.error('[franchise/evaluations POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

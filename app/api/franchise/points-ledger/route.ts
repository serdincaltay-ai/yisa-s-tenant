/**
 * Puan defteri listesi (GRUP M5) — tablo: points_ledger
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const ALLOWED_SOURCES = ['google_yorum', 'instagram_paylasim', 'arkadas_yonlendirme', 'duzenli_katilim', 'ev_odevi', 'diger'] as const

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const athleteId = req.nextUrl.searchParams.get('athlete_id')

    let q = service
      .from('points_ledger')
      .select('id, athlete_id, source, points, note, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (athleteId) q = q.eq('athlete_id', athleteId)

    const { data, error } = await q
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ items: [], warning: 'Tablo henüz oluşturulmadı: points_ledger migration uygulayın.' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[franchise/points-ledger GET]', e)
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
    const source = typeof body.source === 'string' ? body.source.trim() : ''
    const points = typeof body.points === 'number' ? body.points : parseInt(String(body.points ?? '1'), 10)
    const note = typeof body.note === 'string' ? body.note.trim() : null
    const athleteId = typeof body.athlete_id === 'string' && body.athlete_id ? body.athlete_id : null

    if (!source || !ALLOWED_SOURCES.includes(source as (typeof ALLOWED_SOURCES)[number])) {
      return NextResponse.json({ error: 'Geçerli source gerekli', allowed: ALLOWED_SOURCES }, { status: 400 })
    }
    if (Number.isNaN(points) || points === 0) {
      return NextResponse.json({ error: 'Geçerli puan girin' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    if (athleteId) {
      const { data: a } = await service.from('athletes').select('id').eq('id', athleteId).eq('tenant_id', tenantId).maybeSingle()
      if (!a) return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 })
    }

    const { data, error } = await service
      .from('points_ledger')
      .insert({
        tenant_id: tenantId,
        athlete_id: athleteId,
        source,
        points,
        note,
        created_by: user.id,
      })
      .select('id, created_at')
      .single()

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Veritabanında points_ledger tablosu yok. Supabase’e migration uygulayın.' },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, row: data })
  } catch (e) {
    console.error('[franchise/points-ledger POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

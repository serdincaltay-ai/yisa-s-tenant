/**
 * Antrenör: antrenman planı CRUD
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
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    const { data: plans } = await service
      .from('training_plans')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false })

    const planlar = (plans ?? []).map((p: {
      id: string
      title?: string
      branch?: string
      level?: string
      duration_min?: number
      exercises?: Array<{ ad: string; set: number; tekrar: string; aciklama: string }>
      created_at: string
    }) => ({
      id: p.id,
      baslik: p.title ?? '—',
      brans: p.branch ?? '',
      seviye: p.level ?? '',
      sure_dk: p.duration_min ?? 60,
      hareketler: p.exercises ?? [],
      created_at: p.created_at,
    }))

    return NextResponse.json({ planlar })
  } catch (e) {
    console.error('[antrenor/antrenman-plani] GET', e)
    return NextResponse.json({ planlar: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 400 })

    const body = await req.json()
    const { baslik, brans, seviye, sure_dk, hareketler } = body

    if (!baslik) return NextResponse.json({ error: 'Başlık zorunludur' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    const { error } = await service
      .from('training_plans')
      .insert({
        tenant_id: tenantId,
        coach_id: user.id,
        title: baslik,
        branch: brans || null,
        level: seviye || null,
        duration_min: sure_dk || 60,
        exercises: hareketler || [],
      })

    if (error) {
      console.error('[antrenor/antrenman-plani] insert error:', error)
      return NextResponse.json({ ok: false, error: 'Kayıt başarısız: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[antrenor/antrenman-plani] POST', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

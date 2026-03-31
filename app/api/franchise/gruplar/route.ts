/**
 * GET/POST /api/franchise/gruplar
 * lesson_groups listesi ve yeni grup ekleme
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
    if (!tenantId) return NextResponse.json({ items: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('lesson_groups')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('grup_adi')

    if (error) return NextResponse.json({ items: [] })
    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[franchise/gruplar GET]', e)
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

    const body = await req.json() as Record<string, unknown>
    const grup_adi = typeof body.grup_adi === 'string' ? body.grup_adi.trim() : ''
    const yas_araligi = typeof body.yas_araligi === 'string' ? body.yas_araligi.trim() || null : null
    const kategori = typeof body.kategori === 'string' ? body.kategori.trim() || null : null
    const max_kontenjan = typeof body.max_kontenjan === 'number' && body.max_kontenjan >= 1 ? Math.floor(body.max_kontenjan) : 20

    if (!grup_adi) return NextResponse.json({ error: 'grup_adi zorunludur' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('lesson_groups')
      .insert({
        tenant_id: tenantId,
        grup_adi,
        yas_araligi,
        kategori,
        max_kontenjan,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e) {
    console.error('[franchise/gruplar POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

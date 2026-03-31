/**
 * Tenant kurulum sihirbazı API
 * GET: Kurulum durumu, POST: Kurulumu tamamla
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function getTenantId(userId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const service = createServiceClient(url, key)
  const { data: ut } = await service
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (ut?.tenant_id) return ut.tenant_id
  const { data: t } = await service
    .from('tenants')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle()
  return t?.id ?? null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış', needsSetup: false }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    const { data: tenant, error } = await service
      .from('tenants')
      .select('id, ad, name, slug, sehir, ilce, logo_url, working_hours, primary_color, setup_completed, phone, address, description, owner_id, selected_branches')
      .eq('id', tenantId)
      .single()

    if (error || !tenant) return NextResponse.json({ error: 'Tesis bulunamadı' }, { status: 404 })
    const isOwner = tenant.owner_id === user.id

    const { data: sportsBranches } = await service
      .from('sports_branches')
      .select('id, kod, isim, kategori')
      .order('isim')

    return NextResponse.json({
      tenant,
      needsSetup: !tenant.setup_completed,
      isOwner,
      sportsBranches: sportsBranches ?? [],
    })
  } catch (e) {
    console.error('[franchise/kurulum] GET', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json()
    const update: Record<string, unknown> = {
      setup_completed: true,
    }
    if (typeof body.ad === 'string' && body.ad.trim()) update.ad = body.ad.trim()
    if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim()
    if (typeof body.phone === 'string') update.phone = body.phone.trim() || null
    if (typeof body.address === 'string') update.address = body.address.trim() || null
    if (typeof body.description === 'string') update.description = body.description.trim() || null
    if (typeof body.logo_url === 'string') update.logo_url = body.logo_url.trim() || null
    if (typeof body.primary_color === 'string' && body.primary_color.trim()) update.primary_color = body.primary_color.trim()
    if (body.working_hours != null && typeof body.working_hours === 'object') update.working_hours = body.working_hours
    if (typeof body.sehir === 'string') update.sehir = body.sehir.trim() || null
    if (typeof body.ilce === 'string') update.ilce = body.ilce.trim() || null
    if (Array.isArray(body.selected_branches)) update.selected_branches = body.selected_branches

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    const { error } = await service.from('tenants').update(update).eq('id', tenantId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/kurulum] POST', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

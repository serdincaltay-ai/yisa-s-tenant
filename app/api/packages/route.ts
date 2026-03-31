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
    const { data: fetchedData, error } = await service
      .from('seans_packages')
      .select('id, name, seans_count, price, currency, max_taksit, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'aktif')
      .order('seans_count', { ascending: true })

    if (error) return NextResponse.json({ items: [], error: error.message })

    if (!fetchedData || fetchedData.length === 0) {
      const defaults = [
        { name: '24 Seans', seans_count: 24, price: 6000, max_taksit: 3 },
        { name: '48 Seans', seans_count: 48, price: 10000, max_taksit: 3 },
        { name: '60 Seans', seans_count: 60, price: 12000, max_taksit: 3 },
      ]
      const { data: inserted } = await service
        .from('seans_packages')
        .insert(
          defaults.map((d) => ({
            tenant_id: tenantId,
            name: d.name,
            seans_count: d.seans_count,
            price: d.price,
            currency: 'TRY',
            max_taksit: d.max_taksit,
            status: 'aktif',
          }))
        )
        .select('id, name, seans_count, price, currency, max_taksit, status')
      return NextResponse.json({ items: inserted ?? [] })
    }

    return NextResponse.json({ items: fetchedData ?? [] })
  } catch (e) {
    console.error('[packages GET]', e)
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
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const seansCount = parseInt(String(body.seans_count ?? 0), 10)
    const price = parseFloat(String(body.price ?? 0))
    const maxTaksit = Math.min(12, Math.max(1, parseInt(String(body.max_taksit ?? 1), 10)))

    if (!name || seansCount < 1 || price <= 0) {
      return NextResponse.json({ error: 'name, seans_count ve price zorunludur' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('seans_packages')
      .insert({
        tenant_id: tenantId,
        name,
        seans_count: seansCount,
        price: Number(price.toFixed(2)),
        currency: 'TRY',
        max_taksit: maxTaksit,
        status: 'aktif',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, package: data })
  } catch (e) {
    console.error('[packages POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

/**
 * Token mağazası API
 * GET: Bakiye + satın alma geçmişi
 * POST: Satın al (token ile) veya token yükle (MVP: direkt artır)
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

const PAKETLER = [
  { id: 'starter', name: 'Starter', token: 1000, icerik: 'Temel panel, 1 branş, 50 sporcu' },
  { id: 'pro', name: 'Pro', token: 3000, icerik: 'Tüm paneller, 5 branş, 200 sporcu, muhasebe robotu' },
  { id: 'elite', name: 'Elite', token: 5000, icerik: 'Sınırsız branş, sınırsız sporcu, tüm robotlar' },
]

const EK_URUNLER = [
  { id: 'web-tasarim', name: 'Web sitesi tasarımı', token: 500 },
  { id: 'logo-tasarim', name: 'Logo tasarımı', token: 300 },
  { id: 'sosyal-medya', name: 'Sosyal medya paketi', token: 400 },
  { id: 'muhasebe-robot', name: 'Muhasebe robotu', token: 600 },
  { id: 'pazarlama-robot', name: 'Pazarlama robotu', token: 500 },
]

const TOKEN_YUKLE = [
  { miktar: 1000, fiyat: 100 },
  { miktar: 3000, fiyat: 250 },
  { miktar: 5000, fiyat: 400 },
]

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    const { data: tenant } = await service
      .from('tenants')
      .select('token_balance')
      .eq('id', tenantId)
      .single()

    const { data: purchases } = await service
      .from('tenant_purchases')
      .select('id, product_key, product_name, amount, token_cost, item_type, item_name, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      tokenBalance: tenant?.token_balance ?? 0,
      purchases: purchases ?? [],
      paketler: PAKETLER,
      ekUrunler: EK_URUNLER,
      tokenYukle: TOKEN_YUKLE,
    })
  } catch (e) {
    console.error('[franchise/magaza] GET', e)
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
    const action = body?.action as string
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    if (action === 'yukle') {
      const miktar = Number(body?.miktar) || 0
      if (miktar <= 0) return NextResponse.json({ error: 'Geçersiz miktar' }, { status: 400 })
      const { data: t } = await service.from('tenants').select('token_balance').eq('id', tenantId).single()
      const current = (t?.token_balance as number) ?? 0
      await service.from('tenants').update({ token_balance: current + miktar }).eq('id', tenantId)
      return NextResponse.json({ ok: true, tokenBalance: current + miktar })
    }

    if (action === 'satin_al') {
      const productId = body?.productId as string
      const productName = body?.productName as string
      const tokenCost = Number(body?.tokenCost) || 0
      const itemType = (body?.itemType as string) || 'urun'
      if (!productId || tokenCost <= 0) return NextResponse.json({ error: 'Geçersiz ürün' }, { status: 400 })

      const { data: t } = await service.from('tenants').select('token_balance').eq('id', tenantId).single()
      const current = (t?.token_balance as number) ?? 0
      if (current < tokenCost) return NextResponse.json({ error: 'Yetersiz token' }, { status: 400 })

      await service.from('tenant_purchases').insert({
        tenant_id: tenantId,
        product_key: productId,
        product_name: productName,
        amount: 0,
        item_type: itemType,
        item_name: productName,
        token_cost: tokenCost,
      })
      await service.from('tenants').update({ token_balance: current - tokenCost }).eq('id', tenantId)
      return NextResponse.json({ ok: true, tokenBalance: current - tokenCost })
    }

    return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
  } catch (e) {
    console.error('[franchise/magaza] POST', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

/**
 * Satış kaydı - CELF Kasaya gelir yazar
 * Franchise/COO mağazası satış yapıldığında çağrılır.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { recordKasaHareket } from '@/lib/db/celf-kasa'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const body = await req.json()
    const amount = Number(body.amount ?? body.tutar ?? 0)
    const aciklama = typeof body.aciklama === 'string' ? body.aciklama.trim() : ''
    const productKey = typeof body.product_key === 'string' ? body.product_key : ''
    const templateId = typeof body.template_id === 'string' ? body.template_id : ''
    const franchiseId = typeof body.franchise_id === 'string' ? body.franchise_id : undefined
    const currency = typeof body.para_birimi === 'string' ? body.para_birimi : 'TRY'

    if (amount <= 0) return NextResponse.json({ error: 'Geçerli tutar girin' }, { status: 400 })
    const desc = aciklama || (productKey ? `Ürün: ${productKey}` : templateId ? `Şablon: ${templateId}` : 'Satış')

    let tenantId: string | null = null
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) {
      const service = createServiceClient(url, key)
      const { data: ut } = await service.from('user_tenants').select('tenant_id').eq('user_id', user.id).limit(1).maybeSingle()
      tenantId = ut?.tenant_id ?? null
      if (!tenantId) {
        const { data: t } = await service.from('tenants').select('id').eq('owner_id', user.id).limit(1).maybeSingle()
        tenantId = t?.id ?? null
      }
    }

    const result = await recordKasaHareket({
      hareket_tipi: 'gelir',
      aciklama: desc,
      tutar: amount,
      para_birimi: currency,
      referans_tipi: templateId ? 'template' : productKey ? 'product' : 'sale',
      referans_id: templateId || productKey || undefined,
      franchise_id: franchiseId,
      tenant_id: tenantId ?? undefined,
      kaynak: 'coo_magaza',
    })

    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })

    // tenant_purchases'a da yaz (Patron onayı sonrası kullanılabilir)
    if (tenantId && result.id) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (url && key) {
        const service = createServiceClient(url, key)
        await service.from('tenant_purchases').insert({
          tenant_id: tenantId,
          product_key: productKey || templateId || `sale_${result.id}`,
          product_name: desc,
          amount,
          para_birimi: currency,
          celf_kasa_id: result.id,
          odeme_onaylandi: false,
        })
      }
    }

    return NextResponse.json({ ok: true, id: result.id })
  } catch (e) {
    console.error('[sales POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

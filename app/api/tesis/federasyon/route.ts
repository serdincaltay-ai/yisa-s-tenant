/**
 * Public: tenant slug ve isteğe bağlı branch ile federasyon bilgisi.
 * GET /api/tesis/federasyon?tenantSlug=X&branch=Y
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export type FederasyonPublic = {
  id: string
  tenant_id: string
  branch: string
  il: string | null
  temsilci_adi: string | null
  temsilci_telefonu: string | null
  federasyon_adi: string | null
  yarisma_kulupleri: string[] | unknown
  created_at?: string
}

export async function GET(req: NextRequest) {
  try {
    const tenantSlug = req.nextUrl.searchParams.get('tenantSlug')
    if (!tenantSlug || typeof tenantSlug !== 'string') {
      return NextResponse.json({ error: 'tenantSlug gerekli' }, { status: 400 })
    }
    const branch = req.nextUrl.searchParams.get('branch')
    const branchStr = typeof branch === 'string' ? branch.trim() : null

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createClient(url, key)
    const { data: tenant, error: tenantErr } = await service
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .maybeSingle()
    if (tenantErr || !tenant) {
      return NextResponse.json({ error: 'Tesis bulunamadı' }, { status: 404 })
    }

    let query = service
      .from('federation_info')
      .select('id, tenant_id, branch, il, temsilci_adi, temsilci_telefonu, federasyon_adi, yarisma_kulupleri, created_at')
      .eq('tenant_id', tenant.id)
    if (branchStr) query = query.eq('branch', branchStr)
    const { data: rows, error } = await query.order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ items: rows ?? [] })
  } catch (e) {
    console.error('[tesis/federasyon GET]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

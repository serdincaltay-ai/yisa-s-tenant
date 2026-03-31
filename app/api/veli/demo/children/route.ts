import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const DEMO_VELI_EMAIL = 'demo.veli@yisa-s.com'

/** Demo veli: parent_email ile çocukları döner (auth yok) */
export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const tenantId = await getTenantIdWithFallback(null)
    const service = createClient(url, key)

    let query = service
      .from('athletes')
      .select('id, name, surname, birth_date, gender, branch, level, status, tenant_id, created_at, ders_kredisi, toplam_kredi')
      .ilike('parent_email', DEMO_VELI_EMAIL)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[veli/demo/children]', e)
    return NextResponse.json({ items: [] })
  }
}

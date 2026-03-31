/**
 * Sporcu ölçüm geçmişi
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
    if (!user) return NextResponse.json({ items: [] })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    const athleteId = req.nextUrl.searchParams.get('athlete_id')
    if (!athleteId) return NextResponse.json({ items: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)

    if (!tenantId) return NextResponse.json({ items: [] })
    const { data: athlete } = await service.from('athletes').select('id').eq('id', athleteId).eq('tenant_id', tenantId).eq('coach_user_id', user.id).single()
    if (!athlete) return NextResponse.json({ items: [] })

    const { data: items } = await service
      .from('athlete_measurements')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('athlete_id', athleteId)
      .order('olcum_tarihi', { ascending: false })
      .limit(50)

    return NextResponse.json({ items: items ?? [] })
  } catch (e) {
    console.error('[antrenor/olcum/gecmis]', e)
    return NextResponse.json({ items: [] })
  }
}

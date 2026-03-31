/**
 * Antrenör: atanan sporcular listesi
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
    if (!user) return NextResponse.json({ items: [] }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)
    const { data: sporcular } = await service
      .from('athletes')
      .select('id, name, surname, branch, level, "group", status, notes')
      .eq('tenant_id', tenantId)
      .eq('coach_user_id', user.id)
      .order('name')

    const ids = (sporcular ?? []).map((s: { id: string }) => s.id)
    let sonYoklama: Record<string, { tarih: string; durum: string }> = {}
    if (ids.length > 0) {
      const { data: lastAt } = await service
        .from('attendance')
        .select('athlete_id, lesson_date, status')
        .in('athlete_id', ids)
        .order('lesson_date', { ascending: false })
      const byAthlete = new Map<string, { lesson_date: string; status: string }>()
      for (const r of lastAt ?? []) {
        if (!byAthlete.has(r.athlete_id)) {
          byAthlete.set(r.athlete_id, { lesson_date: r.lesson_date, status: r.status })
        }
      }
      sonYoklama = Object.fromEntries(
        Array.from(byAthlete.entries()).map(([id, v]) => [
          id,
          { tarih: v.lesson_date, durum: v.status === 'present' ? 'geldi' : v.status === 'excused' ? 'izinli' : 'gelmedi' },
        ])
      )
    }

    const items = (sporcular ?? []).map((s: { id: string; name: string; surname?: string; branch?: string; level?: string; group?: string; status?: string; notes?: string }) => ({
      ...s,
      sonYoklama: sonYoklama[s.id] ?? null,
    }))

    return NextResponse.json({ items })
  } catch (e) {
    console.error('[antrenor/sporcular]', e)
    return NextResponse.json({ items: [] })
  }
}

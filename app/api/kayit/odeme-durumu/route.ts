/**
 * Kayıt personeli: ödeme durumu listesi
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

    // Ödemeler
    const { data: payments } = await service
      .from('payments')
      .select('id, athlete_id, amount, status, created_at, period')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100)

    // Sporcu adları
    const athleteIds = [...new Set((payments ?? []).map((p: { athlete_id: string }) => p.athlete_id).filter(Boolean))]
    const { data: athletes } = athleteIds.length > 0
      ? await service.from('athletes').select('id, name, surname, parent_name').in('id', athleteIds)
      : { data: [] }

    const athleteMap = new Map((athletes ?? []).map((a: { id: string; name: string; surname?: string; parent_name?: string }) => [a.id, a]))

    const odemeler = (payments ?? []).map((p: { id: string; athlete_id: string; amount: number; status: string; created_at: string; period?: string }) => {
      const athlete = athleteMap.get(p.athlete_id) as { name: string; surname?: string; parent_name?: string } | undefined
      return {
        id: p.id,
        ogrenci_adi: athlete ? `${athlete.name} ${athlete.surname ?? ''}`.trim() : '—',
        veli_adi: athlete?.parent_name ?? '—',
        tutar: Number(p.amount) || 0,
        durum: p.status as 'paid' | 'pending' | 'overdue',
        son_odeme_tarihi: p.created_at ? new Date(p.created_at).toLocaleDateString('tr-TR') : '—',
        donem: (p as { period?: string }).period ?? '—',
      }
    })

    return NextResponse.json({ odemeler })
  } catch (e) {
    console.error('[kayit/odeme-durumu]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

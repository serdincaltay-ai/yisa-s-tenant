/**
 * Franchise: kredi özeti — toplam aktif kredi, biten krediler, kredisi bitmek üzere
 * Query: ?threshold=3 — bitmek üzere için üst sınır (varsayılan 3)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

type BitmekUzereItem = { id: string; name: string; surname?: string; ders_kredisi: number }
type BorcluHesapItem = { id: string; name: string; surname?: string; toplam_borc: number }
const empty = {
  toplamAktifKredi: 0,
  bitenKrediler: [] as Array<{ id: string; name: string; surname?: string }>,
  bitmekUzere: [] as BitmekUzereItem[],
  borcluHesaplar: [] as BorcluHesapItem[],
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json(empty)

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json(empty)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json(empty)

    const thresholdParam = req.nextUrl.searchParams.get('threshold')
    const threshold = Math.max(1, Math.min(99, Number(thresholdParam) || 3))

    const service = createServiceClient(url, key)
    const { data: athletes } = await service
      .from('athletes')
      .select('id, name, surname, ders_kredisi, toplam_kredi, toplam_borc')
      .eq('tenant_id', tenantId)

    let toplamAktifKredi = 0
    const bitenKrediler: Array<{ id: string; name: string; surname?: string }> = []
    const bitmekUzere: BitmekUzereItem[] = []
    const borcluHesaplar: BorcluHesapItem[] = []

    for (const a of athletes ?? []) {
      const kredi = Number(a.ders_kredisi) ?? 0
      const borc = Number((a as { toplam_borc?: number | null }).toplam_borc) ?? 0
      toplamAktifKredi += kredi
      if (kredi === 0 && (Number(a.toplam_kredi) ?? 0) > 0) {
        bitenKrediler.push({ id: a.id, name: a.name ?? '', surname: a.surname ?? '' })
      }
      if (kredi > 0 && kredi <= threshold) {
        bitmekUzere.push({ id: a.id, name: a.name ?? '', surname: a.surname ?? '', ders_kredisi: kredi })
      }
      if (kredi <= 0 && borc > 0) {
        borcluHesaplar.push({ id: a.id, name: a.name ?? '', surname: a.surname ?? '', toplam_borc: borc })
      }
    }

    return NextResponse.json({ toplamAktifKredi, bitenKrediler, bitmekUzere, borcluHesaplar })
  } catch (e) {
    console.error('[franchise/kredi-ozet]', e)
    return NextResponse.json(empty)
  }
}

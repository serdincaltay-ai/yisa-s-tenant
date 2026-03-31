/**
 * GET /api/franchise/borclu-hesaplar
 * athletes + payments: bakiye = toplam_odenmesi_gereken - toplam_odenen
 * bakiye > 0 olan sporcular (borçlu). Sıralama: bakiye DESC (en borçlu üstte).
 * Response: { sporcular: [{ id, ad, soyad, sube, bakiye, son_odeme_tarihi }], toplamBorc }
 * RLS: tenant_id (getTenantIdWithFallback).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export type BorcluSporcu = {
  id: string
  ad: string
  soyad: string
  sube: string
  bakiye: number
  son_odeme_tarihi: string | null
}

const empty = { sporcular: [] as BorcluSporcu[], toplamBorc: 0 }

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

    const service = createServiceClient(url, key)

    const { data: athletes } = await service
      .from('athletes')
      .select('id, name, surname, branch')
      .eq('tenant_id', tenantId)

    const { data: payments } = await service
      .from('payments')
      .select('athlete_id, amount, status, paid_date')
      .eq('tenant_id', tenantId)

    type PayRow = { athlete_id: string; amount: number; status: string; paid_date: string | null }
    const toplamGerekenByAthlete = new Map<string, number>()
    const toplamOdenenByAthlete = new Map<string, number>()
    const sonOdemeByAthlete = new Map<string, string>()

    for (const p of (payments ?? []) as PayRow[]) {
      const aid = p.athlete_id
      const amount = Number(p.amount) || 0
      toplamGerekenByAthlete.set(aid, (toplamGerekenByAthlete.get(aid) ?? 0) + amount)
      if (p.status === 'paid' && amount > 0) {
        toplamOdenenByAthlete.set(aid, (toplamOdenenByAthlete.get(aid) ?? 0) + amount)
        const pd = p.paid_date ?? ''
        if (pd) {
          const cur = sonOdemeByAthlete.get(aid)
          if (!cur || pd > cur) sonOdemeByAthlete.set(aid, pd)
        }
      }
    }

    const sporcular: BorcluSporcu[] = []
    let toplamBorc = 0

    for (const a of athletes ?? []) {
      const id = a.id as string
      const toplamGereken = toplamGerekenByAthlete.get(id) ?? 0
      const toplamOdenen = toplamOdenenByAthlete.get(id) ?? 0
      const bakiye = toplamGereken - toplamOdenen
      if (bakiye <= 0) continue
      toplamBorc += bakiye
      sporcular.push({
        id,
        ad: (a.name as string) ?? '',
        soyad: (a.surname as string) ?? '',
        sube: (a.branch as string) ?? '—',
        bakiye: Math.round(bakiye * 100) / 100,
        son_odeme_tarihi: sonOdemeByAthlete.get(id) ?? null,
      })
    }

    sporcular.sort((x, y) => y.bakiye - x.bakiye)

    return NextResponse.json({ sporcular, toplamBorc: Math.round(toplamBorc * 100) / 100 })
  } catch (e) {
    console.error('[franchise/borclu-hesaplar]', e)
    return NextResponse.json(empty)
  }
}

/**
 * GET /api/franchise/kredi-durum
 * Query: ?durum=bitmek-uzere|bitmis|tumu
 * bitmek-uzere: ders_kredisi > 0 AND ders_kredisi <= 3
 * bitmis: ders_kredisi = 0 veya NULL
 * tumu: hepsi
 * RLS: tenant_id zorunlu (getTenantIdWithFallback).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

type SporcuRow = {
  id: string
  ad: string
  soyad: string
  ders_kredisi: number
  paket_adi: string
  son_yoklama: string | null
}

const emptyResponse = {
  sporcular: [] as SporcuRow[],
  toplam: 0,
  bitmekUzere: 0,
  bitmis: 0,
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json(emptyResponse)

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json(emptyResponse)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json(emptyResponse)

    const durum = (req.nextUrl.searchParams.get('durum') ?? 'tumu').trim() as 'bitmek-uzere' | 'bitmis' | 'tumu'
    if (!['bitmek-uzere', 'bitmis', 'tumu'].includes(durum)) {
      return NextResponse.json(emptyResponse)
    }

    const service = createServiceClient(url, key)

    const { data: athletes, error: athError } = await service
      .from('athletes')
      .select('id, name, surname, ders_kredisi')
      .eq('tenant_id', tenantId)

    if (athError || !athletes?.length) {
      return NextResponse.json({ ...emptyResponse, toplam: 0 })
    }

    const athleteIds = athletes.map((a: { id: string }) => a.id)

    const { data: lastAttendance } = await service
      .from('attendance')
      .select('athlete_id, lesson_date')
      .eq('tenant_id', tenantId)
      .in('athlete_id', athleteIds)
      .order('lesson_date', { ascending: false })

    const sonYoklamaMap = new Map<string, string>()
    for (const row of lastAttendance ?? []) {
      const r = row as { athlete_id: string; lesson_date: string }
      if (!sonYoklamaMap.has(r.athlete_id)) sonYoklamaMap.set(r.athlete_id, r.lesson_date)
    }

    let list = athletes.map((a: { id: string; name: string | null; surname: string | null; ders_kredisi: number | null }) => {
      const kredi = Number(a.ders_kredisi) ?? 0
      return {
        id: a.id,
        ad: a.name ?? '',
        soyad: a.surname ?? '',
        ders_kredisi: kredi,
        paket_adi: '—',
        son_yoklama: sonYoklamaMap.get(a.id) ?? null,
      } satisfies SporcuRow
    })

    const bitmekUzereCount = list.filter((s) => s.ders_kredisi > 0 && s.ders_kredisi <= 3).length
    const bitmisCount = list.filter((s) => s.ders_kredisi === 0 || s.ders_kredisi == null).length

    if (durum === 'bitmek-uzere') {
      list = list.filter((s) => s.ders_kredisi > 0 && s.ders_kredisi <= 3)
    } else if (durum === 'bitmis') {
      list = list.filter((s) => s.ders_kredisi === 0)
    }

    return NextResponse.json({
      sporcular: list,
      toplam: athletes.length,
      bitmekUzere: bitmekUzereCount,
      bitmis: bitmisCount,
    })
  } catch (e) {
    console.error('[franchise/kredi-durum]', e)
    return NextResponse.json(emptyResponse)
  }
}

/**
 * GET/POST /api/franchise/dolaplar
 * GET: Dolap listesi (durum filtreli)
 * POST: Yeni dolap ekle { dolap_no, konum? } VEYA Dolap kirala { dolap_id, athlete_id, baslangic, bitis, ucret? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const DURUMLAR = ['bos', 'kirali', 'arizali', 'rezerve'] as const

export type LockerRow = {
  id: string
  tenant_id: string
  dolap_no: string
  konum: string | null
  durum: string
  kiralayan_athlete_id: string | null
  kiralama_baslangic: string | null
  kiralama_bitis: string | null
  aylik_ucret: number | null
  created_at: string
  kiralayan_adi?: string
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)
    const durum = req.nextUrl.searchParams.get('durum')?.trim()

    let q = service
      .from('lockers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('dolap_no')

    if (durum && DURUMLAR.includes(durum as (typeof DURUMLAR)[number])) {
      q = q.eq('durum', durum)
    }

    const { data: rows, error } = await q
    if (error) return NextResponse.json({ items: [], error: error.message })

    const list = (rows ?? []) as Array<Record<string, unknown>>
    const athleteIds = [...new Set(list.map((r) => r.kiralayan_athlete_id).filter(Boolean))] as string[]
    const nameMap: Record<string, string> = {}
    if (athleteIds.length > 0) {
      const { data: athletes } = await service
        .from('athletes')
        .select('id, name, surname')
        .in('id', athleteIds)
      for (const a of athletes ?? []) {
        const row = a as { id: string; name: string; surname: string | null }
        nameMap[row.id] = [row.name, row.surname].filter(Boolean).join(' ').trim()
      }
    }

    const items: LockerRow[] = list.map((r) => ({
      id: r.id as string,
      tenant_id: r.tenant_id as string,
      dolap_no: r.dolap_no as string,
      konum: (r.konum as string | null) ?? null,
      durum: (r.durum as string) ?? 'bos',
      kiralayan_athlete_id: (r.kiralayan_athlete_id as string | null) ?? null,
      kiralama_baslangic: (r.kiralama_baslangic as string | null) ?? null,
      kiralama_bitis: (r.kiralama_bitis as string | null) ?? null,
      aylik_ucret: r.aylik_ucret != null ? Number(r.aylik_ucret) : null,
      created_at: r.created_at as string,
      kiralayan_adi: r.kiralayan_athlete_id ? (nameMap[r.kiralayan_athlete_id as string] ?? '—') : undefined,
    }))

    return NextResponse.json({ items })
  } catch (e) {
    console.error('[franchise/dolaplar GET]', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = (await req.json()) as Record<string, unknown>
    const dolap_id = typeof body.dolap_id === 'string' ? body.dolap_id.trim() : null
    const athlete_id = typeof body.athlete_id === 'string' ? body.athlete_id.trim() : null

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    if (dolap_id && athlete_id) {
      const baslangic = typeof body.baslangic === 'string' ? body.baslangic.trim().slice(0, 10) : null
      const bitis = typeof body.bitis === 'string' ? body.bitis.trim().slice(0, 10) : null
      const ucret = typeof body.ucret === 'number' ? Number(body.ucret) : null
      if (!baslangic) return NextResponse.json({ error: 'baslangic (YYYY-MM-DD) gerekli' }, { status: 400 })

      const { data: locker, error: findErr } = await service
        .from('lockers')
        .select('id, durum')
        .eq('id', dolap_id)
        .eq('tenant_id', tenantId)
        .maybeSingle()

      if (findErr || !locker) return NextResponse.json({ error: 'Dolap bulunamadı' }, { status: 404 })
      if ((locker as { durum: string }).durum !== 'bos') return NextResponse.json({ error: 'Dolap boş değil' }, { status: 400 })

      const { data: athlete } = await service
        .from('athletes')
        .select('id')
        .eq('id', athlete_id)
        .eq('tenant_id', tenantId)
        .maybeSingle()
      if (!athlete) return NextResponse.json({ error: 'Sporcu bulunamadı' }, { status: 404 })

      const { error: updErr } = await service
        .from('lockers')
        .update({
          durum: 'kirali',
          kiralayan_athlete_id: athlete_id,
          kiralama_baslangic: baslangic,
          kiralama_bitis: bitis || null,
          aylik_ucret: ucret,
        })
        .eq('id', dolap_id)
        .eq('tenant_id', tenantId)

      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    const dolap_no = typeof body.dolap_no === 'string' ? body.dolap_no.trim() : ''
    if (!dolap_no) return NextResponse.json({ error: 'dolap_no gerekli' }, { status: 400 })
    const konum = typeof body.konum === 'string' ? body.konum.trim() || null : null

    const { data: created, error: insErr } = await service
      .from('lockers')
      .insert({ tenant_id: tenantId, dolap_no, konum })
      .select('id')
      .single()

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: (created as { id: string })?.id })
  } catch (e) {
    console.error('[franchise/dolaplar POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

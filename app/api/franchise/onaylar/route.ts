/**
 * GET/POST /api/franchise/onaylar
 * franchise_approval_queue tablosu (talep_tipi, baslik, aciklama, talep_eden_staff_id, durum, karar_notu, karar_tarihi, payload)
 * GET: durum=bekliyor|onaylandi|reddedildi|tumu, JOIN staff ile talep_eden_ad
 * POST: talep_tipi, baslik, aciklama?, payload? — talep_eden_staff_id/user_id mevcut kullanıcı
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const DURUMLAR = ['bekliyor', 'onaylandi', 'reddedildi', 'tumu'] as const
const TALEP_TIPLERI = ['personel_izin', 'personel_avans', 'diger'] as const

export type ApprovalQueueItem = {
  id: string
  talep_tipi: string
  baslik: string
  aciklama: string | null
  talep_eden_ad: string | null
  durum: string
  olusturma_tarihi: string
  karar_notu: string | null
  karar_tarihi: string | null
  payload: Record<string, unknown> | null
}

export type OnaylarGetResponse = {
  items: ApprovalQueueItem[]
  toplam: number
  bekleyen: number
  onaylanan: number
  reddedilen: number
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) {
      return NextResponse.json({
        items: [],
        toplam: 0,
        bekleyen: 0,
        onaylanan: 0,
        reddedilen: 0,
      } satisfies OnaylarGetResponse)
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      return NextResponse.json({
        items: [],
        toplam: 0,
        bekleyen: 0,
        onaylanan: 0,
        reddedilen: 0,
      } satisfies OnaylarGetResponse)
    }

    const service = createServiceClient(url, key)
    const durumParam = (req.nextUrl.searchParams.get('durum') ?? 'tumu').trim() as (typeof DURUMLAR)[number]
    const durum = DURUMLAR.includes(durumParam) ? durumParam : 'tumu'

    const [countBekleyen, countOnaylandi, countReddedildi, rowsRes] = await Promise.all([
      service.from('franchise_approval_queue').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('durum', 'bekliyor'),
      service.from('franchise_approval_queue').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('durum', 'onaylandi'),
      service.from('franchise_approval_queue').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('durum', 'reddedildi'),
      (() => {
        let q = service
          .from('franchise_approval_queue')
          .select('id, talep_tipi, baslik, aciklama, talep_eden_staff_id, durum, olusturma_tarihi, karar_notu, karar_tarihi, payload')
          .eq('tenant_id', tenantId)
          .order('olusturma_tarihi', { ascending: false })
          .limit(200)
        if (durum !== 'tumu') q = q.eq('durum', durum)
        return q
      })(),
    ])

    const bekleyen = Number((countBekleyen as { count?: number })?.count) || 0
    const onaylanan = Number((countOnaylandi as { count?: number })?.count) || 0
    const reddedilen = Number((countReddedildi as { count?: number })?.count) || 0

    const rows = (rowsRes.data ?? []) as Array<{
      id: string
      talep_tipi: string
      baslik: string
      aciklama: string | null
      talep_eden_staff_id: string | null
      durum: string
      olusturma_tarihi: string
      karar_notu: string | null
      karar_tarihi: string | null
      payload: Record<string, unknown> | null
    }>

    const staffIds = [...new Set(rows.map((r) => r.talep_eden_staff_id).filter(Boolean))] as string[]
    let staffMap: Record<string, string> = {}
    if (staffIds.length > 0) {
      const { data: staffRows } = await service
        .from('staff')
        .select('id, name, surname')
        .in('id', staffIds)
      if (Array.isArray(staffRows)) {
        staffMap = Object.fromEntries(
          staffRows.map((s: { id: string; name: string | null; surname: string | null }) => [
            s.id,
            [s.name, s.surname].filter(Boolean).join(' ').trim() || '—',
          ])
        )
      }
    }

    const items: ApprovalQueueItem[] = rows.map((r) => ({
      id: r.id,
      talep_tipi: r.talep_tipi,
      baslik: r.baslik,
      aciklama: r.aciklama,
      talep_eden_ad: (r.talep_eden_staff_id && staffMap[r.talep_eden_staff_id]) || null,
      durum: r.durum,
      olusturma_tarihi: r.olusturma_tarihi,
      karar_notu: r.karar_notu,
      karar_tarihi: r.karar_tarihi,
      payload: r.payload ?? null,
    }))

    return NextResponse.json({
      items,
      toplam: items.length,
      bekleyen,
      onaylanan,
      reddedilen,
    } satisfies OnaylarGetResponse)
  } catch (e) {
    console.error('[franchise/onaylar GET]', e)
    return NextResponse.json({
      items: [],
      toplam: 0,
      bekleyen: 0,
      onaylanan: 0,
      reddedilen: 0,
    } satisfies OnaylarGetResponse)
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = (await req.json()) as { talep_tipi?: string; baslik?: string; aciklama?: string; payload?: Record<string, unknown> }
    const talep_tipi =
      typeof body.talep_tipi === 'string' && TALEP_TIPLERI.includes(body.talep_tipi as (typeof TALEP_TIPLERI)[number])
        ? body.talep_tipi
        : 'diger'
    const baslik = typeof body.baslik === 'string' ? body.baslik.trim() : ''
    if (!baslik) return NextResponse.json({ error: 'baslik gerekli' }, { status: 400 })
    const aciklama = typeof body.aciklama === 'string' ? body.aciklama.trim() || null : null
    const payload = body.payload != null && typeof body.payload === 'object' ? body.payload : {}

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data: staffRow, error: staffErr } = await service
      .from('staff')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (staffErr || !staffRow) return NextResponse.json({ error: 'Personel kaydınız bulunamadı' }, { status: 403 })

    const staffId = (staffRow as { id: string }).id

    const { data: row, error } = await service
      .from('franchise_approval_queue')
      .insert({
        tenant_id: tenantId,
        talep_tipi,
        baslik,
        aciklama,
        talep_eden_staff_id: staffId,
        talep_eden_user_id: user.id,
        durum: 'bekliyor',
        payload,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: (row as { id: string })?.id })
  } catch (e) {
    console.error('[franchise/onaylar POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

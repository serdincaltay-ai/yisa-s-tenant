/**
 * GET /api/franchise/paket-dagilim
 * seans_packages + student_packages (athlete_id) → paket bazlı dağılım
 * Response (no query): { paketler: [{ id, paket_adi, aktif_uye_sayisi, toplam_kredi }], toplamAktif }
 * Query: ?paket_id=xxx → o paketteki aktif üyeler: { uyeler: [{ id, ad, soyad, kalan_kredi, bitis_tarihi, durum }] }
 * RLS: tenant_id (getTenantIdWithFallback).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export type PaketOzet = {
  id: string
  paket_adi: string
  aktif_uye_sayisi: number
  toplam_kredi: number
}

export type PaketUye = {
  id: string
  ad: string
  soyad: string
  kalan_kredi: number
  bitis_tarihi: string | null
  durum: 'aktif' | 'bitmek_uzere' | 'bitmis'
}

const emptyOzet = { paketler: [] as PaketOzet[], toplamAktif: 0 }
const emptyUyeler = { uyeler: [] as PaketUye[] }

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json(emptyOzet)

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json(emptyOzet)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json(emptyOzet)

    const service = createServiceClient(url, key)
    const paketId = req.nextUrl.searchParams.get('paket_id')?.trim() ?? null

    if (paketId) {
      const { data: rows } = await service
        .from('student_packages')
        .select('id, athlete_id, kalan_seans, bitis_tarihi, athletes(name, surname)')
        .eq('tenant_id', tenantId)
        .eq('package_id', paketId)
        .eq('status', 'aktif')
        .not('athlete_id', 'is', null)
        .order('bitis_tarihi', { ascending: true, nullsFirst: false })

      const today = new Date().toISOString().slice(0, 10)
      const uyeler: PaketUye[] = (rows ?? []).map((r: Record<string, unknown>) => {
        const a = r.athletes as { name?: string; surname?: string } | null
        const ad = a?.name ?? ''
        const soyad = a?.surname ?? ''
        const kalan = Number(r.kalan_seans) ?? 0
        const bitis = (r.bitis_tarihi as string | null) ?? null
        let durum: PaketUye['durum'] = 'aktif'
        if (kalan <= 0 || (bitis && bitis < today)) durum = 'bitmis'
        else if (kalan <= 3) durum = 'bitmek_uzere'
        return {
          id: (r.athlete_id as string) ?? '',
          ad,
          soyad,
          kalan_kredi: kalan,
          bitis_tarihi: bitis,
          durum,
        }
      })
      return NextResponse.json({ uyeler })
    }

    const { data: packages } = await service
      .from('seans_packages')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('status', 'aktif')
      .order('name')

    const { data: spRows } = await service
      .from('student_packages')
      .select('package_id, athlete_id, kalan_seans')
      .eq('tenant_id', tenantId)
      .eq('status', 'aktif')
      .not('athlete_id', 'is', null)

    const byPackage = new Map<string, { count: Set<string>; toplamKredi: number }>()
    for (const p of packages ?? []) {
      byPackage.set(p.id as string, { count: new Set(), toplamKredi: 0 })
    }
    const allAthleteIds = new Set<string>()

    for (const r of spRows ?? []) {
      const row = r as { package_id: string; athlete_id: string; kalan_seans: number }
      const entry = byPackage.get(row.package_id)
      if (entry) {
        entry.count.add(row.athlete_id)
        entry.toplamKredi += Number(row.kalan_seans) ?? 0
        allAthleteIds.add(row.athlete_id)
      }
    }

    const paketler: PaketOzet[] = (packages ?? []).map((p: { id: string; name: string }) => ({
      id: p.id,
      paket_adi: p.name ?? '—',
      aktif_uye_sayisi: byPackage.get(p.id)?.count.size ?? 0,
      toplam_kredi: Math.round((byPackage.get(p.id)?.toplamKredi ?? 0) * 100) / 100,
    }))

    return NextResponse.json({
      paketler,
      toplamAktif: allAthleteIds.size,
    })
  } catch (e) {
    console.error('[franchise/paket-dagilim]', e)
    return NextResponse.json(emptyOzet)
  }
}

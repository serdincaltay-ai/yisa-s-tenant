/**
 * GET /api/franchise/analiz?tip=satis|paket|aylik-aktif|aylik-bitecek|gunluk-giris|saatlik-giris|devamsizlik
 * RLS: tenant_id zorunlu (getTenantIdWithFallback).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const TIPLER = ['satis', 'paket', 'aylik-aktif', 'aylik-bitecek', 'gunluk-giris', 'saatlik-giris', 'devamsizlik'] as const
export type AnalizTip = (typeof TIPLER)[number]

function last30Days(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

function monthKeys(lastN: number): string[] {
  const out: string[] = []
  const d = new Date()
  for (let i = lastN - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
    out.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const tip = (req.nextUrl.searchParams.get('tip') ?? '').trim() as AnalizTip
    if (!TIPLER.includes(tip)) {
      return NextResponse.json({ error: 'Geçersiz tip. tip=satis|paket|aylik-aktif|aylik-bitecek|gunluk-giris|saatlik-giris|devamsizlik' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const from30 = last30Days()

    if (tip === 'satis') {
      const { data: rows, error } = await service
        .from('payments')
        .select('amount, payment_type, payment_method, created_at, status')
        .eq('tenant_id', tenantId)
        .gte('created_at', from30 + 'T00:00:00')
        .eq('status', 'paid')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      const byDay: Record<string, number> = {}
      const byType: Record<string, number> = {}
      const byMethod: Record<string, number> = {}
      let toplam = 0
      for (const r of rows ?? []) {
        const amt = Number(r.amount) ?? 0
        const day = (r.created_at as string).slice(0, 10)
        byDay[day] = (byDay[day] ?? 0) + amt
        const pt = (r.payment_type as string) ?? 'aidat'
        byType[pt] = (byType[pt] ?? 0) + amt
        const pm = (r.payment_method as string) ?? 'diger'
        byMethod[pm] = (byMethod[pm] ?? 0) + amt
        toplam += amt
      }
      const gunluk = Object.entries(byDay).map(([tarih, gunlukToplam]) => ({ tarih, toplam: gunlukToplam })).sort((a, b) => a.tarih.localeCompare(b.tarih))
      const odemeTipi = Object.entries(byType).map(([ad, value]) => ({ ad, value }))
      const odemeYontemi = Object.entries(byMethod).map(([ad, value]) => ({ ad, value }))
      return NextResponse.json({ gunluk, toplamGelir: toplam, odemeTipi, odemeYontemi })
    }

    if (tip === 'paket') {
      const { data: packRows } = await service
        .from('seans_packages')
        .select('id, name, price')
        .eq('tenant_id', tenantId)
      const { data: payRows } = await service
        .from('package_payments')
        .select('amount, student_package_id, status')
        .eq('tenant_id', tenantId)
        .eq('status', 'odendi')
      const { data: spRows } = await service
        .from('student_packages')
        .select('id, package_id')
        .eq('tenant_id', tenantId)
      const spById = new Map<string, string>()
      for (const sp of spRows ?? []) {
        spById.set((sp as { id: string; package_id: string }).id, (sp as { id: string; package_id: string }).package_id)
      }
      const byPackage = new Map<string, { satisSayisi: number; toplamGelir: number }>()
      for (const p of packRows ?? []) {
        const id = (p as { id: string; name: string; price: number }).id
        byPackage.set(id, { satisSayisi: 0, toplamGelir: 0 })
      }
      for (const pay of payRows ?? []) {
        const row = pay as { amount: number; student_package_id: string | null }
        const pkgId = row.student_package_id ? spById.get(row.student_package_id) : null
        if (pkgId) {
          const entry = byPackage.get(pkgId)
          if (entry) {
            entry.satisSayisi += 1
            entry.toplamGelir += Number(row.amount) ?? 0
          }
        }
      }
      const paketler = (packRows ?? []).map((p: { id: string; name: string }) => ({
        paket_adi: (p as { name: string }).name ?? '—',
        paket_id: (p as { id: string }).id,
        satis_sayisi: byPackage.get((p as { id: string }).id)?.satisSayisi ?? 0,
        toplam_gelir: Math.round((byPackage.get((p as { id: string }).id)?.toplamGelir ?? 0) * 100) / 100,
      }))
      return NextResponse.json({ paketler })
    }

    if (tip === 'aylik-aktif') {
      const aylar = monthKeys(12)
      const { data: rows } = await service
        .from('athletes')
        .select('created_at')
        .eq('tenant_id', tenantId)
      const byMonth: Record<string, number> = {}
      for (const ay of aylar) byMonth[ay] = 0
      const [y0, m0] = aylar[0].split('-').map(Number)
      const firstDay = new Date(y0!, m0! - 1, 1).getTime()
      for (const r of rows ?? []) {
        const created = (r.created_at as string)?.slice(0, 7)
        if (created && byMonth[created] !== undefined) byMonth[created]++
      }
      let cum = 0
      const seri = aylar.map((ay) => {
        cum += byMonth[ay] ?? 0
        return { ay, aktif: cum }
      })
      return NextResponse.json({ aylikAktif: seri })
    }

    if (tip === 'aylik-bitecek') {
      const { data: rows } = await service
        .from('athletes')
        .select('id, name, surname, ders_kredisi')
        .eq('tenant_id', tenantId)
        .lte('ders_kredisi', 3)
      const buckets = [
        { ay: 'Bu ay', sayi: 0 },
        { ay: 'Gelecek ay', sayi: 0 },
        { ay: '2 ay sonra', sayi: 0 },
      ]
      for (const r of rows ?? []) {
        const kredi = Number((r as { ders_kredisi?: number }).ders_kredisi) ?? 0
        if (kredi <= 0) buckets[0].sayi++
        else if (kredi <= 1) buckets[1].sayi++
        else buckets[2].sayi++
      }
      return NextResponse.json({ aylikBitecek: buckets, toplamBitecek: (rows ?? []).length })
    }

    if (tip === 'gunluk-giris') {
      const { data: rows, error } = await service
        .from('attendance')
        .select('lesson_date')
        .eq('tenant_id', tenantId)
        .gte('lesson_date', from30)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      const byDay: Record<string, number> = {}
      for (const r of rows ?? []) {
        const d = (r.lesson_date as string) ?? ''
        byDay[d] = (byDay[d] ?? 0) + 1
      }
      const gunluk = Object.entries(byDay).map(([tarih, sayi]) => ({ tarih, sayi })).sort((a, b) => a.tarih.localeCompare(b.tarih))
      return NextResponse.json({ gunluk })
    }

    if (tip === 'saatlik-giris') {
      const { data: rows, error } = await service
        .from('attendance')
        .select('lesson_time')
        .eq('tenant_id', tenantId)
        .gte('lesson_date', from30)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      const byHour: Record<number, number> = {}
      for (let h = 8; h <= 20; h++) byHour[h] = 0
      for (const r of rows ?? []) {
        const t = r.lesson_time as string | null
        if (t) {
          const hour = parseInt(String(t).slice(0, 2), 10)
          if (hour >= 8 && hour <= 20) byHour[hour] = (byHour[hour] ?? 0) + 1
        }
      }
      const saatlik = Object.entries(byHour).map(([saat, sayi]) => ({ saat: `${String(saat).padStart(2, '0')}:00`, sayi }))
      return NextResponse.json({ saatlik })
    }

    if (tip === 'devamsizlik') {
      const { data: rows, error } = await service
        .from('attendance')
        .select('athlete_id, status')
        .eq('tenant_id', tenantId)
        .gte('lesson_date', from30)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      const byAthlete = new Map<string, { total: number; absent: number }>()
      for (const r of rows ?? []) {
        const aid = (r.athlete_id as string) ?? ''
        if (!byAthlete.has(aid)) byAthlete.set(aid, { total: 0, absent: 0 })
        const entry = byAthlete.get(aid)!
        entry.total++
        if ((r.status as string) === 'absent') entry.absent++
      }
      const athleteIds = [...byAthlete.keys()]
      if (athleteIds.length === 0) return NextResponse.json({ devamsizlik: [] })
      const { data: athletes } = await service
        .from('athletes')
        .select('id, name, surname')
        .in('id', athleteIds)
      const nameMap = new Map<string, { name: string; surname: string | null }>()
      for (const a of athletes ?? []) {
        const row = a as { id: string; name: string; surname: string | null }
        nameMap.set(row.id, { name: row.name ?? '', surname: row.surname ?? null })
      }
      const list: Array<{ athlete_id: string; ad: string; toplam_ders: number; gelmedi: number; oran_yuzde: number }> = []
      for (const [aid, v] of byAthlete) {
        if (v.total < 3) continue
        const oran = v.total > 0 ? (v.absent / v.total) * 100 : 0
        if (oran <= 30) continue
        const n = nameMap.get(aid)
        list.push({
          athlete_id: aid,
          ad: n ? `${n.name} ${n.surname ?? ''}`.trim() : '—',
          toplam_ders: v.total,
          gelmedi: v.absent,
          oran_yuzde: Math.round(oran * 10) / 10,
        })
      }
      list.sort((a, b) => b.oran_yuzde - a.oran_yuzde)
      return NextResponse.json({ devamsizlik: list })
    }

    return NextResponse.json({ error: 'Bilinmeyen tip' }, { status: 400 })
  } catch (e) {
    console.error('[franchise/analiz]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

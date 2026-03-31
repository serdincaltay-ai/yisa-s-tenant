/**
 * GET /api/veli/measurements
 * Branş bazlı ölçüm sonuçları — gelisim_olcumleri + athlete_measurements birleşik
 * Query: athlete_id (zorunlu), branch (opsiyonel)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface MeasurementItem {
  id: string
  olcum_tarihi: string
  values: Record<string, number | null>
  genel_degerlendirme: string | null
  kaynak: string
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ items: [], params: [], averages: [] })

    const athleteId = req.nextUrl.searchParams.get('athlete_id')
    if (!athleteId) return NextResponse.json({ items: [], params: [], averages: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [], params: [], averages: [] })

    const service = createServiceClient(url, key)

    // Veli sahiplik kontrolü
    const { data: athlete } = await service
      .from('athletes')
      .select('id, tenant_id, branch, birth_date, gender')
      .eq('id', athleteId)
      .eq('parent_user_id', user.id)
      .single()
    if (!athlete) return NextResponse.json({ items: [], params: [], averages: [] })

    const branch = athlete.branch ?? ''
    const yas = athlete.birth_date
      ? Math.floor((Date.now() - new Date(athlete.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null

    // 1) Branş parametrelerini getir
    let params: { param_key: string; param_label: string; unit: string }[] = []
    try {
      const { data: paramData } = await service
        .from('branch_measurement_params')
        .select('param_key, param_label, unit, sort_order')
        .eq('branch', branch)
        .order('sort_order', { ascending: true })
      params = (paramData ?? []).map((p: Record<string, unknown>) => ({
        param_key: String(p.param_key),
        param_label: String(p.param_label),
        unit: String(p.unit ?? ''),
      }))
    } catch {
      // Tablo yoksa sessiz geç
    }

    // 2) Yaş grubu ortalamalarını getir
    let averages: { param_key: string; avg_value: number; min_value: number; max_value: number }[] = []
    if (yas != null) {
      try {
        let query = service
          .from('branch_measurement_averages')
          .select('param_key, avg_value, min_value, max_value')
          .eq('branch', branch)
          .lte('age_min', yas)
          .gte('age_max', yas)

        const gender = athlete.gender === 'E' || athlete.gender === 'K' ? athlete.gender : 'U'
        query = query.or(`gender.eq.${gender},gender.eq.U`)

        const { data: avgData } = await query
        averages = (avgData ?? []).map((a: Record<string, unknown>) => ({
          param_key: String(a.param_key),
          avg_value: Number(a.avg_value ?? 0),
          min_value: Number(a.min_value ?? 0),
          max_value: Number(a.max_value ?? 0),
        }))
      } catch {
        // Tablo yoksa sessiz geç
      }
    }

    // 3) gelisim_olcumleri tablosundan ölçümleri getir
    const items: MeasurementItem[] = []
    try {
      const { data: gelisimData } = await service
        .from('gelisim_olcumleri')
        .select('id, olcum_tarihi, olcum_verileri, antrenor_notu')
        .eq('tenant_id', athlete.tenant_id)
        .eq('athlete_id', athleteId)
        .order('olcum_tarihi', { ascending: false })
        .limit(50)

      for (const r of gelisimData ?? []) {
        const verileri = ((r as Record<string, unknown>).olcum_verileri ?? {}) as Record<string, unknown>
        const values: Record<string, number | null> = {}
        for (const p of params) {
          values[p.param_key] = verileri[p.param_key] != null ? Number(verileri[p.param_key]) : null
        }
        // Temel ölçümler de ekle
        values.boy = verileri.boy != null ? Number(verileri.boy) : null
        values.kilo = verileri.kilo != null ? Number(verileri.kilo) : null
        values.esneklik = verileri.esneklik != null ? Number(verileri.esneklik) : null

        items.push({
          id: String((r as Record<string, unknown>).id),
          olcum_tarihi: String((r as Record<string, unknown>).olcum_tarihi ?? ''),
          values,
          genel_degerlendirme: (r as Record<string, unknown>).antrenor_notu != null ? String((r as Record<string, unknown>).antrenor_notu) : null,
          kaynak: 'gelisim_olcumleri',
        })
      }
    } catch {
      // Tablo yoksa sessiz geç
    }

    // 4) Legacy athlete_measurements'dan da getir
    try {
      const { data: legacyData } = await service
        .from('athlete_measurements')
        .select('id, olcum_tarihi, boy, kilo, esneklik, dikey_sicrama, koordinasyon, kuvvet, dayaniklilik, denge, genel_degerlendirme')
        .eq('tenant_id', athlete.tenant_id)
        .eq('athlete_id', athleteId)
        .order('olcum_tarihi', { ascending: false })
        .limit(30)

      for (const r of legacyData ?? []) {
        const row = r as Record<string, unknown>
        const values: Record<string, number | null> = {
          boy: row.boy != null ? Number(row.boy) : null,
          kilo: row.kilo != null ? Number(row.kilo) : null,
          esneklik: row.esneklik != null ? Number(row.esneklik) : null,
          dikey_sicrama: row.dikey_sicrama != null ? Number(row.dikey_sicrama) : null,
          koordinasyon: row.koordinasyon != null ? Number(row.koordinasyon) : null,
          kuvvet: row.kuvvet != null ? Number(row.kuvvet) : null,
          dayaniklilik: row.dayaniklilik != null ? Number(row.dayaniklilik) : null,
          denge: row.denge != null ? Number(row.denge) : null,
        }
        items.push({
          id: String(row.id),
          olcum_tarihi: String(row.olcum_tarihi ?? ''),
          values,
          genel_degerlendirme: row.genel_degerlendirme != null ? String(row.genel_degerlendirme) : null,
          kaynak: 'athlete_measurements',
        })
      }
    } catch {
      // Tablo yoksa sessiz geç
    }

    // Tarihe göre sırala
    items.sort((a, b) => (b.olcum_tarihi > a.olcum_tarihi ? 1 : -1))

    return NextResponse.json({
      items: items.slice(0, 50),
      params,
      averages,
      branch,
      yas,
    })
  } catch (e) {
    console.error('[veli/measurements]', e)
    return NextResponse.json({ items: [], params: [], averages: [] })
  }
}

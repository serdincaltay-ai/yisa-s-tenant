/**
 * Veli: çocuğun ölçüm geçmişi (athlete_measurements + gelisim_olcumleri birleşik)
 * Faz 4 güncellemesi: gelisim_olcumleri tablosunu da sorgular
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface OlcumItem {
  id: string
  olcum_tarihi: string
  boy: number | null
  kilo: number | null
  esneklik: number | null
  genel_degerlendirme: string | null
  kaynak: 'athlete_measurements' | 'gelisim_olcumleri'
  olcum_verileri?: Record<string, unknown>
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ items: [] })

    const athleteId = req.nextUrl.searchParams.get('athlete_id')
    if (!athleteId) return NextResponse.json({ items: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)

    const { data: athlete } = await service.from('athletes').select('id, tenant_id').eq('id', athleteId).eq('parent_user_id', user.id).single()
    if (!athlete) return NextResponse.json({ items: [] })

    // 1) Legacy: athlete_measurements
    const { data: legacyItems } = await service
      .from('athlete_measurements')
      .select('id, olcum_tarihi, boy, kilo, esneklik, genel_degerlendirme')
      .eq('tenant_id', athlete.tenant_id)
      .eq('athlete_id', athleteId)
      .order('olcum_tarihi', { ascending: false })
      .limit(30)

    const legacy: OlcumItem[] = (legacyItems ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      olcum_tarihi: String(r.olcum_tarihi ?? ''),
      boy: r.boy != null ? Number(r.boy) : null,
      kilo: r.kilo != null ? Number(r.kilo) : null,
      esneklik: r.esneklik != null ? Number(r.esneklik) : null,
      genel_degerlendirme: r.genel_degerlendirme != null ? String(r.genel_degerlendirme) : null,
      kaynak: 'athlete_measurements' as const,
    }))

    // 2) Yeni: gelisim_olcumleri (Faz 4)
    let gelisimItems: OlcumItem[] = []
    try {
      const { data: gelisimData } = await service
        .from('gelisim_olcumleri')
        .select('id, olcum_tarihi, olcum_verileri, antrenor_notu')
        .eq('tenant_id', athlete.tenant_id)
        .eq('athlete_id', athleteId)
        .order('olcum_tarihi', { ascending: false })
        .limit(30)

      gelisimItems = (gelisimData ?? []).map((r: Record<string, unknown>) => {
        const verileri = (r.olcum_verileri ?? {}) as Record<string, unknown>
        return {
          id: String(r.id),
          olcum_tarihi: String(r.olcum_tarihi ?? ''),
          boy: verileri.boy != null ? Number(verileri.boy) : null,
          kilo: verileri.kilo != null ? Number(verileri.kilo) : null,
          esneklik: verileri.esneklik != null ? Number(verileri.esneklik) : null,
          genel_degerlendirme: r.antrenor_notu != null ? String(r.antrenor_notu) : null,
          kaynak: 'gelisim_olcumleri' as const,
          olcum_verileri: verileri,
        }
      })
    } catch {
      // gelisim_olcumleri tablosu henüz yoksa sessiz geç
    }

    // Birleştir ve tarihe göre sırala
    const allItems = [...legacy, ...gelisimItems]
      .sort((a, b) => (b.olcum_tarihi > a.olcum_tarihi ? 1 : -1))
      .slice(0, 50)

    return NextResponse.json({ items: allItems })
  } catch (e) {
    console.error('[veli/gelisim]', e)
    return NextResponse.json({ items: [] })
  }
}

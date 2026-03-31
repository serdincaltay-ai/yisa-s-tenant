/**
 * GET /api/franchise/belgeler/kontrol
 * athlete_health_records tablosundan saglik_raporu_gecerlilik < bugün + 30 gün olanları listele.
 * Franchise sahibi yetkisi gerektirir.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

interface BelgeKontrolItem {
  id: string
  athlete_id: string
  athlete_name: string
  record_type: string
  saglik_raporu_gecerlilik: string | null
  durum: 'gecmis' | 'yaklasan' | 'gecerli' | 'belirsiz'
  kalan_gun: number | null
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

    // Tenant'a ait sporcuları bul
    const { data: tenantAthletes } = await service
      .from('athletes')
      .select('id')
      .eq('tenant_id', tenantId)

    const athleteIds = (tenantAthletes ?? []).map((a: { id: string }) => a.id)
    if (athleteIds.length === 0) return NextResponse.json({ items: [] })

    const bugun = new Date()
    const otuzGunSonra = new Date(bugun)
    otuzGunSonra.setDate(otuzGunSonra.getDate() + 30)
    const otuzGunStr = otuzGunSonra.toISOString().slice(0, 10)

    // saglik_raporu_gecerlilik < bugün + 30 gün VEYA NULL olanları getir
    const { data: records, error } = await service
      .from('athlete_health_records')
      .select('id, athlete_id, record_type, saglik_raporu_gecerlilik, athletes(name, surname)')
      .in('athlete_id', athleteIds)
      .or(`saglik_raporu_gecerlilik.is.null,saglik_raporu_gecerlilik.lte.${otuzGunStr}`)
      .order('saglik_raporu_gecerlilik', { ascending: true, nullsFirst: true })

    if (error) {
      console.error('[belgeler/kontrol GET]', error.message)
      return NextResponse.json({ items: [], error: error.message })
    }

    const bugunStr = bugun.toISOString().slice(0, 10)

    const items: BelgeKontrolItem[] = (records ?? []).map((r: Record<string, unknown>) => {
      const a = r.athletes as { name?: string; surname?: string } | null
      const gecerlilik = r.saglik_raporu_gecerlilik as string | null

      let durum: BelgeKontrolItem['durum'] = 'belirsiz'
      let kalan_gun: number | null = null

      if (gecerlilik) {
        const gecerlilikDate = new Date(gecerlilik + 'T00:00:00')
        const bugunDate = new Date(bugunStr + 'T00:00:00')
        const fark = Math.ceil((gecerlilikDate.getTime() - bugunDate.getTime()) / (1000 * 60 * 60 * 24))
        kalan_gun = fark

        if (fark < 0) {
          durum = 'gecmis'
        } else if (fark <= 30) {
          durum = 'yaklasan'
        } else {
          durum = 'gecerli'
        }
      }

      return {
        id: r.id as string,
        athlete_id: r.athlete_id as string,
        athlete_name: a ? `${a.name ?? ''} ${a.surname ?? ''}`.trim() : '—',
        record_type: r.record_type as string,
        saglik_raporu_gecerlilik: gecerlilik,
        durum,
        kalan_gun,
      }
    })

    // Sadece gecmis, yaklasan ve belirsiz olanları döndür (gecerli olanları filtrele)
    const uyarilar = items.filter((i) => i.durum !== 'gecerli')

    return NextResponse.json({
      items: uyarilar,
      toplam: uyarilar.length,
      gecmis: uyarilar.filter((i) => i.durum === 'gecmis').length,
      yaklasan: uyarilar.filter((i) => i.durum === 'yaklasan').length,
      belirsiz: uyarilar.filter((i) => i.durum === 'belirsiz').length,
    })
  } catch (e) {
    console.error('[belgeler/kontrol GET]', e)
    return NextResponse.json({ items: [] })
  }
}

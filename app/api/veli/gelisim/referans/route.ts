/**
 * Veli: Reference values for the athlete's age/gender
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

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

    // Get athlete info to determine age and gender
    const { data: athlete } = await service
      .from('athletes')
      .select('id, birth_date, gender')
      .eq('id', athleteId)
      .eq('parent_user_id', user.id)
      .single()

    if (!athlete) return NextResponse.json({ items: [] })

    const yas = athlete.birth_date
      ? Math.floor((Date.now() - new Date(athlete.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null

    if (yas == null) return NextResponse.json({ items: [] })

    const cinsiyet = athlete.gender === 'E' || athlete.gender === 'K' ? athlete.gender : null

    let query = service
      .from('reference_values')
      .select('parametre, deger_min, deger_max, seviye, brans_uygunluk')
      .lte('yas_min', yas)
      .gte('yas_max', yas)

    if (cinsiyet) {
      query = query.eq('cinsiyet', cinsiyet)
    }

    const { data: items } = await query

    const mapped = (items ?? []).map((r: Record<string, unknown>) => ({
      parametre: String(r.parametre ?? ''),
      deger_min: Number(r.deger_min ?? 0),
      deger_max: Number(r.deger_max ?? 0),
      seviye: String(r.seviye ?? ''),
    }))

    return NextResponse.json({ items: mapped })
  } catch (e) {
    console.error('[veli/gelisim/referans]', e)
    return NextResponse.json({ items: [] })
  }
}

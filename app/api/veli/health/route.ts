import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const DEFAULT_HEALTH = {
  sleep: { average: 0, target: 9 },
  nutrition: { score: 0, target: 80 },
  posture: { status: 'Veri yok', lastCheck: '—' },
  flexibility: { score: 0, change: '—' },
  strength: { score: 0, change: '—' },
  speed: { score: 0, change: '—' },
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: DEFAULT_HEALTH })

    const { searchParams } = new URL(req.url)
    const athleteId = searchParams.get('athlete_id')
    if (!athleteId) return NextResponse.json({ data: DEFAULT_HEALTH })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ data: DEFAULT_HEALTH })

    const service = createServiceClient(url, key)

    // Veli sahiplik kontrolu — sadece kendi cocugunun verisini gorebilir
    const { data: athlete } = await service
      .from('athletes')
      .select('id')
      .eq('id', athleteId)
      .eq('parent_user_id', user.id)
      .maybeSingle()
    if (!athlete) return NextResponse.json({ data: DEFAULT_HEALTH })

    const { data, error } = await service
      .from('athlete_health')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ data: DEFAULT_HEALTH })
    }

    const row = data as Record<string, unknown>
    return NextResponse.json({
      data: {
        sleep: { average: Number(row.sleep_avg ?? 0), target: Number(row.sleep_target ?? 9) },
        nutrition: { score: Number(row.nutrition_score ?? 0), target: Number(row.nutrition_target ?? 80) },
        posture: { status: String(row.posture_status ?? 'Veri yok'), lastCheck: String(row.posture_last_check ?? '—') },
        flexibility: { score: Number(row.flexibility_score ?? 0), change: String(row.flexibility_change ?? '—') },
        strength: { score: Number(row.strength_score ?? 0), change: String(row.strength_change ?? '—') },
        speed: { score: Number(row.speed_score ?? 0), change: String(row.speed_change ?? '—') },
      },
    })
  } catch {
    return NextResponse.json({ data: DEFAULT_HEALTH })
  }
}

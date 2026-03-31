import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ items: [] })

    const { searchParams } = new URL(req.url)
    const athleteId = searchParams.get('athlete_id')
    if (!athleteId) return NextResponse.json({ items: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)

    // Veli sahiplik kontrolu — sadece kendi cocugunun verisini gorebilir
    const { data: athlete } = await service
      .from('athletes')
      .select('id')
      .eq('id', athleteId)
      .eq('parent_user_id', user.id)
      .maybeSingle()
    if (!athlete) return NextResponse.json({ items: [] })

    const { data, error } = await service
      .from('athlete_movements')
      .select('id, movement_id, tamamlandi, tamamlanma_tarihi, antrenor_notu, created_at')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ items: [] })
    }

    const items = (data ?? []).map((d: Record<string, unknown>) => ({
      name: d.antrenor_notu ? String(d.antrenor_notu) : 'Hareket',
      status: d.tamamlandi ? 'completed' : 'upcoming',
      date: d.tamamlanma_tarihi ? String(d.tamamlanma_tarihi) : undefined,
    }))

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

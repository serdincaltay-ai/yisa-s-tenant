import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const athleteId = searchParams.get('athlete_id')
    const days = parseInt(searchParams.get('days') ?? '30', 10) || 30

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [], attendanceRate: 0 })

    const service = createServiceClient(url, key)

    let athleteIds: string[] = []
    if (athleteId) {
      const { data: ch } = await service.from('athletes').select('id').eq('id', athleteId).eq('parent_user_id', user.id).maybeSingle()
      if (ch) athleteIds = [ch.id]
    } else {
      const { data: children } = await service.from('athletes').select('id').eq('parent_user_id', user.id)
      athleteIds = (children ?? []).map((c: { id: string }) => c.id)
    }

    if (athleteIds.length === 0) return NextResponse.json({ items: [], attendanceRate: 0 })

    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().slice(0, 10)

    const { data, error } = await service
      .from('attendance')
      .select('id, athlete_id, lesson_date, status, athletes(name, surname)')
      .in('athlete_id', athleteIds)
      .gte('lesson_date', sinceStr)
      .order('lesson_date', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ items: [], attendanceRate: 0, error: error.message })

    const items = (data ?? []).map((row: Record<string, unknown>) => {
      const a = row.athletes as Record<string, unknown> | null
      return {
        id: row.id,
        athlete_id: row.athlete_id,
        athlete_name: a ? `${a.name ?? ''} ${a.surname ?? ''}`.trim() : '—',
        lesson_date: row.lesson_date,
        status: row.status,
      }
    })

    const present = items.filter((i) => i.status === 'present').length
    const total = items.length
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0

    return NextResponse.json({ items, attendanceRate })
  } catch (e) {
    console.error('[veli/attendance GET]', e)
    return NextResponse.json({ items: [], attendanceRate: 0 })
  }
}

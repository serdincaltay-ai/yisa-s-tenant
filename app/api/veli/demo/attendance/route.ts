import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const DEMO_VELI_EMAIL = 'demo.veli@yisa-s.com'

/** Demo veli: athlete_id için yoklama (auth yok) */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const athleteId = searchParams.get('athlete_id')
    const days = parseInt(searchParams.get('days') ?? '30', 10) || 30

    if (!athleteId) return NextResponse.json({ items: [], attendanceRate: 0 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [], attendanceRate: 0 })

    const service = createClient(url, key)

    const { data: athlete } = await service
      .from('athletes')
      .select('id')
      .eq('id', athleteId)
      .ilike('parent_email', DEMO_VELI_EMAIL)
      .maybeSingle()

    if (!athlete) return NextResponse.json({ items: [], attendanceRate: 0 })

    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().slice(0, 10)

    const { data, error } = await service
      .from('attendance')
      .select('id, athlete_id, lesson_date, status, athletes(name, surname)')
      .eq('athlete_id', athleteId)
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
    console.error('[veli/demo/attendance]', e)
    return NextResponse.json({ items: [], attendanceRate: 0 })
  }
}

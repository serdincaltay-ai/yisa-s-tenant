/**
 * Rutin görev tamamlandı → last_run / next_run güncelle (COO)
 * POST: { id } → markRoutineRun → next_run hesaplanır
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import { computeNextRun, type ScheduleType } from '@/lib/db/routine-tasks'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = body.id as string | undefined
    if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

    const db = getSupabaseServer()
    if (!db) return NextResponse.json({ error: 'Supabase bağlantısı yok' }, { status: 500 })

    const { data: task, error: fetchError } = await db
      .from('routine_tasks')
      .select('schedule, schedule_time')
      .eq('id', id)
      .single()

    if (fetchError || !task) {
      return NextResponse.json({ error: 'Rutin görev bulunamadı' }, { status: 404 })
    }

    const schedule = (task.schedule ?? 'daily') as ScheduleType
    const scheduleTime = task.schedule_time ?? '02:00'
    const nextRun = computeNextRun(schedule, scheduleTime)
    if (!nextRun) return NextResponse.json({ error: 'Geçersiz schedule' }, { status: 400 })

    const { error: updateError } = await db
      .from('routine_tasks')
      .update({
        last_run: new Date().toISOString(),
        next_run: nextRun.toISOString(),
      })
      .eq('id', id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    return NextResponse.json({ ok: true, id, next_run: nextRun.toISOString() })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Tamamlanma hatası', detail: err }, { status: 500 })
  }
}

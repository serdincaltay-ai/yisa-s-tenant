/**
 * Rutin Görev API - routine_tasks CRUD ve COO tetikleme
 * GET: list (active_only query)
 * POST: create (task_type, director_key, command, schedule, schedule_time?, created_by?)
 * PATCH: toggle (id, is_active)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getRoutineTasks,
  getDueRoutineTasks,
  createRoutineTask,
  toggleRoutineTask,
  deleteRoutineTask,
  type CreateRoutineTaskParams,
  type ScheduleType,
} from '@/lib/db/routine-tasks'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dueOnly = searchParams.get('due') === 'true'
    const activeOnly = searchParams.get('active_only') !== 'false'

    if (dueOnly) {
      const { data, error } = await getDueRoutineTasks()
      if (error) return NextResponse.json({ error }, { status: 500 })
      return NextResponse.json({ ok: true, data: data ?? [], due: true })
    }

    const { data, error } = await getRoutineTasks(activeOnly)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Rutin listesi hatası', detail: err }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const params: CreateRoutineTaskParams = {
      task_type: body.task_type ?? 'general',
      director_key: body.director_key ?? 'GENEL',
      command: body.command ?? '',
      schedule: (body.schedule ?? 'daily') as ScheduleType,
      schedule_time: body.schedule_time ?? '02:00',
      created_by: body.created_by ?? body.user_id ?? undefined,
    }
    if (!params.command.trim()) {
      return NextResponse.json({ error: 'command gerekli' }, { status: 400 })
    }
    const { id, error } = await createRoutineTask(params)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Rutin oluşturma hatası', detail: err }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const id = body.id as string | undefined
    const isActive = body.is_active as boolean | undefined
    if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
    if (typeof isActive !== 'boolean') return NextResponse.json({ error: 'is_active (boolean) gerekli' }, { status: 400 })
    const { error } = await toggleRoutineTask(id, isActive)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, id, is_active: isActive })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Rutin güncelleme hatası', detail: err }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
    const { error } = await deleteRoutineTask(id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Rutin silme hatası', detail: err }, { status: 500 })
  }
}

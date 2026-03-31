/**
 * CEO Rutin Havuzu API (ceo_routines)
 * GET: Aktif rutinler veya zamanı gelenler (due=true)
 * POST: Yeni rutin oluştur
 * PATCH: Rutin güncelle / devre dışı bırak
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getActiveCeoRoutines,
  getDueCeoRoutines,
  createCeoRoutine,
  updateCeoRoutineResult,
  deactivateCeoRoutine,
  type CreateCeoRoutineParams,
  type ScheduleType,
} from '@/lib/db/ceo-routines'
import { requireInternalOrPatron } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireInternalOrPatron(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const due = searchParams.get('due') === 'true'
    const { data, error } = due ? await getDueCeoRoutines() : await getActiveCeoRoutines()
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [], due })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'CEO rutin listesi hatası', detail: err }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth2 = await requireInternalOrPatron(req)
    if (auth2 instanceof NextResponse) return auth2

    const body = await req.json()
    const params: CreateCeoRoutineParams = {
      routine_name: body.routine_name ?? 'Rutin',
      routine_type: (body.routine_type ?? 'rapor') as CreateCeoRoutineParams['routine_type'],
      director_key: body.director_key ?? 'CDO',
      command_template: body.command_template ?? '',
      data_sources: body.data_sources ?? [],
      schedule: (body.schedule ?? 'daily') as ScheduleType,
      schedule_time: body.schedule_time ?? '02:00',
      created_by: body.created_by ?? body.user_id ?? undefined,
    }
    if (!params.command_template.trim()) {
      return NextResponse.json({ error: 'command_template gerekli' }, { status: 400 })
    }
    const { id, error } = await createCeoRoutine(params)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'CEO rutin oluşturma hatası', detail: err }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth3 = await requireInternalOrPatron(req)
    if (auth3 instanceof NextResponse) return auth3

    const body = await req.json()
    const id = body.id as string | undefined
    const is_active = body.is_active as boolean | undefined
    const last_result = body.last_result as Record<string, unknown> | undefined
    const next_run = body.next_run as string | undefined
    if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
    if (is_active === false) {
      const { error } = await deactivateCeoRoutine(id)
      if (error) return NextResponse.json({ error }, { status: 500 })
      return NextResponse.json({ ok: true, id, is_active: false })
    }
    if (last_result != null && next_run) {
      const { error } = await updateCeoRoutineResult(id, last_result, next_run)
      if (error) return NextResponse.json({ error }, { status: 500 })
      return NextResponse.json({ ok: true, id })
    }
    return NextResponse.json({ error: 'is_active veya (last_result + next_run) gerekli' }, { status: 400 })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'CEO rutin güncelleme hatası', detail: err }, { status: 500 })
  }
}

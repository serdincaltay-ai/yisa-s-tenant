/**
 * COO - Zamanı gelen rutin görevleri çalıştır
 * GET veya POST: ceo_routines'dan zamanı gelenleri alır, CELF ile çalıştırır, next_run günceller.
 * Vercel Cron veya dış tetikleyici ile periyodik çağrılabilir.
 * Tarih: 30 Ocak 2026
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDueCeoRoutines, updateCeoRoutineResult, computeNextRun, type ScheduleType } from '@/lib/db/ceo-routines'
import { runCelfDirector } from '@/lib/ai/celf-execute'
import { archiveTaskResult } from '@/lib/robots/data-robot'
import type { DirectorKey } from '@/lib/robots/celf-center'
import { requireCronOrPatron } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  return runDueRoutines(req)
}

export async function POST(req: NextRequest) {
  return runDueRoutines(req)
}

async function runDueRoutines(req: NextRequest) {
  try {
    const auth = await requireCronOrPatron(req)
    if (auth instanceof NextResponse) return auth

    const { data: routines, error } = await getDueCeoRoutines()
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    if (!routines || routines.length === 0) {
      return NextResponse.json({ ok: true, message: 'Zamanı gelen rutin yok.', run: 0 })
    }

    const results: { id: string; director_key: string; status: string; next_run?: string }[] = []

    for (const routine of routines as { id: string; director_key: string; command_template: string; schedule: ScheduleType; schedule_time?: string | null }[]) {
      const directorKey = (routine.director_key ?? 'CCO') as DirectorKey
      const command = routine.command_template || 'Durum özeti ver.'
      const celfResult = await runCelfDirector(directorKey, command)
      const resultText = celfResult.text ?? ('errorReason' in celfResult ? String(celfResult.errorReason) : 'Yanıt oluşturulamadı.')
      const provider = 'provider' in celfResult ? celfResult.provider : '—'
      const nextRun = computeNextRun(routine.schedule, routine.schedule_time ?? undefined)
      const nextRunIso = nextRun?.toISOString() ?? new Date(Date.now() + 86400000).toISOString()
      const updateErr = await updateCeoRoutineResult(
        routine.id,
        { text: resultText, provider, director_key: directorKey },
        nextRunIso
      )
      if (updateErr.error) {
        results.push({ id: routine.id, director_key: directorKey, status: 'update_failed' })
        continue
      }
      // Veri Arşivleme: Rutin sonucu task_results'a yaz (anayasa uyumu)
      await archiveTaskResult({
        routineTaskId: routine.id,
        directorKey,
        aiProviders: celfResult.text ? [(celfResult as { provider: string }).provider] : [],
        inputCommand: command,
        outputResult: resultText,
        status: celfResult.text ? 'completed' : 'failed',
      })
      results.push({ id: routine.id, director_key: directorKey, status: 'ok', next_run: nextRunIso })
    }

    return NextResponse.json({
      ok: true,
      message: `${results.length} rutin işlendi.`,
      run: results.length,
      results,
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'COO run-due hatası', detail: err }, { status: 500 })
  }
}

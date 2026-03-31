/**
 * YİSA-S Sistem Başlangıç API'si
 * Direktörlük ilk görevlerini tetikler
 * Tarih: 31 Ocak 2026
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getAllPendingInitialTasks,
  getPendingInitialTasks,
  updateTaskStatus,
  getDirectorateStartupSummary,
  type InitialTask,
} from '@/lib/robots/directorate-initial-tasks'
import { runCelfDirector } from '@/lib/ai/celf-execute'
import { createCeoTask, insertCelfLog, createPatronCommand } from '@/lib/db/ceo-celf'
import { saveCeoTemplate } from '@/lib/db/ceo-templates'
import type { TemplateType } from '@/lib/db/ceo-templates'
import { requirePatronOrFlow } from '@/lib/auth/api-auth'
import type { DirectorKey } from '@/lib/robots/celf-center'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const director = searchParams.get('director') as DirectorKey | null

    if (director) {
      // Tek direktörlük görevleri
      const tasks = getPendingInitialTasks(director)
      return NextResponse.json({
        director,
        tasks,
        count: tasks.length,
      })
    }

    // Tüm özet
    const summary = getDirectorateStartupSummary()
    const allPending = getAllPendingInitialTasks()

    return NextResponse.json({
      summary,
      total_pending: allPending.length,
      next_tasks: allPending.slice(0, 5), // İlk 5 öncelikli görev
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Başlangıç durumu alınamadı', detail: err }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePatronOrFlow()
    if (auth instanceof NextResponse) return auth
    const userId = auth.user.id

    const body = await req.json()
    const action = body.action as 'run_task' | 'run_director' | 'run_all'
    const taskId = body.task_id as string | undefined
    const director = body.director as DirectorKey | undefined

    // Tek görev çalıştır
    if (action === 'run_task' && taskId) {
      const allTasks = getAllPendingInitialTasks()
      const task = allTasks.find((t) => t.id === taskId)

      if (!task) {
        return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 })
      }

      const result = await runInitialTask(task, userId)
      return NextResponse.json(result)
    }

    // Direktörlük görevlerini çalıştır
    if (action === 'run_director' && director) {
      const tasks = getPendingInitialTasks(director)
      const results: { task: string; success: boolean; message: string }[] = []

      for (const task of tasks) {
        if (task.requiresApproval) {
          // Onay gerektiren görevleri kuyruğa al
          const queued = await queueTaskForApproval(task, userId)
          results.push({
            task: task.id,
            success: true,
            message: queued.message ?? 'Onay kuyruğuna alındı',
          })
        } else {
          // Diğerlerini çalıştır
          const result = await runInitialTask(task, userId)
          results.push({
            task: task.id,
            success: result.success,
            message: result.message ?? '',
          })
        }
      }

      return NextResponse.json({
        director,
        results,
        completed: results.filter((r) => r.success).length,
        total: results.length,
      })
    }

    // Tüm görevleri çalıştır (dikkatli kullan)
    if (action === 'run_all') {
      const allTasks = getAllPendingInitialTasks()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summary: Record<DirectorKey, { success: number; failed: number; queued: number }> = {} as any

      for (const task of allTasks) {
        if (!summary[task.directorKey]) {
          summary[task.directorKey] = { success: 0, failed: 0, queued: 0 }
        }

        if (task.requiresApproval) {
          await queueTaskForApproval(task, userId)
          summary[task.directorKey].queued++
        } else {
          const result = await runInitialTask(task, userId)
          if (result.success) {
            summary[task.directorKey].success++
          } else {
            summary[task.directorKey].failed++
          }
        }
      }

      return NextResponse.json({
        action: 'run_all',
        summary,
        total_tasks: allTasks.length,
      })
    }

    return NextResponse.json(
      { error: 'Geçersiz action. (run_task, run_director, run_all)' },
      { status: 400 }
    )
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Başlangıç görevi hatası', detail: err }, { status: 500 })
  }
}

/**
 * Tek bir başlangıç görevini çalıştır
 */
async function runInitialTask(
  task: InitialTask,
  userId?: string
): Promise<{ success: boolean; message?: string; result?: string }> {
  try {
    updateTaskStatus(task.id, 'running')

    // CEO task oluştur
    const ceoResult = await createCeoTask({
      user_id: userId,
      task_description: `[Başlangıç Görevi] ${task.name}: ${task.command}`,
      task_type: 'başlangıç',
      director_key: task.directorKey,
    })

    // CELF'e gönder
    const celfResult = await runCelfDirector(task.directorKey, task.command)

    // Log
    if (ceoResult.id) {
      await insertCelfLog({
        ceo_task_id: ceoResult.id,
        director_key: task.directorKey,
        action: 'initial_task',
        input_summary: task.command.substring(0, 200),
        output_summary: celfResult.text?.substring(0, 300) ?? 'Sonuç yok',
      })
    }

    updateTaskStatus(task.id, celfResult.text ? 'completed' : 'failed')

    // Şablon görevi ise ceo_templates'e kaydet
    if (celfResult.text && /şablon|sablon|template/i.test(task.name)) {
      const typeMap: Record<string, TemplateType> = {
        CFO: 'rapor',
        CTO: 'dashboard',
        CPO: 'ui',
        CMO: 'email',
        CDO: 'rapor',
        CHRO: 'bildirim',
        CLO: 'rapor',
        CSPO: 'rapor',
      }
      const templateType = (typeMap[task.directorKey] ?? 'rapor') as TemplateType
      await saveCeoTemplate({
        template_name: task.name,
        template_type: templateType,
        director_key: task.directorKey,
        content: { body: celfResult.text, source: 'startup_task', task_id: task.id },
        is_approved: false,
      })
    }

    return {
      success: !!celfResult.text,
      message: celfResult.text ? 'Görev tamamlandı' : 'Görev başarısız',
      result: celfResult.text ?? undefined,
    }
  } catch (e) {
    updateTaskStatus(task.id, 'failed')
    const err = e instanceof Error ? e.message : String(e)
    return { success: false, message: 'Hata: ' + err }
  }
}

/**
 * Onay gerektiren görevi kuyruğa al
 */
async function queueTaskForApproval(
  task: InitialTask,
  userId?: string
): Promise<{ success: boolean; message?: string; commandId?: string }> {
  try {
    // CEO task oluştur
    const ceoResult = await createCeoTask({
      user_id: userId,
      task_description: `[Başlangıç Görevi - Onay Bekliyor] ${task.name}: ${task.command}`,
      task_type: 'başlangıç',
      director_key: task.directorKey,
    })

    // Patron onay kuyruğuna al
    const cmd = await createPatronCommand({
      user_id: userId,
      command: task.command,
      ceo_task_id: ceoResult.id,
      output_payload: {
        task_id: task.id,
        task_name: task.name,
        director_key: task.directorKey,
        is_initial_task: true,
        requires_approval: true,
        flow: 'Başlangıç Görevi → Patron Onay',
      },
    })

    return {
      success: true,
      message: 'Onay kuyruğuna alındı',
      commandId: cmd.id,
    }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return { success: false, message: 'Kuyruk hatası: ' + err }
  }
}

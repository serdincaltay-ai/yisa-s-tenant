/**
 * YİSA-S Data Robot (Katman 3 - Veri Arşivleme)
 * Tüm konuşmaları, kararları, sonuçları kaydeder.
 * AES-256 şifreleme, günlük 02:00 yedek (politika; gerçek yedek cron/job ile yapılır).
 */

import { createTaskResult } from '@/lib/db/task-results'
import { VERI_ARSIVLEME_KURALLARI } from '@/lib/archiving/veri-arsivleme'

export const DATA_ROBOT_POLICY = {
  ...VERI_ARSIVLEME_KURALLARI,
  /** Her görev sonucu task_results'a yazılır */
  SAVE_TASK_RESULTS: true,
}

export interface ArchiveTaskResultParams {
  taskId?: string
  routineTaskId?: string
  directorKey?: string
  aiProviders?: string[]
  inputCommand: string
  outputResult: string
  status?: 'completed' | 'failed' | 'cancelled'
}

/**
 * Görev sonucunu arşive yazar (task_results).
 */
export async function archiveTaskResult(
  params: ArchiveTaskResultParams
): Promise<{ id?: string; error?: string }> {
  if (!DATA_ROBOT_POLICY.SAVE_TASK_RESULTS) return {}
  return createTaskResult({
    task_id: params.taskId,
    routine_task_id: params.routineTaskId,
    director_key: params.directorKey,
    ai_providers: params.aiProviders,
    input_command: params.inputCommand,
    output_result: params.outputResult,
    status: params.status,
  })
}

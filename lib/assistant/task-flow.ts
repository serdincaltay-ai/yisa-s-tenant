/**
 * YİSA-S Task Flow - İş akışı yönetimi
 * PATRON KOMUTU → GPT (Koordinatör) → [AI'lar] → Claude (Düzeltici) → Cursor → GPT → Claude → PATRON
 * Tarih: 28 Ocak 2026
 */

import { routeTask, type RouterResult, type AssignedAI } from './ai-router'
import { checkPatronLock, type PatronDecision } from '@/lib/security/patron-lock'

export type FlowStage =
  | 'patron_command'
  | 'gpt_coordinate'
  | 'ai_execute'
  | 'claude_fix'
  | 'cursor_polish'
  | 'gpt_collect'
  | 'claude_final'
  | 'patron_decision'

export interface TaskFlowState {
  command: string
  routerResult: RouterResult | null
  currentStage: FlowStage
  assignedAI: AssignedAI | null
  output: string | null
  patronDecision: PatronDecision | null
  lockCheck: ReturnType<typeof checkPatronLock> | null
}

const STAGE_ORDER: FlowStage[] = [
  'patron_command',
  'gpt_coordinate',
  'ai_execute',
  'claude_fix',
  'cursor_polish',
  'gpt_collect',
  'claude_final',
  'patron_decision',
]

/**
 * Patron komutunu alır, güvenlik kontrolü yapar, router'a gönderir.
 */
export function startTaskFlow(command: string): TaskFlowState {
  const lockCheck = checkPatronLock(command)
  if (!lockCheck.allowed) {
    return {
      command,
      routerResult: null,
      currentStage: 'patron_command',
      assignedAI: null,
      output: lockCheck.reason ?? 'Yasak işlem.',
      patronDecision: null,
      lockCheck,
    }
  }

  const routerResult = routeTask(command)
  return {
    command,
    routerResult,
    currentStage: 'gpt_coordinate',
    assignedAI: routerResult.assignedAI,
    output: null,
    patronDecision: null,
    lockCheck,
  }
}

/**
 * Sonraki aşamaya geçer (sadece state geçişi; gerçek API çağrıları ayrı).
 */
export function advanceStage(state: TaskFlowState): FlowStage | null {
  const idx = STAGE_ORDER.indexOf(state.currentStage)
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null
  return STAGE_ORDER[idx + 1]
}

/**
 * Patron kararı ile flow'u günceller.
 */
export function applyPatronDecision(
  state: TaskFlowState,
  decision: PatronDecision
): TaskFlowState {
  return {
    ...state,
    currentStage: 'patron_decision',
    patronDecision: decision,
  }
}

/**
 * İş akışı açıklaması (UI / log için).
 */
export const FLOW_DESCRIPTION = `
PATRON KOMUTU
    ↓
GPT (Koordinatör) - Komutu alır, algılar, sınıflandırır
    ↓
├─ Araştırma → GEMINI araştırır
├─ Tasarım → V0 üretir
├─ Kod → GPT yazar
├─ Toplu iş → TOGETHER işler
└─ Güvenlik → CLAUDE kontrol eder
    ↓
CLAUDE (Düzeltici) - Tüm çıktıları düzeltir, onaylar
    ↓
CURSOR (Mükemmelleştirici) - Kod varsa refactor, test, güvenlik check
    ↓
GPT toplar → CLAUDE son kontrol → PATRONA SUNAR
    ↓
PATRON KARAR VERİR (Onayla / Reddet / Değiştir)
`.trim()

/**
 * YİSA-S AI Router - Görev tipine göre AI yönlendirme
 * GPT (Koordinatör) → [GEMINI|V0|GPT|TOGETHER|CLAUDE] → Claude (Düzeltici) → Cursor → Patron
 * Tarih: 28 Ocak 2026
 */

export type TaskType =
  | 'research'
  | 'design'
  | 'code'
  | 'batch'
  | 'security'
  | 'unknown'

export type AssignedAI = 'GEMINI' | 'V0' | 'GPT' | 'TOGETHER' | 'CLAUDE'

export interface RouterResult {
  taskType: TaskType
  assignedAI: AssignedAI
  description: string
}

const KEYWORDS: Record<TaskType, { ai: AssignedAI; patterns: string[] }> = {
  research: {
    ai: 'GEMINI',
    patterns: [
      'araştır', 'araştırma', 'bul', 'bilgi', 'rapor', 'incele', 'analiz et',
      'research', 'find', 'analyze', 'report', 'investigate',
    ],
  },
  design: {
    ai: 'V0',
    patterns: [
      'tasarım', 'tasarla', 'ui', 'arayüz', 'mockup', 'şablon', 'vitrin',
      'design', 'mockup', 'template', 'ui', 'ux',
    ],
  },
  code: {
    ai: 'GPT',
    patterns: [
      'kod', 'yaz', 'fonksiyon', 'api', 'endpoint', 'component', 'fix', 'bug',
      'code', 'implement', 'function', 'refactor', 'develop',
    ],
  },
  batch: {
    ai: 'TOGETHER',
    patterns: [
      'toplu', 'batch', 'işle', 'dönüştür', 'parse', 'çoklu', 'liste',
      'batch', 'bulk', 'process', 'transform', 'multiple',
    ],
  },
  security: {
    ai: 'CLAUDE',
    patterns: [
      'güvenlik', 'audit', 'kontrol', 'gizlilik', 'şifre', 'erişim',
      'security', 'audit', 'privacy', 'access', 'vulnerability',
    ],
  },
  unknown: { ai: 'GPT', patterns: [] },
}

/**
 * Komut metnini algılayıp TaskType ve atanacak AI'ı döner.
 */
export function routeTask(command: string): RouterResult {
  const lower = command.toLowerCase().trim()

  for (const [type, config] of Object.entries(KEYWORDS)) {
    if (type === 'unknown') continue
    const matched = config.patterns.some((p) => lower.includes(p))
    if (matched) {
      return {
        taskType: type as TaskType,
        assignedAI: config.ai as AssignedAI,
        description: `Görev "${type}" olarak sınıflandırıldı → ${config.ai}`,
      }
    }
  }

  return {
    taskType: 'unknown',
    assignedAI: 'GPT',
    description: 'Belirsiz görev → Varsayılan GPT',
  }
}

/**
 * Çoklu görev için route (örn. "araştır ve tasarla").
 * İlk eşleşen tip kullanılır.
 */
export function routeTasks(commands: string[]): RouterResult[] {
  return commands.map(routeTask)
}

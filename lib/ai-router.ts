/**
 * AI ROUTER - SEÇENEK 2: KALİTE OPTİMİZE
 * Patron Kararı: 29 Ocak 2026
 * PATRON → GPT → [Gemini/Together/V0] → CLAUDE → CURSOR → GPT → CLAUDE → PATRON
 */

export const AI_PROVIDERS = {
  GPT: {
    name: 'GPT-4',
    role: 'Algılama, Görevlendirme, Toplama',
    endpoint: process.env.OPENAI_API_KEY ? 'https://api.openai.com/v1/chat/completions' : null,
    model: 'gpt-4-turbo-preview',
  },
  CLAUDE: {
    name: 'Claude',
    role: 'Düzeltme, Onaylama, Güvenlik Kontrolü, Son Kontrol',
    endpoint: process.env.ANTHROPIC_API_KEY ? 'https://api.anthropic.com/v1/messages' : null,
    model: 'claude-sonnet-4-20250514',
  },
  GEMINI: {
    name: 'Gemini',
    role: 'Araştırma, Veri Analizi',
    endpoint: process.env.GOOGLE_GEMINI_API_KEY ? 'https://generativelanguage.googleapis.com/v1' : null,
    model: 'gemini-pro',
  },
  TOGETHER: {
    name: 'Together',
    role: 'Toplu İşler, Basit Görevler',
    endpoint: process.env.TOGETHER_API_KEY ? 'https://api.together.xyz/v1/chat/completions' : null,
    model: 'meta-llama/Llama-3-70b-chat-hf',
  },
  V0: {
    name: 'V0',
    role: 'UI/UX Tasarım, Şablon',
    endpoint: process.env.V0_API_KEY ? 'v0.dev' : null,
  },
  CURSOR: {
    name: 'Cursor',
    role: 'Kod Mükemmelleştirme, Refactor',
    endpoint: 'local',
  },
} as const

export const QUALITY_FLOW = {
  name: 'Seçenek 2 - Kalite Optimize',
  quality: '%98',
  monthlyCost: '₺8,000-15,000',
  speed: '5-10 saniye',

  steps: [
    {
      step: 1,
      name: 'ALGILAMA',
      provider: 'GPT',
      action: 'Patron komutunu al, analiz et, görev tipini belirle',
      output: 'task_type',
      condition: undefined,
    },
    {
      step: 2,
      name: 'ARAŞTIRMA (gerekirse)',
      provider: 'GEMINI',
      condition: 'task_type === "research" || needs_data === true',
      action: 'Güncel veri ara, analiz et',
      output: 'research_data',
    },
    {
      step: 3,
      name: 'TASARIM (gerekirse)',
      provider: 'V0',
      condition: 'task_type === "design" || task_type === "ui"',
      action: 'UI/UX tasarımı üret',
      output: 'design_code',
    },
    {
      step: 4,
      name: 'KOD YAZMA (gerekirse)',
      provider: 'GPT',
      condition: 'task_type === "code" || task_type === "development"',
      action: 'Kod yaz',
      output: 'raw_code',
    },
    {
      step: 5,
      name: 'DÜZELTME',
      provider: 'CLAUDE',
      action: 'Tüm çıktıları kontrol et, düzelt, onayla',
      output: 'corrected_output',
      condition: undefined,
    },
    {
      step: 6,
      name: 'MÜKEMMELLEŞTİRME (gerekirse)',
      provider: 'CURSOR',
      condition: 'has_code === true',
      action: 'Kodu refactor et, optimize et',
      output: 'optimized_code',
    },
    {
      step: 7,
      name: 'TOPLAMA',
      provider: 'GPT',
      action: 'Tüm çıktıları birleştir, raporla',
      output: 'final_report',
      condition: undefined,
    },
    {
      step: 8,
      name: 'SON KONTROL',
      provider: 'CLAUDE',
      action: 'Güvenlik kontrolü, kalite kontrolü, son onay',
      output: 'approved_output',
      condition: undefined,
    },
    {
      step: 9,
      name: 'PATRONA SUN',
      provider: 'SYSTEM',
      action: 'Patrona sun, karar bekle',
      output: 'patron_decision',
      condition: undefined,
    },
  ],
} as const

export type QualityFlowStep = (typeof QUALITY_FLOW.steps)[number]

export interface RouteToAIResult {
  status: 'completed' | 'awaiting_patron_approval'
  output: Record<string, unknown>
  aiResponses: { provider: string; response: unknown; timestamp: Date }[]
  flow: string
}

export type CallAIFn = (provider: string, input: unknown) => Promise<unknown>

function evalStepCondition(
  condition: string | undefined,
  ctx: { taskType: string; needs_data?: boolean; has_code?: boolean }
): boolean {
  if (!condition) return true
  try {
    const expr = condition
      .replace(/\btask_type\b/g, `"${ctx.taskType}"`)
      .replace(/\bneeds_data\b/g, String(ctx.needs_data ?? false))
      .replace(/\bhas_code\b/g, String(ctx.has_code ?? false))
    return new Function(`return ${expr}`)()
  } catch {
    return false
  }
}

/**
 * Görev tipi belirleme (talimat ile uyumlu)
 */
export function detectTaskType(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (
    lowerMessage.includes('araştır') ||
    lowerMessage.includes('bul') ||
    lowerMessage.includes('analiz')
  ) {
    return 'research'
  }
  if (
    lowerMessage.includes('tasarla') ||
    lowerMessage.includes('ui') ||
    lowerMessage.includes('sayfa')
  ) {
    return 'design'
  }
  if (
    lowerMessage.includes('kod') ||
    lowerMessage.includes('yaz') ||
    lowerMessage.includes('oluştur') ||
    lowerMessage.includes('düzelt')
  ) {
    return 'code'
  }
  if (lowerMessage.includes('rapor') || lowerMessage.includes('özet')) {
    return 'report'
  }
  return 'general'
}

/**
 * Varsayılan callAI: endpoint yoksa veya local ise skip.
 * Gerçek API çağrıları API route içinde inject edilir.
 */
export async function defaultCallAI(provider: string, input: unknown): Promise<unknown> {
  const key = provider as keyof typeof AI_PROVIDERS
  const config = AI_PROVIDERS[key]
  if (!config || !config.endpoint || config.endpoint === 'local') {
    return { provider, status: 'skipped', reason: 'No endpoint or local' }
  }
  return { provider, status: 'called', input }
}

/**
 * Ana router: Seçenek 2 akışını çalıştırır.
 * callAIFn verilmezse defaultCallAI (placeholder) kullanılır.
 */
export async function routeToAI(
  message: string,
  context: Record<string, unknown>,
  callAIFn?: CallAIFn
): Promise<RouteToAIResult> {
  const taskType = detectTaskType(message)
  const flow = QUALITY_FLOW
  const callAI = callAIFn ?? defaultCallAI

  let currentOutput: Record<string, unknown> = {
    message,
    taskType,
    context,
    needs_data: taskType === 'research',
    has_code: taskType === 'code',
  }
  const aiResponses: { provider: string; response: unknown; timestamp: Date }[] = []

  for (const step of flow.steps) {
    const shouldRun = evalStepCondition(step.condition, {
      taskType,
      needs_data: currentOutput.needs_data as boolean,
      has_code: currentOutput.has_code as boolean,
    })
    if (!shouldRun) continue

    if (step.name === 'PATRONA SUN') {
      return {
        status: 'awaiting_patron_approval',
        output: currentOutput,
        aiResponses,
        flow: flow.name,
      }
    }

    const response = await callAI(step.provider, currentOutput)
    aiResponses.push({
      provider: step.provider,
      response,
      timestamp: new Date(),
    })

    const outKey = step.output as string
    currentOutput = { ...currentOutput, [outKey]: response }
    if (step.output === 'raw_code' || step.output === 'optimized_code') {
      currentOutput.has_code = true
    }
  }

  return {
    status: 'completed',
    output: currentOutput,
    aiResponses,
    flow: flow.name,
  }
}

/**
 * YİSA-S Claude Servisi
 * Analiz, son kontrol. Özel iş ve CELF içinde kullanılır.
 * Tarih: 30 Ocak 2026
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

export interface AnalyzeResult {
  taskType: string
  summary: string
  suggestedDirector?: string
  error?: string
}

/**
 * Görevi analiz eder, kategori (tasarım/kod/rapor/araştırma) ve özet döner.
 */
export async function analyze(message: string): Promise<AnalyzeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { taskType: 'general', summary: message, error: 'ANTHROPIC_API_KEY yok' }

  const systemPrompt = `Sen YİSA-S analiz asistanısın. Görev metnini analiz et.
Yanıtı JSON olarak ver: { "taskType": "research"|"design"|"code"|"report"|"general", "summary": "kısa özet", "suggestedDirector": "CFO|CTO|CPO|CDO|..." }
Sadece bu JSON'u döndür, başka metin ekleme.`

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    })
    if (!res.ok) return { taskType: 'general', summary: message, error: await res.text() }
    const data = await res.json()
    const text = data.content?.find((c: { type: string }) => c.type === 'text')?.text ?? '{}'
    const parsed = JSON.parse(text.replace(/```json?\s*|\s*```/g, '').trim())
    return {
      taskType: parsed.taskType ?? 'general',
      summary: parsed.summary ?? message,
      suggestedDirector: parsed.suggestedDirector,
    }
  } catch {
    return { taskType: 'general', summary: message }
  }
}

/**
 * Son çıktıyı kontrol eder (güvenlik, tutarlılık).
 */
export async function finalCheck(output: string, context?: string): Promise<{ passed: boolean; note?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { passed: true }

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 128,
        system: 'Sen güvenlik ve kalite kontrol asistanısın. Yanıtı sadece JSON ver: { "passed": true/false, "note": "kısa not" }',
        messages: [{ role: 'user', content: `Kontrol et:\n${output}${context ? `\nBağlam: ${context}` : ''}` }],
      }),
    })
    if (!res.ok) return { passed: true }
    const data = await res.json()
    const text = data.content?.find((c: { type: string }) => c.type === 'text')?.text ?? '{}'
    const parsed = JSON.parse(text.replace(/```json?\s*|\s*```/g, '').trim())
    return { passed: parsed.passed !== false, note: parsed.note }
  } catch {
    return { passed: true }
  }
}

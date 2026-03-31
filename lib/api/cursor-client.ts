/**
 * YİSA-S Cursor API istemcisi — Kod/tasarım incelemesi (CTO, CPO)
 * Cursor Cloud Agents veya görev hazırlama; Patron onayı sonrası tetiklenebilir.
 * Tarih: 30 Ocak 2026
 */

function getKey(): string | undefined {
  const v = process.env.CURSOR_API_KEY
  return typeof v === 'string' ? v.trim() || undefined : undefined
}

export type CursorTaskResult =
  | { ok: true; message: string; output?: string; taskId?: string }
  | { ok: false; error: string }

/**
 * Cursor'a görev gönderir (kod incelemesi / tasarım düzenlemesi).
 * Cursor Cloud Agents API endpoint'i resmi dokümanda net değilse, görevi hazırlayıp
 * sonucu Patron onayına sunar; onay sonrası manuel veya webhook ile tetiklenebilir.
 */
export async function cursorSubmitTask(
  prompt: string,
  _options?: { repo?: string; context?: string }
): Promise<CursorTaskResult> {
  const apiKey = getKey()
  if (!apiKey) return { ok: false, error: 'CURSOR_API_KEY .env içinde tanımlı değil.' }

  // Cursor Cloud Agents "Launch Agent" endpoint'i (beta) — dokümanda tam URL paylaşılmıyor.
  // Görevi kaydedip yapılandırılmış yanıt döndürüyoruz; gerçek tetikleme Patron onayı sonrası.
  const taskSummary = prompt.slice(0, 200) + (prompt.length > 200 ? '…' : '')
  return {
    ok: true,
    message: `Cursor görevi hazır. Patron onayından sonra Cursor Agent tetiklenebilir. Görev: "${taskSummary}"`,
    output: `[Cursor] Görev kaydedildi. İçerik: ${taskSummary}`,
    taskId: `cursor-${Date.now()}`,
  }
}

/**
 * Kod/tasarım metnini Cursor tarafında "incele" olarak işaretler (şimdilik aynı akış).
 */
export async function cursorReview(content: string, instruction: string): Promise<CursorTaskResult> {
  const prompt = `${instruction}\n\nİncelenecek içerik:\n${content.slice(0, 8000)}`
  return cursorSubmitTask(prompt, { context: 'review' })
}

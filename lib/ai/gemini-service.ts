/**
 * YİSA-S Gemini Servisi
 * Araştırma, veri analizi, hızlı işler.
 * Tarih: 31 Ocak 2026
 */

const GOOGLE_GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const GOOGLE_GEMINI_PRO_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

function getGeminiKey(): string | undefined {
  const v = process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY
  return typeof v === 'string' ? v.trim() || undefined : undefined
}

/**
 * Gemini ile genel amaçlı çağrı (Patron Asistanı, CELF direktörlükler için)
 */
export async function callGemini(
  message: string,
  systemPrompt?: string,
  maxTokens: number = 1024
): Promise<string | null> {
  const apiKey = getGeminiKey()
  if (!apiKey) {
    console.warn('[GEMINI] GOOGLE_API_KEY yok')
    return null
  }

  try {
    const url = `${GOOGLE_GEMINI_URL}?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(systemPrompt && { systemInstruction: { parts: [{ text: systemPrompt }] } }),
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[GEMINI] API hatası:', err)
      return null
    }

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null
  } catch (e) {
    console.error('[GEMINI] Fetch hatası:', e)
    return null
  }
}

export async function research(query: string, context?: string): Promise<{ text: string; error?: string }> {
  const apiKey = getGeminiKey()
  if (!apiKey) return { text: '', error: 'GOOGLE_API_KEY yok' }

  try {
    const url = `${GOOGLE_GEMINI_PRO_URL}?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `Araştır (kısa, Türkçe, net): ${query}${context ? `\nBağlam: ${context}` : ''}` }] }],
        generationConfig: { maxOutputTokens: 1024 },
      }),
    })
    if (!res.ok) return { text: '', error: await res.text() }
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return { text }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return { text: '', error: err }
  }
}

/**
 * YİSA-S Asistan İlk Adım — İmla düzeltme
 * Vizyon: "Tek ağız = Gemini" → Önce Gemini dener, yoksa GPT.
 * Tarih: 30 Ocak 2026
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export interface CorrectSpellingResult {
  correctedMessage: string
  changed: boolean
  /** Hangi sağlayıcı kullanıldı (vizyon: Gemini önce) */
  provider?: 'GEMINI' | 'GPT'
  error?: string
}

const SPELLING_SYSTEM = `Sen bir Türkçe dil asistanısın. Sadece imla ve yazım düzeltmesi yap.
Kurallar:
- Sadece düzeltilmiş metni döndür, başka açıklama ekleme.
- Anlaşılmayan veya yanlış yazılmış kelimeleri anlaşılır hale getir.
- Cümle yapısını ve anlamı değiştirme.
- Eğer metin zaten doğruysa aynen döndür.`

function getEnv(key: string): string | undefined {
  const v = process.env[key]
  return typeof v === 'string' ? v.trim() || undefined : undefined
}

/** Asistan tarafı Gemini anahtarı (ayrı key; yoksa genel key) */
function getAsistanGeminiKey(): string | undefined {
  return getEnv('ASISTAN_GOOGLE_API_KEY') ?? getEnv('ASISTAN_GOOGLE_GEMINI_API_KEY') ?? getEnv('GOOGLE_API_KEY') ?? getEnv('GOOGLE_GEMINI_API_KEY') ?? getEnv('GEMINI_API_KEY')
}

/** Gemini ile imla düzeltme (vizyon: ilk adım = Gemini) — ASISTAN anahtarı */
async function correctSpellingGemini(originalMessage: string): Promise<CorrectSpellingResult> {
  const apiKey = getAsistanGeminiKey()
  if (!apiKey) {
    return { correctedMessage: originalMessage, changed: false, error: 'ASISTAN_GOOGLE_API_KEY veya GOOGLE_API_KEY yok' }
  }
  try {
    const url = `${GEMINI_URL}?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SPELLING_SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: `Aşağıdaki metindeki imla ve yazım hatalarını düzelt. Sadece düzeltilmiş metni yaz.\n\n"${originalMessage}"` }] }],
        generationConfig: { maxOutputTokens: 512 },
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      return { correctedMessage: originalMessage, changed: false, error: err }
    }
    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? originalMessage
    const corrected = String(raw).trim().replace(/^["']|["']$/g, '')
    const changed = corrected.toLowerCase() !== originalMessage.toLowerCase()
    return { correctedMessage: corrected || originalMessage, changed, provider: 'GEMINI' }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return { correctedMessage: originalMessage, changed: false, error: err }
  }
}

/** GPT ile imla düzeltme (yedek) — ASISTAN anahtarı */
async function correctSpellingGPT(originalMessage: string): Promise<CorrectSpellingResult> {
  const apiKey = getEnv('ASISTAN_OPENAI_API_KEY') ?? getEnv('OPENAI_API_KEY')
  if (!apiKey) {
    return { correctedMessage: originalMessage, changed: false, error: 'ASISTAN_OPENAI_API_KEY veya OPENAI_API_KEY yok' }
  }
  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        max_tokens: 512,
        messages: [
          { role: 'system', content: SPELLING_SYSTEM },
          { role: 'user', content: `Aşağıdaki metindeki imla ve yazım hatalarını düzelt. Sadece düzeltilmiş metni yaz.\n\n"${originalMessage}"` },
        ],
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      return { correctedMessage: originalMessage, changed: false, error: err }
    }
    const data = await res.json()
    const corrected = (data.choices?.[0]?.message?.content ?? originalMessage).trim().replace(/^["']|["']$/g, '')
    const changed = corrected.toLowerCase() !== originalMessage.toLowerCase()
    return { correctedMessage: corrected || originalMessage, changed, provider: 'GPT' }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return { correctedMessage: originalMessage, changed: false, error: err }
  }
}

/**
 * Patron mesajındaki imla ve yazım hatalarını düzeltir.
 * Vizyon: Tek ağız = Gemini → Önce Gemini, başarısızsa GPT.
 */
export async function correctSpelling(originalMessage: string): Promise<CorrectSpellingResult> {
  const geminiResult = await correctSpellingGemini(originalMessage)
  if (!geminiResult.error && geminiResult.correctedMessage) {
    return geminiResult
  }
  return correctSpellingGPT(originalMessage)
}

export interface AskConfirmationPayload {
  correctedMessage: string
  promptText: string
  choices: ('company' | 'private' | 'correct')[]
}

/**
 * "Bu mu demek istediniz?" onayı için UI'da kullanılacak metni ve seçenekleri döner.
 */
export function askConfirmation(correctedMessage: string): AskConfirmationPayload {
  return {
    correctedMessage,
    promptText: `Bu mu demek istediniz: "${correctedMessage}"`,
    choices: ['company', 'private', 'correct'],
  }
}

/**
 * GPT ile genel amaçlı çağrı (Patron Asistanı, CELF direktörlükler için)
 */
export async function callGPT(
  message: string,
  systemPrompt?: string,
  maxTokens: number = 1024
): Promise<string | null> {
  const apiKey = getEnv('OPENAI_API_KEY')
  if (!apiKey) {
    console.warn('[GPT] OPENAI_API_KEY yok')
    return null
  }

  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        max_tokens: maxTokens,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: message },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[GPT] API hatası:', err)
      return null
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } catch (e) {
    console.error('[GPT] Fetch hatası:', e)
    return null
  }
}

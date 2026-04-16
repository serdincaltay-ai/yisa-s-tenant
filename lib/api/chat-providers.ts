/**
 * CELF Asistan sohbeti için AI sağlayıcı çağrıları
 * GPT, Gemini, Together — chat API'den kullanılır
 */

import { fetchWithRetry } from '@/lib/api/fetch-with-retry'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const GOOGLE_GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const TOGETHER_URL = 'https://api.together.xyz/v1/chat/completions'

const SYSTEM_PROMPT = 'Sen YİSA-S Patron Asistanısın. Kısa, net ve Türkçe yanıt ver. Uydurma firma/isim yazma; sadece YİSA-S bağlamında üret.'

function getEnv(key: string): string | undefined {
  const v = process.env[key]
  return typeof v === 'string' ? v.trim() || undefined : undefined
}

export async function callOpenAIChat(message: string): Promise<string | null> {
  const apiKey = getEnv('OPENAI_API_KEY')
  if (!apiKey) return null
  const res = await fetchWithRetry(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? null
}

export async function callGeminiChat(message: string): Promise<string | null> {
  const apiKey = getEnv('GOOGLE_GEMINI_API_KEY')
  if (!apiKey) return null
  const url = `${GOOGLE_GEMINI_URL}?key=${apiKey}`
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: { maxOutputTokens: 1024 },
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null
}

export async function callTogetherChat(message: string): Promise<string | null> {
  const apiKey = getEnv('TOGETHER_API_KEY')
  if (!apiKey) return null
  const res = await fetchWithRetry(TOGETHER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3-70b-chat-hf',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? null
}

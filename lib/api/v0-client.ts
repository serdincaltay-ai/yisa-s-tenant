/**
 * YİSA-S V0 API istemcisi — Tasarım/UI üretimi (CPO direktörlüğü)
 * Vercel v0 Model API: https://api.v0.dev/v1/chat/completions
 * Tarih: 30 Ocak 2026
 */

const V0_API_URL = 'https://api.v0.dev/v1/chat/completions'
const V0_MODEL = 'v0-1.5-md'

function getKey(): string | undefined {
  const v = process.env.V0_API_KEY
  return typeof v === 'string' ? v.trim() || undefined : undefined
}

export type V0Result = { text: string; model: string } | { error: string }

/**
 * V0 ile UI/tasarım promptu üretir (OpenAI uyumlu chat completions).
 */
export async function v0Generate(prompt: string): Promise<V0Result> {
  const apiKey = getKey()
  if (!apiKey) return { error: 'V0_API_KEY .env içinde tanımlı değil.' }

  try {
    const res = await fetch(V0_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: V0_MODEL,
        messages: [{ role: 'user' as const, content: prompt }],
        max_completion_tokens: 4096,
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      let msg = errText.slice(0, 300)
      try {
        const j = JSON.parse(errText)
        if (j.error?.message) msg = j.error.message
      } catch {
        /* raw */
      }
      return { error: `V0 API ${res.status}: ${msg}` }
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>
      model?: string
    }
    const content = data.choices?.[0]?.message?.content
    const model = data.model ?? V0_MODEL
    if (content) return { text: content, model }
    return { error: 'V0 yanıt boş.' }
  } catch (e) {
    return { error: `V0 istek hatası: ${e instanceof Error ? e.message : String(e)}` }
  }
}

/**
 * YİSA-S AI Test API
 * Claude, Gemini, GPT, V0, Together durumlarını test eder.
 *
 * 1. Claude — https://api.anthropic.com/v1/messages
 * 2. Gemini — https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
 * 3. GPT — https://api.openai.com/v1/chat/completions
 * 4. V0 — https://api.v0.dev/v1/chat/completions (model: v0-1.5-md, key: V0_API_KEY)
 * 5. Together — https://api.together.xyz/v1/chat/completions (model: meta-llama/Llama-3.3-70B-Instruct-Turbo, key: TOGETHER_API_KEY)
 */

import { NextResponse } from 'next/server'
import { callClaude } from '@/lib/ai/celf-execute'
import { callGemini } from '@/lib/ai/gemini-service'
import { callGPT } from '@/lib/ai/gpt-service'
import { v0Generate } from '@/lib/api/v0-client'
import { requirePatron } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

const TOGETHER_URL = 'https://api.together.xyz/v1/chat/completions'
const TOGETHER_MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'

function getTogetherKey(): string | undefined {
  const v = process.env.TOGETHER_API_KEY ?? process.env.CELF_TOGETHER_API_KEY
  return typeof v === 'string' ? v.trim() || undefined : undefined
}

async function callTogetherTest(message: string): Promise<string | null> {
  const apiKey = getTogetherKey()
  if (!apiKey) return null
  const res = await fetch(TOGETHER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: TOGETHER_MODEL,
      max_tokens: 64,
      messages: [{ role: 'user', content: message }],
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? null
}

export async function GET() {
  const auth = await requirePatron()
  if (auth instanceof NextResponse) return auth

  const results: Record<string, { ok: boolean; latency?: number; error?: string }> = {}
  const testMessage = 'Merhaba, kisa bir test mesaji. Tek kelime yanit ver: OK'

  const run = async (name: string, fn: () => Promise<string | null | { text?: string; error?: string }>) => {
    const start = Date.now()
    try {
      const out = await fn()
      const latency = Date.now() - start
      const text = typeof out === 'object' && out !== null
        ? ('error' in out ? null : out.text ?? null)
        : out
      const errMsg = typeof out === 'object' && out !== null && 'error' in out ? out.error : undefined
      results[name] = text ? { ok: true, latency } : { ok: false, latency, error: errMsg }
    } catch (e) {
      results[name] = { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  await Promise.all([
    run('Claude', () => callClaude(testMessage, 'Tek kelime: OK', 'celf')),
    run('Gemini', () => callGemini(testMessage)),
    run('GPT', () => callGPT(testMessage, 'Tek kelime: OK')),
    run('V0', () => v0Generate(testMessage).then((r) => ('error' in r ? { error: r.error } : { text: r.text }))),
    run('Together', () => callTogetherTest(testMessage)),
  ])

  const okCount = Object.values(results).filter((r) => r.ok).length
  return NextResponse.json({
    ok: okCount > 0,
    summary: `${okCount}/5 AI aktif`,
    results,
    timestamp: new Date().toISOString(),
  })
}

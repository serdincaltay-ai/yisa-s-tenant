import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

type TaskType = 'karar' | 'analiz' | 'strateji' | 'icerik' | 'sosyal_medya' | string

function getProvider(taskType: TaskType): 'claude' | 'openai' | 'gemini' {
  if (['karar', 'analiz', 'strateji'].includes(taskType)) {
    return 'claude'
  }
  if (['icerik', 'sosyal_medya'].includes(taskType)) {
    return 'openai'
  }
  return 'gemini'
}

async function callClaude(message: string): Promise<{ text: string; tokens: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY tanımlı değil')

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: message }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude hatası: ${err}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text ?? ''
  const tokens = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0)

  return { text, tokens }
}

async function callOpenAI(message: string): Promise<{ text: string; tokens: number }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY tanımlı değil')

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: message }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI hatası: ${err}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  const tokens = data.usage?.total_tokens ?? 0

  return { text, tokens }
}

async function callGemini(message: string): Promise<{ text: string; tokens: number }> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY tanımlı değil')

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: message }] }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini hatası: ${err}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  // Gemini doesn't always return token counts in basic API
  const tokens = data.usageMetadata?.totalTokenCount ?? 100

  return { text, tokens }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = body.message as string
    const taskType = (body.task_type as TaskType) ?? 'genel'
    const agentCode = (body.agent_code as string) ?? 'PATRON_ASISTAN'

    if (!message) {
      return NextResponse.json({ error: 'message alanı zorunlu' }, { status: 400 })
    }

    const provider = getProvider(taskType)
    let responseText = ''
    let tokensUsed = 0

    // Call the appropriate AI provider
    if (provider === 'claude') {
      const result = await callClaude(message)
      responseText = result.text
      tokensUsed = result.tokens
    } else if (provider === 'openai') {
      const result = await callOpenAI(message)
      responseText = result.text
      tokensUsed = result.tokens
    } else {
      const result = await callGemini(message)
      responseText = result.text
      tokensUsed = result.tokens
    }

    // Log to Supabase
    const supabase = getSupabaseServer()
    if (supabase) {
      await supabase.from('ai_usage_log').insert({
        provider,
        model: provider === 'claude' ? 'claude-sonnet-4-20250514' : provider === 'openai' ? 'gpt-4o' : 'gemini-2.0-flash',
        input_tokens: tokensUsed,
        output_tokens: 0,
        task_type: taskType,
        agent_code: agentCode,
      })
    }

    return NextResponse.json({
      response: responseText,
      provider,
      tokens_used: tokensUsed,
    })
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'AI isteği başarısız', detail: errorMessage }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { saveChatMessage } from '@/lib/db/chat-messages'
import { callClaude, callTogetherForAssistant } from '@/lib/ai/celf-execute'
import { callOpenAIChat, callGeminiChat, callTogetherChat } from '@/lib/api/chat-providers'
import { v0Generate } from '@/lib/api/v0-client'
import { requireAuth } from '@/lib/auth/api-auth'

const SYSTEM_PROMPT = 'Sen YİSA-S Patron Asistanısın. Kısa, net ve Türkçe yanıt ver. Uydurma firma/isim yazma; sadece YİSA-S bağlamında üret.'

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const body = await req.json()
    const message = typeof body.message === 'string' ? body.message : (body.message ?? 'Merhaba')
    const taskType = typeof body.taskType === 'string' ? body.taskType : undefined
    const assignedAI = (typeof body.assignedAI === 'string' ? body.assignedAI.toUpperCase() : 'CLAUDE') as string
    const userId = typeof body.user_id === 'string' ? body.user_id : (body.user?.id as string | undefined)

    let text: string
    let provider = assignedAI

    switch (assignedAI) {
      case 'GPT':
        text = (await callOpenAIChat(message)) ?? 'OPENAI_API_KEY tanımlı değil veya yanıt alınamadı.'
        break
      case 'GEMINI':
        text = (await callGeminiChat(message)) ?? 'GOOGLE_GEMINI_API_KEY tanımlı değil veya yanıt alınamadı.'
        break
      case 'TOGETHER':
        text = (await callTogetherChat(message)) ?? (await callTogetherForAssistant(message, SYSTEM_PROMPT)) ?? 'TOGETHER_API_KEY tanımlı değil veya yanıt alınamadı.'
        break
      case 'V0': {
        const v0Result = await v0Generate(`Tasarım isteği (Türkçe): ${message}`)
        text = 'error' in v0Result ? v0Result.error : v0Result.text
        provider = 'V0'
        break
      }
      case 'CURSOR':
        text = 'Cursor kod asistanı — kod istekleri CELF CTO direktörlüğü üzerinden işlenir.'
        break
      case 'CLAUDE':
      default:
        text = (await callClaude(message, SYSTEM_PROMPT, 'asistan')) ?? 'ANTHROPIC_API_KEY tanımlı değil veya yanıt alınamadı.'
        provider = 'CLAUDE'
        break
    }

    if (userId) {
      await saveChatMessage({
        user_id: userId,
        message,
        response: text,
        ai_providers: [provider],
      })
    }

    return NextResponse.json({
      text,
      assignedAI: provider,
      taskType: taskType || 'unknown',
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Chat hatası', detail: err }, { status: 500 })
  }
}

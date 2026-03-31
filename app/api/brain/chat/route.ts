/**
 * POST /api/brain/chat
 * Beyin Takımı sohbet endpoint'i — sohbet ve komut modunu destekler.
 * mode: 'chat' → AI ile serbest sohbet (geçmiş bağlamıyla)
 * mode: 'command' → CELF pipeline'a yönlendir
 */

import { NextRequest, NextResponse } from 'next/server'
import { callAssistantChain, type AssistantProvider } from '@/lib/ai/assistant-provider'
import { securityCheck } from '@/lib/robots/security-robot'
import { saveChatMessage } from '@/lib/db/chat-messages'
import { requireAuth } from '@/lib/auth/api-auth'

interface ChatHistoryItem {
  role: 'patron' | 'brain-team' | 'system'
  content: string
}

const BRAIN_SYSTEM_PROMPT =
  'Sen YİSA-S Beyin Takımı asistanısın. Patron seninle sohbet ediyor. ' +
  'Geçmiş mesaj bağlamını dikkate al. Kısa, net ve Türkçe yanıt ver. ' +
  'Uydurma firma/isim yazma; sadece YİSA-S bağlamında üret. ' +
  'Eğer Patron bir iş komutu vermek istiyorsa, ona "komut:" ön ekini kullanmasını öner.'

const VALID_PROVIDERS = ['GPT', 'GEMINI', 'CLAUDE', 'CLOUD'] as const

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const body = await req.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const mode = body.mode === 'command' ? 'command' : 'chat'
    const history: ChatHistoryItem[] = Array.isArray(body.history) ? body.history.slice(-20) : []
    const userId = typeof body.user_id === 'string' ? body.user_id : undefined
    const provider = VALID_PROVIDERS.includes(body.provider as (typeof VALID_PROVIDERS)[number])
      ? (body.provider as AssistantProvider)
      : ('GEMINI' as AssistantProvider)

    if (!message) {
      return NextResponse.json({ error: 'Mesaj boş olamaz.' }, { status: 400 })
    }

    // Güvenlik kontrolü
    const security = await securityCheck({
      message,
      userId,
      ipAddress: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
      logToDb: true,
    })
    if (!security.allowed) {
      return NextResponse.json(
        { error: security.reason ?? 'Bu işlem AI için yasaktır.', blocked: true },
        { status: 403 }
      )
    }

    // Komut modu → CELF pipeline'a yönlendir bilgisi
    if (mode === 'command') {
      return NextResponse.json({
        reply: 'Bu komut CELF pipeline üzerinden işlenecek. Lütfen ASK ekranındaki komut modunu kullanın.',
        action: 'redirect_celf',
        suggestions: [
          'komut: ' + message,
        ],
      })
    }

    // Sohbet modu → geçmiş bağlamıyla AI yanıtı üret
    const historyContext = history
      .map((h) => `${h.role === 'patron' ? 'Patron' : h.role === 'system' ? 'Sistem' : 'Beyin Takımı'}: ${h.content}`)
      .join('\n')

    const fullPrompt = historyContext
      ? `Önceki sohbet:\n${historyContext}\n\nPatron: ${message}`
      : message

    const { text: reply, providers } = await callAssistantChain(
      [provider],
      fullPrompt,
      BRAIN_SYSTEM_PROMPT
    )

    const resultText = reply ?? 'Yanıt oluşturulamadı.'

    // Sohbet mesajını kaydet
    if (userId) {
      await saveChatMessage({
        user_id: userId,
        message,
        response: resultText,
        ai_providers: providers,
      })
    }

    // Bağlama dayalı öneriler
    const suggestions = generateSuggestions(message, resultText)

    return NextResponse.json({
      reply: resultText,
      suggestions,
      provider: providers[providers.length - 1] ?? provider,
      providers,
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    console.error('[brain/chat] Error:', err)
    return NextResponse.json({ error: 'Sohbet hatası', detail: err }, { status: 500 })
  }
}

/** Yanıta göre basit öneri üretimi */
function generateSuggestions(message: string, reply: string): string[] {
  const suggestions: string[] = []
  const lower = message.toLowerCase()

  if (lower.includes('rapor') || lower.includes('analiz')) {
    suggestions.push('komut: Bu raporu oluştur')
    suggestions.push('Daha detaylı açıkla')
  } else if (lower.includes('sporcu') || lower.includes('kayıt')) {
    suggestions.push('komut: Sporcu kayıt formu oluştur')
    suggestions.push('Mevcut kayıt durumunu göster')
  } else if (lower.includes('gelir') || lower.includes('gider') || lower.includes('finans')) {
    suggestions.push('komut: Gelir-gider raporu hazırla')
    suggestions.push('Mali durumu özetle')
  }

  if (!suggestions.length) {
    suggestions.push('Devam et')
    suggestions.push('Bunu komut olarak gönder')
  }

  return suggestions.slice(0, 3)
}

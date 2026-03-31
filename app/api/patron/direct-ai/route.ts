/**
 * Patron Direkt AI — CEO/CELF zincirini atla
 * Seçilen AI(lar)a direkt gönder, sonucu patron_commands'a yaz, Patron Havuzu'na gelsin
 * Görev 1: Beyin Takımı Chat güçlendirme
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePatronOrFlow } from '@/lib/auth/api-auth'
import { callAssistantByProvider, type AssistantProvider } from '@/lib/ai/assistant-provider'

const VALID_PROVIDERS: AssistantProvider[] = [
  'GPT', 'GEMINI', 'CLAUDE', 'CLOUD', 'V0', 'CURSOR', 'FAL',
]

const ALL_PROVIDERS: AssistantProvider[] = ['GPT', 'GEMINI', 'CLAUDE', 'CLOUD', 'V0', 'CURSOR', 'FAL']

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePatronOrFlow()
    if (auth instanceof NextResponse) return auth
    const userId = auth.user.id

    const body = await req.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const askAll = body.ask_all === true
    const providersRaw = Array.isArray(body.providers) ? body.providers : []
    const targetDirector = typeof body.target_director === 'string' ? body.target_director.trim().toUpperCase() || undefined : undefined
    const attachBase64 = typeof body.attach_base64 === 'string' ? body.attach_base64 : undefined
    const attachType = typeof body.attach_type === 'string' ? body.attach_type : undefined

    if (!message) {
      return NextResponse.json({ error: 'Mesaj gerekli' }, { status: 400 })
    }

    const providers: AssistantProvider[] = askAll
      ? ALL_PROVIDERS
      : providersRaw
          .filter((p: unknown) => typeof p === 'string' && VALID_PROVIDERS.includes(p.toUpperCase() as AssistantProvider))
          .map((p: string) => p.toUpperCase() as AssistantProvider)
          .filter((p: AssistantProvider, i: number, arr: AssistantProvider[]) => arr.indexOf(p) === i)
          .slice(0, 7)

    if (providers.length === 0) {
      return NextResponse.json({ error: 'En az bir AI seçin veya HERKESE SOR kullanın' }, { status: 400 })
    }

    const msgWithAttach = attachBase64
      ? `${message}\n\n[Ek: ${attachType || 'dosya'} — base64 ile gönderildi, AI metin içeriğini kullanacak]`
      : message

    const results: { provider: string; text: string }[] = []

    if (providers.length === 1) {
      const r = await callAssistantByProvider(providers[0], msgWithAttach)
      results.push({ provider: r.provider, text: r.text })
    } else {
      const promises = providers.map(async (p) => {
        const r = await callAssistantByProvider(p, msgWithAttach)
        return { provider: r.provider, text: r.text }
      })
      const settled = await Promise.allSettled(promises)
      for (const s of settled) {
        if (s.status === 'fulfilled') results.push(s.value)
        else results.push({ provider: '—', text: `Hata: ${s.reason?.message ?? 'Bilinmeyen'}` })
      }
    }

    const displayText = results
      .map((r) => `【${r.provider}】\n${r.text}`)
      .join('\n\n---\n\n')
    const usedProviders = results.map((r) => r.provider)

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Veritabanı bağlantısı yok' }, { status: 503 })
    }

    const title = message.length > 80 ? message.slice(0, 77) + '…' : message
    const outputPayload: Record<string, unknown> = {
      displayText,
      director_key: targetDirector ?? 'DIRECT_AI',
      director_name: targetDirector ? `${targetDirector} (Direkt)` : 'Direkt AI',
      ai_providers: usedProviders,
      source: 'direct_ai',
      sent_by_email: auth.user.email ?? undefined,
      assistant_summary: `Seçilen AI: ${usedProviders.join(', ')}. CEO/CELF zinciri atlandı.`,
    }

    const { data: inserted, error } = await supabase
      .from('patron_commands')
      .insert({
        user_id: userId,
        command: message,
        status: 'pending',
        type: 'direct_ai',
        title,
        output_payload: outputPayload,
        source: 'direct_ai',
      })
      .select('id, ticket_no')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      command_id: inserted?.id,
      ticket_no: inserted?.ticket_no,
      text: displayText,
      providers: usedProviders,
      message: 'Patron Havuzu\'na eklendi.',
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: err }, { status: 500 })
  }
}

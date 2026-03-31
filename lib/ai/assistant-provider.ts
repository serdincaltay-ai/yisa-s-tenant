/**
 * Patron asistanı için AI sağlayıcı seçimi
 * GPT, Gemini, Claude, Together, V0, Cursor, Supabase, GitHub, Vercel, Railway, Fal
 */

import { callClaude, callTogetherForAssistant } from '@/lib/ai/celf-execute'
import { callGemini } from '@/lib/ai/gemini-service'
import { callGPT } from '@/lib/ai/gpt-service'
import { v0Generate } from '@/lib/api/v0-client'

export type AssistantProvider =
  | 'GPT' | 'GEMINI' | 'CLAUDE' | 'CLOUD' | 'V0' | 'CURSOR'
  | 'SUPABASE' | 'GITHUB' | 'VERCEL' | 'RAILWAY' | 'FAL'

const ASSISTANT_SYSTEM =
  'Sen YİSA-S Patronunun asistanısın. KURALLAR: (1) Sadece YİSA-S projesi, franchise, spor tesisi, çocuk gelişimi bağlamında yanıt ver. (2) Uydurma firma, isim veya proje yazma. (3) Şirket işi komutu değil; CELF\'e gitme, deploy/push yapma. (4) Kısa ve Türkçe yanıt ver. (5) Kod/komut önerirken dikkatli ol — hatalı, tehlikeli veya uydurma komut önerme. ' +
  'Terminal önerirken: ```powershell\ncd C:\\...\nnpm run ...\n``` — Patron kopyalayıp çalıştırabilsin.'

const PLATFORM_CONTEXTS: Record<string, string> = {
  SUPABASE: 'Sen Supabase veritabanı, auth, RLS politikaları hakkında soruları yanıtlıyorsun. YİSA-S projesinde Supabase kullanılıyor.',
  GITHUB: 'Sen GitHub, commit, push, repo, branch yönetimi hakkında soruları yanıtlıyorsun. YİSA-S kodu GitHub\'da.',
  VERCEL: 'Sen Vercel deploy, hosting, domain ayarları hakkında soruları yanıtlıyorsun. YİSA-S Vercel\'de deploy ediliyor.',
  RAILWAY: 'Sen Railway deploy, build, ortam değişkenleri hakkında soruları yanıtlıyorsun. YİSA-S Railway\'de de deploy edilebilir.',
  FAL: 'Sen Fal AI, görsel üretim, model API\'leri hakkında soruları yanıtlıyorsun.',
}

/** Seçilen sağlayıcı ile asistan yanıtı üretir */
export async function callAssistantByProvider(
  provider: AssistantProvider,
  message: string,
  system?: string
): Promise<{ text: string; provider: string }> {
  const baseSys = system ?? ASSISTANT_SYSTEM
  const platformContext = PLATFORM_CONTEXTS[provider]
  const sys = platformContext ? `${platformContext}\n\n${baseSys}` : baseSys
  let text: string | null = null
  let usedProvider: string = provider

  switch (provider) {
    case 'GPT':
      text = await callGPT(message, sys)
      break
    case 'GEMINI':
      text = await callGemini(message, sys)
      break
    case 'CLAUDE':
      text = await callClaude(message, sys, 'asistan')
      break
    case 'CLOUD':
      text = await callTogetherForAssistant(message, sys)
      usedProvider = 'TOGETHER'
      break
    case 'V0': {
      const v0 = await v0Generate(message)
      text = 'error' in v0 ? v0.error : v0.text
      usedProvider = 'V0'
      break
    }
    case 'CURSOR':
      text = await callClaude(message, sys, 'asistan')
      usedProvider = 'CLAUDE'
      break
    case 'SUPABASE':
    case 'GITHUB':
    case 'VERCEL':
    case 'RAILWAY':
    case 'FAL':
      text = await callClaude(message, sys, 'asistan')
      usedProvider = provider
      break
    default:
      text = await callGemini(message, sys)
      usedProvider = 'GEMINI'
  }

  if (!text) {
    text = await callGemini(message, sys) ?? await callGPT(message, sys)
    usedProvider = text ? 'GEMINI' : '—'
  }

  return {
    text: text ?? 'Yanıt oluşturulamadı. API anahtarlarını (.env) kontrol edin.',
    provider: usedProvider,
  }
}

const CHAIN_CONTEXT = 'Önceki asistanın çıktısı. Bunu geliştir, kontrol et veya tamamla. Kısa ve Türkçe yanıt ver.'

/** Zincir: 1. asistan mesajla çalışır, 2. öncekinin çıktısıyla, 3. öncekinin çıktısıyla... En son çıktı döner */
export async function callAssistantChain(
  providers: string[],
  message: string,
  system?: string
): Promise<{ text: string; providers: string[] }> {
  if (!providers.length) return callAssistantByProvider('GEMINI', message, system).then((r) => ({ text: r.text, providers: [r.provider] }))
  if (providers.length === 1) return callAssistantByProvider(providers[0] as AssistantProvider, message, system).then((r) => ({ text: r.text, providers: [r.provider] }))

  let currentInput = message
  const usedProviders: string[] = []
  for (let i = 0; i < providers.length; i++) {
    const p = providers[i] as AssistantProvider
    const sys = i === 0 ? system : `${CHAIN_CONTEXT}\n\n${system ?? ASSISTANT_SYSTEM}`
    const result = await callAssistantByProvider(p, currentInput, sys)
    currentInput = result.text
    usedProviders.push(result.provider)
  }
  return { text: currentInput, providers: usedProviders }
}

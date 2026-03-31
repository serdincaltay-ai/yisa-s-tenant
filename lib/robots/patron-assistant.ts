/**
 * YİSA-S Patron Asistanı Robotu (Katman 1)
 * Anayasa Referansı: YISA-S_PATRON_ASISTANI_AI_ORKESTRASYON.md
 * 
 * GÖREVLERİ:
 * - Patronun kişisel asistanlığı (özel işler)
 * - Danışmanlık ve araştırma
 * - AR-GE desteği
 * - Rapor derleme ve sunma
 * - CIO'ya şirket işi komutu iletme
 * 
 * AI MODELLERİ:
 * - Claude: Analiz, strateji, uzun doküman
 * - GPT: Genel amaçlı, içerik
 * - Gemini: Hızlı işler, veri analizi
 * - Together: Toplu işler, embedding
 * - V0: UI tasarım (iletme)
 * - Cursor: Kod (iletme)
 * 
 * YAPAMAZ:
 * - Patronsuz strateji değiştirmek
 * - Direkt deploy/commit yapmak
 * - Fiyat/yetki değiştirmek
 * - Başka tenant verilerine erişmek
 * 
 * Tarih: 31 Ocak 2026
 */

import { callClaude } from '@/lib/ai/celf-execute'
import { callGPT } from '@/lib/ai/gpt-service'
import { callGemini } from '@/lib/ai/gemini-service'
import { classifyTask, type TaskClassification } from './ceo-robot'
import { analyzeCommand, type CIOAnalysisResult } from './cio-robot'

export type AssistantAIProvider = 'CLAUDE' | 'GPT' | 'GEMINI' | 'TOGETHER'

export interface AssistantTask {
  id: string
  command: string
  taskType: 'private' | 'company' | 'research' | 'consulting' | 'report'
  status: 'pending' | 'processing' | 'completed' | 'forwarded'
  result?: string
  aiUsed?: AssistantAIProvider[]
  forwardedTo?: 'CIO' | 'CEO'
  createdAt: Date
  completedAt?: Date
}

export interface AssistantResponse {
  text: string | null
  provider: AssistantAIProvider
  forwarded: boolean
  forwardedTo?: 'CIO' | 'CEO'
  classification: TaskClassification
  cioAnalysis?: CIOAnalysisResult
}

/**
 * Patron Asistanı sistem promptu
 */
const ASSISTANT_SYSTEM_PROMPT = `Sen YİSA-S sisteminin Patron Asistanısın (Katman 1).

Görevlerin:
1. Patronun kişisel işlerini halleder (şirket dışı)
2. Danışmanlık ve araştırma yapar
3. Şirket işlerini CIO'ya iletir (kendin yapmaz)
4. Rapor derler ve sunar

KURALLAR:
- Türkçe yanıt ver
- Kısa ve öz ol
- Şirket verisine erişme (özel iş ise)
- Deploy, commit, fiyat değişikliği YAPMA
- Emin değilsen "Patrona soralım" de

Şirket işi mi özel iş mi? Belli değilse Patrona sor.`

/**
 * Özel iş için uygun AI seç (görev tipine göre)
 */
function selectAIForPrivateTask(command: string): AssistantAIProvider {
  const lower = command.toLowerCase()
  
  // Analiz/strateji → Claude
  if (lower.includes('analiz') || lower.includes('strateji') || lower.includes('değerlendir')) {
    return 'CLAUDE'
  }
  
  // Hızlı soru/cevap → Gemini
  if (lower.includes('hızlı') || lower.includes('kısa') || lower.length < 100) {
    return 'GEMINI'
  }
  
  // Varsayılan → GPT
  return 'GPT'
}

/**
 * Patron Asistanı ana fonksiyonu
 * Özel iş → kendisi halleder
 * Şirket işi → CIO'ya iletir
 * Belirsiz → Patrona sorar
 */
export async function handlePatronCommand(
  command: string,
  forcePrivate: boolean = false
): Promise<AssistantResponse> {
  // 1. Sınıflandır
  const classification = classifyTask(command)
  
  // 2. Özel iş veya zorla özel
  if (classification === 'private' || forcePrivate) {
    const provider = selectAIForPrivateTask(command)
    let text: string | null = null
    
    try {
      switch (provider) {
        case 'CLAUDE':
          text = await callClaude(command, ASSISTANT_SYSTEM_PROMPT, 'asistan')
          break
        case 'GEMINI':
          text = await callGemini(command, ASSISTANT_SYSTEM_PROMPT)
          break
        case 'GPT':
        default:
          text = await callGPT(command, ASSISTANT_SYSTEM_PROMPT)
          break
      }
    } catch (error) {
      text = `Yanıt oluşturulamadı. Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
    }
    
    return {
      text: text ?? 'Yanıt oluşturulamadı.',
      provider,
      forwarded: false,
      classification,
    }
  }
  
  // 3. Şirket işi → CIO'ya ilet
  if (classification === 'company') {
    const cioAnalysis = analyzeCommand(command)
    
    return {
      text: null, // Asistan yanıt vermez, CIO'ya iletir
      provider: 'GPT', // Sınıflandırma için
      forwarded: true,
      forwardedTo: 'CIO',
      classification,
      cioAnalysis,
    }
  }
  
  // 4. Belirsiz → Patrona sor
  return {
    text: 'Bu iş şirketle mi ilgili yoksa kişisel mi? Lütfen belirtin.',
    provider: 'GPT',
    forwarded: false,
    classification: 'unclear',
  }
}

/**
 * Araştırma görevi (özel)
 */
export async function doResearch(topic: string): Promise<string> {
  const prompt = `Araştırma konusu: ${topic}

Lütfen şunları yap:
1. Konuyu özetle
2. Ana noktaları listele
3. Kaynakları belirt (varsa)
4. Sonuç ve öneri

Kısa ve öz ol.`

  const result = await callClaude(prompt, ASSISTANT_SYSTEM_PROMPT, 'asistan')
  return result ?? 'Araştırma tamamlanamadı.'
}

/**
 * Danışmanlık görevi (özel)
 */
export async function getConsulting(question: string): Promise<string> {
  const prompt = `Danışmanlık sorusu: ${question}

Lütfen profesyonel bir danışman gibi yanıtla:
1. Soruyu analiz et
2. Seçenekleri değerlendir
3. Önerilerde bulun
4. Risk/fayda belirt

Kısa ve net ol.`

  const result = await callClaude(prompt, ASSISTANT_SYSTEM_PROMPT, 'asistan')
  return result ?? 'Danışmanlık yanıtı oluşturulamadı.'
}

/**
 * Rapor derleme (şirket verisi olmadan)
 */
export async function compileReport(data: Record<string, unknown>, title: string): Promise<string> {
  const prompt = `Rapor başlığı: ${title}
Veri: ${JSON.stringify(data, null, 2)}

Lütfen profesyonel bir rapor formatında derle:
1. Özet
2. Bulgular
3. Grafikler/tablolar (metin olarak)
4. Sonuç ve öneriler`

  const result = await callGPT(prompt, ASSISTANT_SYSTEM_PROMPT)
  return result ?? 'Rapor derlenemedi.'
}

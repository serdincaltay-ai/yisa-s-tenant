/**
 * YİSA-S Claude Denetçi
 * Hiçbir iş Claude denetiminden geçmeden onay havuzuna çıkmaz.
 * Direktörlük çıktısını alır, Claude ile denetler, onay/red/düzeltme önerir.
 */

import { callClaude } from '@/lib/ai/celf-execute'

export interface DenetciSonuc {
  approved: boolean
  feedback?: string
  revisedText?: string
  reason?: string
}

const DENETCI_SYSTEM = `Sen YİSA-S sisteminin denetçisisin. Her direktörlük çıktısını incele.
KURALLAR:
1) Uydurma firma, isim, proje var mı? Varsa RED.
2) YİSA-S bağlamına uygun mu? Spor tesisi, franchise, çocuk gelişimi. Değilse RED.
3) Türkçe dilbilgisi ve anlam bütünlüğü kabul edilebilir mi?
4) Tehlikeli, zararlı veya uygunsuz içerik var mı? Varsa RED.
5) Kod/teknik çıktıda güvenlik açığı veya hatalı komut var mı?

Yanıt formatı (tek satırda, JSON benzeri):
ONAY: ... (kısa onay nedeni)
veya
RED: ... (kısa red nedeni)
veya
DUZELT: ... (düzeltme önerisi, kısa)

Sadece ONAY, RED veya DUZELT ile başlayan tek satır yaz. Türkçe.`

export async function claudeDenet(
  command: string,
  directorKey: string,
  directorName: string,
  outputText: string,
  provider: string
): Promise<DenetciSonuc> {
  const prompt = `Görev: ${command}
Direktörlük: ${directorKey} (${directorName})
Üretici AI: ${provider}

Çıktı:
---
${outputText.slice(0, 8000)}
---

Bu çıktıyı denetle. ONAY, RED veya DUZELT ile başlayan tek satır yaz.`

  const raw = await callClaude(prompt, DENETCI_SYSTEM, 'celf')
  if (!raw || typeof raw !== 'string') {
    return { approved: true, feedback: 'Denetçi yanıt vermedi; varsayılan onay.', reason: 'no_response' }
  }

  const trimmed = raw.trim().toUpperCase()
  if (trimmed.startsWith('ONAY')) {
    const feedback = raw.trim().replace(/^ONAY:\s*/i, '').trim()
    return { approved: true, feedback: feedback || 'Onaylandı.', reason: 'approved' }
  }
  if (trimmed.startsWith('RED')) {
    const feedback = raw.trim().replace(/^RED:\s*/i, '').trim()
    return { approved: false, feedback: feedback || 'Reddedildi.', reason: 'rejected' }
  }
  if (trimmed.startsWith('DUZELT')) {
    const feedback = raw.trim().replace(/^DUZELT:\s*/i, '').trim()
    return { approved: false, feedback, revisedText: feedback, reason: 'needs_revision' }
  }

  return { approved: true, feedback: 'Denetçi belirsiz yanıt; varsayılan onay.', reason: 'ambiguous' }
}

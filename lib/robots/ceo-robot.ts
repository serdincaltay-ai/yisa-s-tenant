/**
 * YİSA-S CEO Robot - Kural tabanlı organizatör (Katman 4)
 * AI YOK. Sadece if/else kuralları.
 * Asistandan gelen işleri CELF'e dağıtır, sonuçları toplar.
 * "Bu rutin olsun" → routine_tasks'a kaydeder.
 * Deploy / Commit-Push: Sadece Patron onayı ile.
 * Tarih: 30 Ocak 2026
 */

import { detectTaskType as aiDetectTaskType } from '@/lib/ai-router'
import { CELF_DIRECTORATES, type DirectorKey } from './celf-center'

export type ScheduleType = 'daily' | 'weekly' | 'monthly'

export const CEO_RULES = {
  /** İş dağıtım kuralları: görev anahtar kelimesi → Direktörlük */
  TASK_DISTRIBUTION: {
    finans: 'CFO',
    bütçe: 'CFO',
    butce: 'CFO',
    gelir: 'CFO',
    gider: 'CFO',
    tahsilat: 'CFO',
    maliyet: 'CFO',
    teknoloji: 'CTO',
    sistem: 'CTO',
    kod: 'CTO',
    api: 'CTO',
    performans: 'CTO',
    hata: 'CTO',
    veri: 'CIO',
    database: 'CIO',
    entegrasyon: 'CIO',
    bilgi: 'CIO',
    tablo: 'CIO',
    kampanya: 'CMO',
    reklam: 'CMO',
    'sosyal medya': 'CMO',
    pazarlama: 'CMO',
    tanıtım: 'CMO',
    personel: 'CHRO',
    eğitim: 'CHRO',
    'insan kaynakları': 'CHRO',
    izin: 'CHRO',
    sözleşme: 'CLO',
    patent: 'CLO',
    uyum: 'CLO',
    hukuk: 'CLO',
    kvkk: 'CLO',
    müşteri: 'CSO_SATIS',
    sipariş: 'CSO_SATIS',
    crm: 'CSO_SATIS',
    satış: 'CSO_SATIS',
    şablon: 'CPO',
    tasarım: 'CPO',
    tasarla: 'CPO',
    logo: 'CPO',
    ürün: 'CPO',
    özellik: 'CPO',
    ui: 'CPO',
    sayfa: 'CPO',
    analiz: 'CDO',
    rapor: 'CDO',
    dashboard: 'CDO',
    istatistik: 'CDO',
    güvenlik: 'CISO',
    audit: 'CISO',
    erişim: 'CISO',
    şifre: 'CISO',
    destek: 'CCO',
    şikayet: 'CCO',
    memnuniyet: 'CCO',
    ticket: 'CCO',
    plan: 'CSO_STRATEJI',
    hedef: 'CSO_STRATEJI',
    büyüme: 'CSO_STRATEJI',
    strateji: 'CSO_STRATEJI',
    vizyon: 'CSO_STRATEJI',
    // CSPO - Spor Direktörlüğü
    antrenman: 'CSPO',
    hareket: 'CSPO',
    sporcu: 'CSPO',
    program: 'CSPO',
    seviye: 'CSPO',
    branş: 'CSPO',
    ölçüm: 'CSPO',
    spor: 'CSPO',
    cimnastik: 'CSPO',
    kamp: 'CSPO',
    sağlık: 'CSPO',
    health: 'CSPO',
    çocuk: 'CSPO',
    yaş: 'CSPO',
  } as Record<string, DirectorKey>,

  /** Deploy / Commit kuralları - PATRON ONAYI ŞART */
  DEPLOY_RULES: {
    autoDeployAllowed: false,
    autoCommitAllowed: false,
    requirePatronApproval: true,
  },
}

export type CEOAction = 'distribute' | 'collect' | 'deploy' | 'commit' | 'push' | 'unknown'

/**
 * Görev metninden hangi direktörlüğe gideceğini bulur (kural tabanlı).
 */
export function routeToDirector(taskDescription: string): DirectorKey | null {
  const lower = taskDescription.toLowerCase().trim()
  const words = lower.split(/\s+/)

  for (const word of words) {
    const key = word.replace(/[^a-zçğıöşü\w]/gi, '')
    if (!key) continue
    const director = CEO_RULES.TASK_DISTRIBUTION[key]
    if (director) return director
  }

  // Tek kelime değilse tam eşleşme dene
  for (const [term, director] of Object.entries(CEO_RULES.TASK_DISTRIBUTION)) {
    if (lower.includes(term)) return director
  }

  return null
}

/**
 * Deploy/commit işlemi yapılabilir mi? (Patron onayı gerekir.)
 */
export function canDeployOrCommit(action: CEOAction): { allowed: boolean; reason: string } {
  if (action !== 'deploy' && action !== 'commit' && action !== 'push') {
    return { allowed: true, reason: 'Dağıtım/commit işlemi değil.' }
  }
  if (CEO_RULES.DEPLOY_RULES.requirePatronApproval && !CEO_RULES.DEPLOY_RULES.autoDeployAllowed) {
    return {
      allowed: false,
      reason: 'Deploy/Commit için Patron onayı gerekir. Otomatik işlem yapılmaz.',
    }
  }
  return { allowed: true, reason: 'Onaylı.' }
}

/**
 * CEO aksiyonunu komut metninden çıkarır.
 */
export function detectCEOAction(input: string): CEOAction {
  const lower = input.toLowerCase()
  if (/\bdeploy\b|vercel deploy|railway deploy/.test(lower)) return 'deploy'
  if (/\bcommit\b|git commit/.test(lower)) return 'commit'
  if (/\bpush\b|git push/.test(lower)) return 'push'
  if (/\bdağıt\b|topla|distribute|collect/.test(lower)) return 'distribute'
  return 'unknown'
}

/** Görev tipi: araştırma, tasarım, kod, rapor, genel (ai-router ile uyumlu) */
export function detectTaskType(message: string): string {
  return aiDetectTaskType(message)
}

/** "Bu rutin olsun" / "Bunu her gün yap" gibi ifadeleri algılar */
export function isRoutineRequest(message: string): boolean {
  const lower = message.toLowerCase().trim()
  const patterns = [
    /bu rutin olsun/i,
    /bunu rutin yap/i,
    /her gün yap/i,
    /günlük yap/i,
    /haftalık yap/i,
    /aylık yap/i,
    /rutin olsun/i,
    /otomatik tekrarla/i,
    /zamanlanmış görev/i,
  ]
  return patterns.some((p) => p.test(lower))
}

/** Mesajdan sıklık çıkarır: daily, weekly, monthly. Yoksa null (Patrona sorulacak). */
export function getRoutineScheduleFromMessage(message: string): ScheduleType | null {
  const lower = message.toLowerCase()
  if (/\bher gün\b|günlük|daily\b/.test(lower)) return 'daily'
  if (/\bhaftalık|her hafta|weekly\b/.test(lower)) return 'weekly'
  if (/\baylık|her ay|monthly\b/.test(lower)) return 'monthly'
  return null
}

/** Şirket işi anahtar kelimeleri → CELF'e gider */
const COMPANY_KEYWORDS = [
  'şirket', 'yisa-s', 'yisa s', 'franchise', 'sporcu', 'tesis', 'müşteri', 'bayi',
  'gelir', 'gider', 'rapor', 'bütçe', 'kampanya', 'sözleşme', 'personel', 'sistem',
  'veri', 'analiz', 'dashboard', 'şablon', 'satış', 'crm', 'destek', 'güvenlik',
]
/** Patron özel işi anahtar kelimeleri → CELF'e gitmez, patron_private_tasks */
const PRIVATE_KEYWORDS = ['benim için', 'şahsi', 'özel', 'kişisel', 'tatil', 'araştır', 'not al']

export type TaskClassification = 'company' | 'private' | 'unclear'

/** İş sınıflandırması: şirket işi (CELF), patron özel işi (private), belirsiz (Patrona sor) */
export function classifyTask(message: string): TaskClassification {
  const lower = message.toLowerCase().trim()
  if (PRIVATE_KEYWORDS.some((k) => lower.includes(k))) return 'private'
  if (COMPANY_KEYWORDS.some((k) => lower.includes(k))) return 'company'
  return 'unclear'
}

/** Patron özel işi mi? */
export function isPrivateTask(message: string): boolean {
  return classifyTask(message) === 'private'
}

/** Belirsiz mi? (Patrona "Şirketle ilgili mi, özel iş mi?" diye sorulacak) */
export function isTaskClassificationUnclear(message: string): boolean {
  return classifyTask(message) === 'unclear'
}

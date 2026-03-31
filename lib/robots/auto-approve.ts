/**
 * YİSA-S Otomatik Onay Sistemi
 * Anayasa Referansı: yisa-s-ai-protokol-sistemi.md (Rutin/Auto-approve mekanizması)
 * 
 * KURALLAR:
 * 1. Sadece düşük riskli, rutin işler otomatik onaylanabilir
 * 2. Deploy, commit, fiyat, yetki değişikliği ASLA otomatik onaylanmaz
 * 3. Patron istediği zaman otomatik onayı kapatabilir
 * 4. Her otomatik onay audit_log'a yazılır
 * 
 * OTOMATİK ONAYLANABİLİR İŞLER:
 * - Bilgi sorguları (rapor, analiz, istatistik)
 * - İçerik üretimi (şablon, metin, çeviri)
 * - Araştırma görevleri
 * - Rutin raporlar
 * 
 * OTOMATİK ONAYLANAMAZ İŞLER:
 * - Deploy, commit, push
 * - Fiyat değişikliği
 * - Kullanıcı/yetki değişikliği
 * - Veri silme
 * - Sözleşme değişikliği
 * - Güvenlik ayarları
 * 
 * Tarih: 31 Ocak 2026
 */

import type { DirectorKey } from './celf-center'
import type { CIOPriority } from './cio-robot'

export interface AutoApproveConfig {
  /** Otomatik onay sistemi aktif mi */
  enabled: boolean
  /** Maksimum otomatik onay günlük limiti */
  dailyLimit: number
  /** Bugün yapılan otomatik onay sayısı */
  todayCount: number
  /** Son kontrol zamanı */
  lastCheckDate: string
}

/** Varsayılan konfigürasyon */
export const DEFAULT_AUTO_APPROVE_CONFIG: AutoApproveConfig = {
  enabled: true,
  dailyLimit: 20,
  todayCount: 0,
  lastCheckDate: new Date().toISOString().split('T')[0],
}

/** Otomatik onay için yasak anahtar kelimeler (bu işlemler ASLA otomatik onaylanmaz) */
const FORBIDDEN_FOR_AUTO_APPROVE: string[] = [
  'deploy',
  'commit',
  'push',
  'git',
  'fiyat',
  'price',
  'ücret',
  'tarife',
  'sil',
  'delete',
  'kaldır',
  'remove',
  'yetki',
  'permission',
  'rol',
  'role',
  'kullanıcı',
  'user',
  'şifre',
  'password',
  'sözleşme',
  'contract',
  'kvkk',
  'gdpr',
  'env',
  'api_key',
  'secret',
  'token',
  'güvenlik',
  'security',
]

/** Otomatik onaylanabilir görev tipleri */
const AUTO_APPROVABLE_TASK_TYPES: string[] = [
  'rapor',
  'report',
  'analiz',
  'analysis',
  'istatistik',
  'statistics',
  'araştırma',
  'research',
  'içerik',
  'content',
  'şablon',
  'template',
  'çeviri',
  'translation',
  'özet',
  'summary',
  'genel',
  'general',
]

/** Otomatik onay için güvenli direktörlükler */
const SAFE_DIRECTORS_FOR_AUTO: DirectorKey[] = [
  'CDO', // Veri analizi
  'CMO', // İçerik üretimi
  'CCO', // Müşteri desteği
  'CSO_STRATEJI', // Planlama
  'CSPO', // Spor programları
]

/** Otomatik onay için maksimum öncelik (high ve critical asla otomatik onaylanmaz) */
const MAX_AUTO_APPROVE_PRIORITY: CIOPriority = 'medium'

export interface AutoApproveCheckResult {
  canAutoApprove: boolean
  reason: string
  riskLevel: 'low' | 'medium' | 'high'
}

/**
 * Bir görevin otomatik onaylanıp onaylanamayacağını kontrol eder
 */
export function checkAutoApprove(params: {
  command: string
  taskType: string
  directorKey: DirectorKey
  priority: CIOPriority
  config?: AutoApproveConfig
}): AutoApproveCheckResult {
  const { command, taskType, directorKey, priority, config = DEFAULT_AUTO_APPROVE_CONFIG } = params
  const lower = command.toLowerCase()

  // 1. Sistem aktif mi?
  if (!config.enabled) {
    return { canAutoApprove: false, reason: 'Otomatik onay sistemi kapalı', riskLevel: 'low' }
  }

  // 2. Günlük limit aşıldı mı?
  if (config.todayCount >= config.dailyLimit) {
    return { canAutoApprove: false, reason: 'Günlük otomatik onay limiti doldu', riskLevel: 'low' }
  }

  // 3. Yasak kelime kontrolü
  for (const forbidden of FORBIDDEN_FOR_AUTO_APPROVE) {
    if (lower.includes(forbidden.toLowerCase())) {
      return {
        canAutoApprove: false,
        reason: `"${forbidden}" içeren işlemler otomatik onaylanamaz`,
        riskLevel: 'high',
      }
    }
  }

  // 4. Öncelik kontrolü
  if (priority === 'critical' || priority === 'high') {
    return {
      canAutoApprove: false,
      reason: 'Yüksek öncelikli işlemler Patron onayı gerektirir',
      riskLevel: 'high',
    }
  }

  // 5. Güvenli direktörlük kontrolü
  if (!SAFE_DIRECTORS_FOR_AUTO.includes(directorKey)) {
    return {
      canAutoApprove: false,
      reason: `${directorKey} direktörlüğü işlemleri manuel onay gerektirir`,
      riskLevel: 'medium',
    }
  }

  // 6. Görev tipi kontrolü
  const taskTypeLower = taskType.toLowerCase()
  const isApprovableType = AUTO_APPROVABLE_TASK_TYPES.some((t) =>
    taskTypeLower.includes(t.toLowerCase())
  )
  if (!isApprovableType) {
    return {
      canAutoApprove: false,
      reason: `"${taskType}" tipi görevler otomatik onaylanamaz`,
      riskLevel: 'medium',
    }
  }

  // Tüm kontroller geçti
  return {
    canAutoApprove: true,
    reason: 'Düşük riskli, rutin görev - otomatik onay uygun',
    riskLevel: 'low',
  }
}

/**
 * Otomatik onay konfigürasyonunu güncelle
 */
export function updateAutoApproveConfig(
  current: AutoApproveConfig,
  updates: Partial<AutoApproveConfig>
): AutoApproveConfig {
  const today = new Date().toISOString().split('T')[0]

  // Gün değiştiyse sayacı sıfırla
  if (current.lastCheckDate !== today) {
    return {
      ...current,
      ...updates,
      todayCount: 0,
      lastCheckDate: today,
    }
  }

  return { ...current, ...updates }
}

/**
 * Otomatik onay sayacını artır
 */
export function incrementAutoApproveCount(config: AutoApproveConfig): AutoApproveConfig {
  const today = new Date().toISOString().split('T')[0]

  if (config.lastCheckDate !== today) {
    return {
      ...config,
      todayCount: 1,
      lastCheckDate: today,
    }
  }

  return {
    ...config,
    todayCount: config.todayCount + 1,
  }
}

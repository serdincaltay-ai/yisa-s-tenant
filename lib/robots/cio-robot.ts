/**
 * YİSA-S CIO Robot - Strateji Beyin (Katman: Patron Asistanı ile CEO arası)
 * Anayasa Referansı: yisa-s-komut-zinciri-protokol.md, yisa-s-ai-protokol-sistemi.md
 * 
 * CIO Görevleri:
 * - Patron komutlarını yorumlama
 * - Stratejik planları operasyona çevirme
 * - Direktörlükler arası koordinasyon
 * - Çakışma tespiti ve çözümü
 * - Önceliklendirme
 * 
 * CIO YAPAMAZ:
 * - Patronsuz strateji değiştirmek
 * - Yayınlama yapmak
 * - Franchise verilerine erişmek
 * - Bütçe harcamak
 * 
 * Tarih: 31 Ocak 2026
 */

import { type DirectorKey, CELF_DIRECTORATES } from './celf-center'
import { routeToDirector, detectTaskType, isRoutineRequest, classifyTask, type TaskClassification } from './ceo-robot'

export type CIOPriority = 'critical' | 'high' | 'medium' | 'low'

export interface CIOAnalysisResult {
  /** Komut analizi tamamlandı mı */
  analyzed: boolean
  /** Görev tipi: araştırma, tasarım, kod, rapor, genel */
  taskType: string
  /** Şirket işi / Özel iş / Belirsiz */
  classification: TaskClassification
  /** Hedef direktörlükler (birden fazla olabilir) */
  targetDirectors: DirectorKey[]
  /** Ana direktörlük (tek seçim gerekiyorsa) */
  primaryDirector: DirectorKey | null
  /** Öncelik */
  priority: CIOPriority
  /** Rutin iş mi */
  isRoutine: boolean
  /** Tahmini token maliyeti */
  estimatedTokenCost: number
  /** Strateji notları */
  strategyNotes: string[]
  /** Çakışma uyarıları */
  conflictWarnings: string[]
  /** CEO'ya gönderilecek iş emri */
  ceoWorkOrder: CIOWorkOrder | null
}

export interface CIOWorkOrder {
  id: string
  command: string
  taskType: string
  targetDirectors: DirectorKey[]
  primaryDirector: DirectorKey
  priority: CIOPriority
  isRoutine: boolean
  strategyNotes: string[]
  createdAt: Date
}

/** Öncelik belirleme kuralları */
const PRIORITY_KEYWORDS: Record<CIOPriority, string[]> = {
  critical: ['acil', 'kritik', 'hemen', 'şimdi', 'ivedi', 'güvenlik ihlali', 'veri kaybı'],
  high: ['önemli', 'bugün', 'öncelikli', 'hızlı', 'patron istedi'],
  medium: ['rapor', 'analiz', 'kontrol', 'düzenli'],
  low: ['araştır', 'incele', 'not al', 'daha sonra'],
}

/** Token maliyet tahmini (görev tipine göre) */
const TOKEN_ESTIMATES: Record<string, number> = {
  research: 2000,
  design: 3500,
  code: 4000,
  report: 1500,
  general: 1000,
}

/**
 * CIO: Komut analizi ve strateji belirleme
 * Patron Asistanı → CIO → CEO akışının ilk stratejik katmanı
 */
export function analyzeCommand(command: string): CIOAnalysisResult {
  const lower = command.toLowerCase().trim()
  
  // 1. Görev tipini belirle
  const taskType = detectTaskType(command)
  
  // 2. Şirket işi / Özel iş sınıflandırması
  const classification = classifyTask(command)
  
  // 3. Hedef direktörlükleri bul
  const targetDirectors = findTargetDirectors(command)
  const primaryDirector = targetDirectors[0] ?? null
  
  // 4. Öncelik belirle
  const priority = determinePriority(lower)
  
  // 5. Rutin mi
  const isRoutine = isRoutineRequest(command)
  
  // 6. Token tahmini
  const estimatedTokenCost = TOKEN_ESTIMATES[taskType] ?? 1000
  
  // 7. Strateji notları
  const strategyNotes = generateStrategyNotes(taskType, targetDirectors, priority)
  
  // 8. Çakışma kontrolü
  const conflictWarnings = checkConflicts(targetDirectors, command)
  
  // 9. CEO iş emri oluştur (şirket işi ise)
  let ceoWorkOrder: CIOWorkOrder | null = null
  if (classification === 'company' && primaryDirector) {
    ceoWorkOrder = {
      id: `CIO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      command,
      taskType,
      targetDirectors,
      primaryDirector,
      priority,
      isRoutine,
      strategyNotes,
      createdAt: new Date(),
    }
  }
  
  return {
    analyzed: true,
    taskType,
    classification,
    targetDirectors,
    primaryDirector,
    priority,
    isRoutine,
    estimatedTokenCost,
    strategyNotes,
    conflictWarnings,
    ceoWorkOrder,
  }
}

/**
 * Komuttan hedef direktörlükleri bul (birden fazla olabilir)
 */
function findTargetDirectors(command: string): DirectorKey[] {
  const directors: DirectorKey[] = []
  const lower = command.toLowerCase()
  
  // Her direktörlüğün trigger'larını kontrol et
  for (const [key, dir] of Object.entries(CELF_DIRECTORATES)) {
    const triggers = dir.triggers ?? []
    for (const trigger of triggers) {
      if (lower.includes(trigger.toLowerCase())) {
        if (!directors.includes(key as DirectorKey)) {
          directors.push(key as DirectorKey)
        }
        break
      }
    }
  }
  
  // Hiç bulunamadıysa, CEO'nun routeToDirector'ını kullan
  if (directors.length === 0) {
    const primary = routeToDirector(command)
    if (primary) directors.push(primary)
  }
  
  // Hâlâ boşsa varsayılan CCO
  if (directors.length === 0) {
    directors.push('CCO')
  }
  
  return directors
}

/**
 * Öncelik belirleme
 */
function determinePriority(lowerCommand: string): CIOPriority {
  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerCommand.includes(keyword)) {
        return priority as CIOPriority
      }
    }
  }
  return 'medium'
}

/**
 * Strateji notları üret
 */
function generateStrategyNotes(
  taskType: string,
  targetDirectors: DirectorKey[],
  priority: CIOPriority
): string[] {
  const notes: string[] = []
  
  if (priority === 'critical') {
    notes.push('⚠️ Kritik öncelik: Diğer işlerin önüne geçirilmeli')
  }
  
  if (targetDirectors.length > 1) {
    notes.push(`📋 Çoklu direktörlük görevi: ${targetDirectors.join(', ')}`)
    notes.push('🔗 Koordinasyon gerekli: CEO sıralı veya paralel çalıştırmalı')
  }
  
  if (taskType === 'code') {
    notes.push('💻 Kod görevi: CTO öncelikli, CISO güvenlik kontrolü sonra')
  }
  
  if (taskType === 'design') {
    notes.push('🎨 Tasarım görevi: CPO + V0 kullanılacak')
  }
  
  return notes
}

/**
 * Çakışma kontrolü
 */
function checkConflicts(targetDirectors: DirectorKey[], command: string): string[] {
  const warnings: string[] = []
  const lower = command.toLowerCase()
  
  // CFO + Fiyat değişikliği → CLO hukuk kontrolü gerekir
  if (targetDirectors.includes('CFO') && lower.includes('fiyat')) {
    if (!targetDirectors.includes('CLO')) {
      warnings.push('💼 Fiyat değişikliği: CLO hukuk kontrolü önerilir')
    }
  }
  
  // Veri silme → CISO ve CLO onayı
  if (lower.includes('sil') || lower.includes('kaldır')) {
    if (!targetDirectors.includes('CISO')) {
      warnings.push('🔒 Veri işlemi: CISO güvenlik kontrolü gerekli')
    }
    if (!targetDirectors.includes('CLO')) {
      warnings.push('⚖️ Veri işlemi: CLO KVKK kontrolü gerekli')
    }
  }
  
  // Deploy → CTO + Patron onayı
  if (lower.includes('deploy') || lower.includes('yayınla')) {
    warnings.push('🚀 Deploy işlemi: Patron onayı şart')
  }
  
  return warnings
}

/**
 * CIO önceliklendirme: Birden fazla iş varsa sırala
 */
export function prioritizeWorkOrders(workOrders: CIOWorkOrder[]): CIOWorkOrder[] {
  const priorityOrder: Record<CIOPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }
  
  return [...workOrders].sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

/**
 * CIO günlük token bütçesi kontrolü
 */
export function checkDailyTokenBudget(
  usedToday: number,
  estimatedCost: number,
  dailyLimit: number = 30000
): { allowed: boolean; remaining: number; warning?: string } {
  const remaining = dailyLimit - usedToday
  
  if (estimatedCost > remaining) {
    return {
      allowed: false,
      remaining,
      warning: `Token limiti aşılacak. Kalan: ${remaining}, Tahmini: ${estimatedCost}`,
    }
  }
  
  if (remaining < dailyLimit * 0.2) {
    return {
      allowed: true,
      remaining,
      warning: `Günlük token limitinin %80'i kullanıldı. Dikkatli kullanın.`,
    }
  }
  
  return { allowed: true, remaining }
}

/**
 * CIO strateji değişikliği kontrolü (Patron onayı gerekir)
 */
export function isStrategyChange(command: string): boolean {
  const strategyKeywords = [
    'strateji değiştir',
    'plan değiştir',
    'yön değiştir',
    'hedef değiştir',
    'vizyon güncelle',
    'misyon güncelle',
  ]
  const lower = command.toLowerCase()
  return strategyKeywords.some((k) => lower.includes(k))
}

/**
 * YİSA-S Direktörlük İlk Görevleri
 * Anayasa Referansı: yisa-s-baslangic-gorevleri.md, YISA-S_ROBOT_GOREVLENDIRME_ILK_ISLER.md
 * 
 * "Boşta robot yok" ilkesi gereği her direktörlük sistem açılışında
 * belirli başlangıç görevlerini otomatik olarak çalıştırır.
 * 
 * Tarih: 31 Ocak 2026
 */

import type { DirectorKey } from './celf-center'

export interface InitialTask {
  id: string
  directorKey: DirectorKey
  name: string
  description: string
  priority: 'high' | 'medium' | 'low'
  estimatedMinutes: number
  requiresApproval: boolean
  aiProvider: string
  command: string
  status: 'pending' | 'running' | 'completed' | 'failed'
}

/**
 * Her direktörlük için sistem başlangıç görevleri
 */
export const INITIAL_TASKS: Record<DirectorKey, InitialTask[]> = {
  CFO: [
    {
      id: 'CFO-001',
      directorKey: 'CFO',
      name: 'Fiyat Listesi Kontrolü',
      description: 'Mevcut fiyat listelerini kontrol et, eksik varsa rapor et',
      priority: 'high',
      estimatedMinutes: 15,
      requiresApproval: false,
      aiProvider: 'GEMINI',
      command: 'Supabase sales_prices tablosunu kontrol et, eksik kategorileri listele',
      status: 'pending',
    },
    {
      id: 'CFO-002',
      directorKey: 'CFO',
      name: 'Aylık Rapor Şablonu',
      description: 'Aylık gelir-gider rapor şablonunu hazırla',
      priority: 'medium',
      estimatedMinutes: 20,
      requiresApproval: false,
      aiProvider: 'GPT',
      command: 'Cimnastik tesisi için aylık gelir-gider rapor şablonu oluştur',
      status: 'pending',
    },
  ],
  CTO: [
    {
      id: 'CTO-001',
      directorKey: 'CTO',
      name: 'Sistem Sağlık Kontrolü',
      description: 'Tüm API endpointlerini ve veritabanı bağlantısını kontrol et',
      priority: 'high',
      estimatedMinutes: 10,
      requiresApproval: false,
      aiProvider: 'CLAUDE',
      command: 'Sistem sağlık kontrolü yap: Supabase bağlantısı, API anahtarları, endpoint durumları',
      status: 'pending',
    },
    {
      id: 'CTO-002',
      directorKey: 'CTO',
      name: 'Hata Log Analizi',
      description: 'Son 24 saatteki hata loglarını analiz et',
      priority: 'medium',
      estimatedMinutes: 15,
      requiresApproval: false,
      aiProvider: 'CLAUDE',
      command: 'Son 24 saatteki hata loglarını analiz et, kritik sorunları raporla',
      status: 'pending',
    },
  ],
  CIO: [
    {
      id: 'CIO-001',
      directorKey: 'CIO',
      name: 'Veri Bütünlüğü Kontrolü',
      description: 'Tablo ilişkilerini ve veri bütünlüğünü kontrol et',
      priority: 'high',
      estimatedMinutes: 20,
      requiresApproval: false,
      aiProvider: 'GPT',
      command: 'Supabase tablolarındaki foreign key ilişkilerini kontrol et, orphan kayıtları tespit et',
      status: 'pending',
    },
  ],
  CMO: [
    {
      id: 'CMO-001',
      directorKey: 'CMO',
      name: 'Sosyal Medya İçerik Planı',
      description: 'Haftalık sosyal medya içerik planı oluştur',
      priority: 'medium',
      estimatedMinutes: 30,
      requiresApproval: false,
      aiProvider: 'GPT',
      command: 'Cimnastik tesisi için haftalık Instagram/Facebook içerik planı oluştur',
      status: 'pending',
    },
    {
      id: 'CMO-002',
      directorKey: 'CMO',
      name: 'Duyuru Şablonları',
      description: 'Standart duyuru şablonlarını hazırla',
      priority: 'low',
      estimatedMinutes: 20,
      requiresApproval: false,
      aiProvider: 'CLAUDE',
      command: 'Kayıt açılışı, kamp duyurusu, etkinlik duyurusu için şablonlar oluştur',
      status: 'pending',
    },
  ],
  CHRO: [
    {
      id: 'CHRO-001',
      directorKey: 'CHRO',
      name: 'Rol Tanımları Kontrolü',
      description: 'Tüm personel rollerinin tanımlı olduğunu doğrula',
      priority: 'high',
      estimatedMinutes: 15,
      requiresApproval: false,
      aiProvider: 'CLAUDE',
      command: 'role_permissions tablosundaki 13 rolü kontrol et, açıklamaları tamamla',
      status: 'pending',
    },
    {
      id: 'CHRO-002',
      directorKey: 'CHRO',
      name: 'Eğitim Dokümanları',
      description: 'Personel oryantasyon dokümanlarını hazırla',
      priority: 'medium',
      estimatedMinutes: 45,
      requiresApproval: true,
      aiProvider: 'CLAUDE',
      command: 'Yeni personel oryantasyon dokümanı oluştur: Sistem kullanımı, görevler, kurallar',
      status: 'pending',
    },
  ],
  CLO: [
    {
      id: 'CLO-001',
      directorKey: 'CLO',
      name: 'KVKK Aydınlatma Metni',
      description: 'KVKK aydınlatma metnini kontrol et/oluştur',
      priority: 'high',
      estimatedMinutes: 30,
      requiresApproval: true,
      aiProvider: 'CLAUDE',
      command: 'Cimnastik tesisi için KVKK aydınlatma metni ve açık rıza formu oluştur',
      status: 'pending',
    },
    {
      id: 'CLO-002',
      directorKey: 'CLO',
      name: 'Üyelik Sözleşmesi Şablonu',
      description: 'Standart üyelik sözleşmesi şablonunu hazırla',
      priority: 'high',
      estimatedMinutes: 45,
      requiresApproval: true,
      aiProvider: 'CLAUDE',
      command: 'Cimnastik tesisi üyelik sözleşmesi şablonu oluştur: Şartlar, iptal, sorumluluklar',
      status: 'pending',
    },
  ],
  CSO_SATIS: [
    {
      id: 'CSO_SATIS-001',
      directorKey: 'CSO_SATIS',
      name: 'CRM Kurulum Kontrolü',
      description: 'Müşteri takip sisteminin hazır olduğunu doğrula',
      priority: 'medium',
      estimatedMinutes: 15,
      requiresApproval: false,
      aiProvider: 'GPT',
      command: 'CRM tabloları (customers, leads, opportunities) yapısını kontrol et',
      status: 'pending',
    },
    {
      id: 'CSO_SATIS-002',
      directorKey: 'CSO_SATIS',
      name: 'Satış Scriptleri',
      description: 'Telefon satış scriptlerini hazırla',
      priority: 'medium',
      estimatedMinutes: 30,
      requiresApproval: false,
      aiProvider: 'GPT',
      command: 'Cimnastik tesisi için telefon satış scripti oluştur: Tanışma, ihtiyaç analizi, kapanış',
      status: 'pending',
    },
  ],
  CPO: [
    {
      id: 'CPO-001',
      directorKey: 'CPO',
      name: 'UI Bileşen Envanteri',
      description: 'Mevcut UI bileşenlerini listele',
      priority: 'low',
      estimatedMinutes: 15,
      requiresApproval: false,
      aiProvider: 'CURSOR',
      command: 'components/ klasöründeki tüm bileşenleri listele ve kullanım durumlarını raporla',
      status: 'pending',
    },
    {
      id: 'CPO-002',
      directorKey: 'CPO',
      name: 'Web Sitesi Şablonu',
      description: 'Franchise web sitesi şablonu tasarla',
      priority: 'medium',
      estimatedMinutes: 60,
      requiresApproval: true,
      aiProvider: 'V0',
      command: 'Cimnastik tesisi için modern, responsive web sitesi şablonu tasarla',
      status: 'pending',
    },
  ],
  CDO: [
    {
      id: 'CDO-001',
      directorKey: 'CDO',
      name: 'Dashboard Metrikleri',
      description: 'Temel dashboard metriklerini tanımla',
      priority: 'medium',
      estimatedMinutes: 20,
      requiresApproval: false,
      aiProvider: 'GEMINI',
      command: 'Patron dashboard için temel metrikleri tanımla: Sporcu sayısı, gelir, devam oranı',
      status: 'pending',
    },
    {
      id: 'CDO-002',
      directorKey: 'CDO',
      name: 'Rapor Şablonları',
      description: 'Standart rapor şablonlarını oluştur',
      priority: 'low',
      estimatedMinutes: 30,
      requiresApproval: false,
      aiProvider: 'GPT',
      command: 'Haftalık, aylık, yıllık rapor şablonları oluştur',
      status: 'pending',
    },
  ],
  CISO: [
    {
      id: 'CISO-001',
      directorKey: 'CISO',
      name: 'Güvenlik Audit',
      description: 'Temel güvenlik kontrollerini çalıştır',
      priority: 'high',
      estimatedMinutes: 20,
      requiresApproval: false,
      aiProvider: 'CLAUDE',
      command: 'RLS politikalarını kontrol et, açık güvenlik açıkları var mı raporla',
      status: 'pending',
    },
    {
      id: 'CISO-002',
      directorKey: 'CISO',
      name: 'Erişim Log Kontrolü',
      description: 'Şüpheli erişim girişimlerini tespit et',
      priority: 'high',
      estimatedMinutes: 15,
      requiresApproval: false,
      aiProvider: 'CLAUDE',
      command: 'security_logs tablosunu kontrol et, şüpheli aktiviteleri raporla',
      status: 'pending',
    },
  ],
  CCO: [
    {
      id: 'CCO-001',
      directorKey: 'CCO',
      name: 'Destek Kanalları Kontrolü',
      description: 'Müşteri destek kanallarının hazır olduğunu doğrula',
      priority: 'medium',
      estimatedMinutes: 10,
      requiresApproval: false,
      aiProvider: 'CLAUDE',
      command: 'Destek ticket sistemi, iletişim formları hazır mı kontrol et',
      status: 'pending',
    },
    {
      id: 'CCO-002',
      directorKey: 'CCO',
      name: 'SSS Dokümanı',
      description: 'Sık sorulan sorular dokümanını hazırla',
      priority: 'low',
      estimatedMinutes: 30,
      requiresApproval: false,
      aiProvider: 'CLAUDE',
      command: 'Cimnastik tesisi için SSS dokümanı oluştur: Kayıt, ödeme, program, kurallar',
      status: 'pending',
    },
  ],
  CSO_STRATEJI: [
    {
      id: 'CSO_STRATEJI-001',
      directorKey: 'CSO_STRATEJI',
      name: 'Hedef Belirleme',
      description: 'Q1 hedeflerini tanımla',
      priority: 'medium',
      estimatedMinutes: 30,
      requiresApproval: true,
      aiProvider: 'GPT',
      command: 'Cimnastik tesisi için Q1 hedefleri oluştur: Sporcu, gelir, memnuniyet hedefleri',
      status: 'pending',
    },
  ],
  CSPO: [
    {
      id: 'CSPO-001',
      directorKey: 'CSPO',
      name: 'Hareket Havuzu Kontrolü',
      description: 'Temel cimnastik hareketlerinin tanımlı olduğunu doğrula',
      priority: 'high',
      estimatedMinutes: 30,
      requiresApproval: false,
      aiProvider: 'CLAUDE',
      command: 'movements tablosunu kontrol et, temel cimnastik hareketlerini ekle (varsa güncelle)',
      status: 'pending',
    },
    {
      id: 'CSPO-002',
      directorKey: 'CSPO',
      name: 'Seviye Sistemi Tanımları',
      description: 'Sporcu seviye sistemini oluştur',
      priority: 'high',
      estimatedMinutes: 45,
      requiresApproval: true,
      aiProvider: 'CLAUDE',
      command: 'Cimnastik için 10 seviyeli sporcu değerlendirme sistemi oluştur',
      status: 'pending',
    },
    {
      id: 'CSPO-003',
      directorKey: 'CSPO',
      name: 'Antrenman Programı Şablonları',
      description: 'Yaş gruplarına göre antrenman programı şablonları',
      priority: 'medium',
      estimatedMinutes: 60,
      requiresApproval: true,
      aiProvider: 'CLAUDE',
      command: '4-6 yaş, 7-10 yaş, 11-14 yaş, 15+ yaş için temel antrenman programı şablonları oluştur',
      status: 'pending',
    },
  ],
  COO: [
    {
      id: 'COO-001',
      directorKey: 'COO',
      name: 'Deploy Durumu Kontrolü',
      description: 'Vercel/Railway deploy durumunu kontrol et',
      priority: 'high',
      estimatedMinutes: 10,
      requiresApproval: false,
      aiProvider: 'GEMINI',
      command: 'Deploy pipeline durumunu kontrol et, son deploy tarihini raporla',
      status: 'pending',
    },
    {
      id: 'COO-002',
      directorKey: 'COO',
      name: 'Operasyon Süreçleri',
      description: 'Temel operasyon süreçlerini dokümante et',
      priority: 'medium',
      estimatedMinutes: 30,
      requiresApproval: false,
      aiProvider: 'CLAUDE',
      command: 'Franchise açılış, günlük operasyon, kapanış süreçlerini dokümante et',
      status: 'pending',
    },
  ],
  RND: [
    {
      id: 'RND-001',
      directorKey: 'RND',
      name: 'Teknoloji Taraması',
      description: 'Sektördeki yeni teknolojileri tarayarak raporla',
      priority: 'low',
      estimatedMinutes: 45,
      requiresApproval: false,
      aiProvider: 'CLAUDE',
      command: 'Spor yönetimi ve cimnastik sektöründe kullanılan yeni teknolojileri araştır',
      status: 'pending',
    },
    {
      id: 'RND-002',
      directorKey: 'RND',
      name: 'Prototip Fikirleri',
      description: 'Yeni özellik prototip fikirlerini listele',
      priority: 'low',
      estimatedMinutes: 30,
      requiresApproval: false,
      aiProvider: 'TOGETHER',
      command: 'YİSA-S için yeni özellik fikirleri: Mobil uygulama, wearables entegrasyonu',
      status: 'pending',
    },
  ],
}

/**
 * Direktörlüğün bekleyen ilk görevlerini al
 */
export function getPendingInitialTasks(directorKey: DirectorKey): InitialTask[] {
  return INITIAL_TASKS[directorKey]?.filter((t) => t.status === 'pending') ?? []
}

/**
 * Tüm direktörlüklerin bekleyen ilk görevlerini al
 */
export function getAllPendingInitialTasks(): InitialTask[] {
  const all: InitialTask[] = []
  for (const key of Object.keys(INITIAL_TASKS) as DirectorKey[]) {
    all.push(...getPendingInitialTasks(key))
  }
  return all.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

/**
 * Görev durumunu güncelle
 */
export function updateTaskStatus(
  taskId: string,
  status: InitialTask['status']
): InitialTask | null {
  for (const key of Object.keys(INITIAL_TASKS) as DirectorKey[]) {
    const task = INITIAL_TASKS[key]?.find((t) => t.id === taskId)
    if (task) {
      task.status = status
      return task
    }
  }
  return null
}

/**
 * Direktörlük başlangıç durumu özeti
 */
export function getDirectorateStartupSummary(): {
  director: DirectorKey
  total: number
  pending: number
  completed: number
}[] {
  const summary: {
    director: DirectorKey
    total: number
    pending: number
    completed: number
  }[] = []

  for (const key of Object.keys(INITIAL_TASKS) as DirectorKey[]) {
    const tasks = INITIAL_TASKS[key] ?? []
    summary.push({
      director: key,
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    })
  }

  return summary
}

/**
 * YİSA-S 3 Duvar Güvenlik Sistemi — Birleşik Middleware
 * 
 * 3 Duvar:
 *   1. Duvar: Yasak Bölgeler (forbidden-zones / patron-lock) — AI'ların giremeyeceği alanlar
 *   2. Duvar: Siber Güvenlik (siber-guvenlik) — 4 seviye alarm, audit keywords, erişim seviyeleri
 *   3. Duvar: CELF Denetim (celf-center) — Veri erişim, koruma, onay, veto kontrolü
 * 
 * Bu dosya 3 duvarı tek bir middleware olarak birleştirir.
 * Her API çağrısında veya CELF görevinde çalıştırılır.
 */

import { isForbiddenForAI, requiresPatronApproval, checkPatronLock, REQUIRE_PATRON_APPROVAL, FORBIDDEN_FOR_AI, type PatronLockCheck } from './patron-lock'
import { ALARM_SEVIYELERI, SIBER_GUVENLIK_KURALLARI, type AlarmSeviyesi } from './siber-guvenlik'
import { runCelfChecks, type DirectorKey, type CelfAuditResult } from '../robots/celf-center'
import { executeAcilAlarm } from './acil-alarm'

// ─── Types ──────────────────────────────────────────────────────────────────

export type DuvarSonuc = 'gecti' | 'uyari' | 'engellendi'

export interface UcDuvarResult {
  /** Genel sonuç: geçti, uyarı veya engellendi */
  sonuc: DuvarSonuc
  /** 3 duvarın her birinin durumu */
  duvarlar: {
    yasak_bolgeler: { gecti: boolean; detay: string }
    siber_guvenlik: { gecti: boolean; alarm_seviyesi: AlarmSeviyesi | null; detay: string }
    celf_denetim: { gecti: boolean; detay: string; uyarilar: string[] }
  }
  /** Patron onayı gerekiyor mu? */
  patron_onayi_gerekli: boolean
  /** Engellendiyse sebep */
  engel_sebebi?: string
  /** Tüm uyarılar */
  uyarilar: string[]
  /** Zaman damgası */
  tarih: string
}

export interface UcDuvarParams {
  /** Kontrol edilecek mesaj/komut */
  message: string
  /** İşlem türü (opsiyonel) */
  action?: string
  /** CELF direktörlük anahtarı (opsiyonel — 3. duvar için) */
  directorKey?: DirectorKey
  /** Erişilen veri (opsiyonel — 3. duvar için) */
  requiredData?: string[]
  /** Etkilenen veri (opsiyonel — 3. duvar için) */
  affectedData?: string[]
}

// ─── Duvar 1: Yasak Bölgeler ────────────────────────────────────────────────

function duvar1YasakBolgeler(message: string, action?: string): {
  gecti: boolean
  patronOnayi: boolean
  detay: string
} {
  const patronLock: PatronLockCheck = checkPatronLock(message, action)

  if (!patronLock.allowed) {
    return {
      gecti: false,
      patronOnayi: false,
      detay: patronLock.reason ?? 'Bu alan/işlem AI için yasak.',
    }
  }

  if (patronLock.requiresApproval) {
    return {
      gecti: true,
      patronOnayi: true,
      detay: 'Patron onayı gerekiyor.',
    }
  }

  return { gecti: true, patronOnayi: false, detay: 'Kontrol OK — yasak bölge yok.' }
}

// ─── Duvar 2: Siber Güvenlik ────────────────────────────────────────────────

function duvar2SiberGuvenlik(message: string): {
  gecti: boolean
  alarmSeviyesi: AlarmSeviyesi | null
  detay: string
} {
  const normalized = message.toLowerCase()
  const auditKeywords = SIBER_GUVENLIK_KURALLARI.AUDIT_KEYWORDS

  // Şüpheli anahtar kelime taraması
  const bulunanlar = auditKeywords.filter((kw) => normalized.includes(kw))

  if (bulunanlar.length >= 3) {
    return {
      gecti: false,
      alarmSeviyesi: 'KIRMIZI',
      detay: `Çoklu güvenlik anahtar kelime tespit edildi: ${bulunanlar.join(', ')}`,
    }
  }

  if (bulunanlar.length >= 1) {
    return {
      gecti: true,
      alarmSeviyesi: 'TURUNCU',
      detay: `Güvenlik anahtar kelime tespit edildi: ${bulunanlar.join(', ')}`,
    }
  }

  // Yasak alan kontrolü (forbidden zones ile çakışma)
  const yasakBulundu = SIBER_GUVENLIK_KURALLARI.YASAK_ALANLAR.some(
    (term) => normalized.includes(term.toLowerCase())
  )

  if (yasakBulundu) {
    return {
      gecti: false,
      alarmSeviyesi: 'ACIL',
      detay: 'Yasak alan ihlali tespit edildi.',
    }
  }

  return { gecti: true, alarmSeviyesi: null, detay: 'Siber güvenlik kontrolü OK.' }
}

// ─── Duvar 3: CELF Denetim ─────────────────────────────────────────────────

function duvar3CelfDenetim(params: {
  directorKey?: DirectorKey
  requiredData?: string[]
  affectedData?: string[]
  operation?: string
}): {
  gecti: boolean
  detay: string
  uyarilar: string[]
} {
  const { directorKey, requiredData, affectedData, operation } = params

  // Direktörlük belirtilmemişse 3. duvar atlanır
  if (!directorKey) {
    return { gecti: true, detay: 'Direktörlük belirtilmedi — CELF denetim atlandı.', uyarilar: [] }
  }

  const result: CelfAuditResult = runCelfChecks({
    directorKey,
    requiredData: requiredData ?? [],
    affectedData: affectedData ?? [],
    operation: operation ?? '',
  })

  if (result.vetoBlocked) {
    return {
      gecti: false,
      detay: `CLO veto: ${result.errors.join('; ')}`,
      uyarilar: result.warnings,
    }
  }

  if (!result.passed) {
    return {
      gecti: false,
      detay: `CELF denetim başarısız: ${result.errors.join('; ')}`,
      uyarilar: result.warnings,
    }
  }

  return {
    gecti: true,
    detay: result.warnings.length > 0
      ? `CELF denetim geçti (${result.warnings.length} uyarı)`
      : 'CELF denetim OK.',
    uyarilar: result.warnings,
  }
}

// ─── Birleşik 3 Duvar Kontrolü ─────────────────────────────────────────────

/**
 * 3 Duvar güvenlik kontrolünü tek seferde çalıştırır.
 * Sırasıyla: Yasak Bölgeler → Siber Güvenlik → CELF Denetim
 */
export function ucDuvarKontrol(params: UcDuvarParams): UcDuvarResult {
  const { message, action, directorKey, requiredData, affectedData } = params
  const uyarilar: string[] = []

  // Duvar 1
  const d1 = duvar1YasakBolgeler(message, action)

  // Duvar 2
  const d2 = duvar2SiberGuvenlik(message)

  // Duvar 3
  const d3 = duvar3CelfDenetim({
    directorKey,
    requiredData,
    affectedData,
    operation: action ?? message,
  })

  // Uyarıları topla
  if (d1.patronOnayi) uyarilar.push('Patron onayı gerekiyor')
  if (d2.alarmSeviyesi === 'TURUNCU') uyarilar.push(`Siber güvenlik uyarısı: ${d2.detay}`)
  if (d3.uyarilar.length > 0) uyarilar.push(...d3.uyarilar)

  // Engel kontrolü: herhangi bir duvar başarısız → engellendi
  const engellendi = !d1.gecti || !d2.gecti || !d3.gecti
  const engelSebebi = !d1.gecti
    ? d1.detay
    : !d2.gecti
      ? d2.detay
      : !d3.gecti
        ? d3.detay
        : undefined

  // Sonuç belirleme
  let sonuc: DuvarSonuc = 'gecti'
  if (engellendi) {
    sonuc = 'engellendi'
  } else if (uyarilar.length > 0) {
    sonuc = 'uyari'
  }

  // Alarm seviyesi 'ACIL' ise dogrudan acil alarm calistir (HTTP self-call yerine)
  if (d2.alarmSeviyesi === 'ACIL') {
    executeAcilAlarm({
      type: engellendi ? 'guvenlik_ihlali' : 'sistem_hatasi',
      message: d2.detay,
      details: engelSebebi ?? message,
      source: 'uc-duvar',
    }).catch((err) => {
      console.error('[uc-duvar] Acil alarm tetiklenemedi:', err)
    })
  }

  return {
    sonuc,
    duvarlar: {
      yasak_bolgeler: { gecti: d1.gecti, detay: d1.detay },
      siber_guvenlik: { gecti: d2.gecti, alarm_seviyesi: d2.alarmSeviyesi, detay: d2.detay },
      celf_denetim: { gecti: d3.gecti, detay: d3.detay, uyarilar: d3.uyarilar },
    },
    patron_onayi_gerekli: d1.patronOnayi,
    engel_sebebi: engelSebebi,
    uyarilar,
    tarih: new Date().toISOString(),
  }
}

// ─── Dashboard için Duvar Durumu ────────────────────────────────────────────

export interface DuvarDurumu {
  duvar: string
  aciklama: string
  aktif: boolean
  kural_sayisi: number
  renk: string
}

/**
 * 3 Duvar sisteminin genel durumunu döner (dashboard gösterimi için).
 */
export function ucDuvarDurumu(): DuvarDurumu[] {
  return [
    {
      duvar: 'Yasak Bölgeler',
      aciklama: 'AI\'ların giremeyeceği alanlar ve Patron onayı gerektiren işlemler',
      aktif: true,
      kural_sayisi: FORBIDDEN_FOR_AI.length + REQUIRE_PATRON_APPROVAL.length,
      renk: '#ef4444', // kırmızı
    },
    {
      duvar: 'Siber Güvenlik',
      aciklama: '7/24 izleme, 4 seviye alarm sistemi (Sarı, Turuncu, Kırmızı, Acil)',
      aktif: true,
      kural_sayisi: SIBER_GUVENLIK_KURALLARI.AUDIT_KEYWORDS.length + Object.keys(ALARM_SEVIYELERI).length,
      renk: '#f97316', // turuncu
    },
    {
      duvar: 'CELF Denetim',
      aciklama: 'Direktörlük veri erişim, koruma, onay ve veto kontrolü',
      aktif: true,
      kural_sayisi: 15, // 15 direktörlük
      renk: '#eab308', // sarı
    },
  ]
}

// ─── Alarm Seviyeleri Dışa Aktarma ─────────────────────────────────────────

export { ALARM_SEVIYELERI }
export { isForbiddenForAI, requiresPatronApproval, FORBIDDEN_FOR_AI, REQUIRE_PATRON_APPROVAL }

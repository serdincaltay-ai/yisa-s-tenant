/**
 * YİSA-S Siber Güvenlik (Katman 2)
 * 7/24 izleme, bypass EDİLEMEZ. 4 seviye alarm: Sarı, Turuncu, Kırmızı, Acil
 */

import { FORBIDDEN_FOR_AI } from './patron-lock'

/** 4 seviye alarm (Talimat Bölüm 1.1) */
export const ALARM_SEVIYELERI = {
  SARI: { seviye: 1, renk: '#eab308', label: 'Sarı', aciklama: 'Dikkat gerektiren olay' },
  TURUNCU: { seviye: 2, renk: '#f97316', label: 'Turuncu', aciklama: 'Ciddi uyarı' },
  KIRMIZI: { seviye: 3, renk: '#ef4444', label: 'Kırmızı', aciklama: 'Acil müdahale' },
  ACIL: { seviye: 4, renk: '#dc2626', label: 'Acil', aciklama: 'Kritik güvenlik ihlali' },
} as const

export type AlarmSeviyesi = keyof typeof ALARM_SEVIYELERI

export const SIBER_GUVENLIK_KURALLARI = {
  /** Denetlenecek log alanları */
  LOG_ALANLARI: ['auth', 'api', 'database', 'deploy', 'access'] as const,

  /** Güvenlik audit'inde aranacak anahtar kelimeler */
  AUDIT_KEYWORDS: [
    'failed',
    'error',
    'unauthorized',
    'denied',
    'invalid',
    'brute',
    'suspicious',
  ],

  /** AI'ların dokunamayacağı alanlar (patron-lock ile uyumlu) */
  YASAK_ALANLAR: FORBIDDEN_FOR_AI,

  /** 4 seviye alarm sistemi */
  ALARM_SEVIYELERI,

  /** Erişim seviyesi: 0 = en kısıtlı, 3 = tam */
  ERISIM_SEVIYELERI: {
    okuma: 0,
    yazma: 1,
    silme: 2,
    yonetim: 3,
  } as const,
}

export type LogAlani = (typeof SIBER_GUVENLIK_KURALLARI.LOG_ALANLARI)[number]

/**
 * Verilen log alanı için audit uygulanabilir mi?
 */
export function logAlaniDenetlenebilir(alan: string): boolean {
  return (SIBER_GUVENLIK_KURALLARI.LOG_ALANLARI as readonly string[]).includes(alan)
}

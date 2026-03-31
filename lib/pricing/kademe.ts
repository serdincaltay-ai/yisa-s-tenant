/**
 * Kademe Fiyatlandırma Sistemi
 *
 * Öğrenci sayısına ve paket tipine göre kademeli fiyat hesaplar.
 * Kademeler: 100 / 150 / 200 / 250 / 500 öğrenci
 *
 * Kullanım:
 *   import { calculatePrice, KADEME_TABLO, PAKET_TIPLERI } from '@/lib/pricing/kademe'
 *   const sonuc = calculatePrice(120, 'pro')
 */

// ─── Tipler ──────────────────────────────────────────────────────────────────

export type PaketTipi = 'starter' | 'pro' | 'enterprise'

export interface KademeSatir {
  /** Kademe üst sınırı (dahil) */
  ust: number
  /** Kademe etiketi */
  etiket: string
  /** Paket tipine göre birim fiyat (₺/öğrenci/ay) */
  birimFiyat: Record<PaketTipi, number>
}

export interface FiyatSonuc {
  /** Seçilen öğrenci sayısı */
  ogrenciSayisi: number
  /** Seçilen paket tipi */
  paketTipi: PaketTipi
  /** Birim fiyat (₺/öğrenci/ay) */
  birimFiyat: number
  /** Aylık toplam fiyat */
  aylikFiyat: number
  /** Yıllık toplam fiyat (%10 indirimli) */
  yillikFiyat: number
  /** Aktif kademe etiketi */
  kademeEtiket: string
  /** Yıllık indirim oranı */
  yillikIndirimOrani: number
}

// ─── Sabitler ────────────────────────────────────────────────────────────────

/** Yıllık ödeme indirimi */
export const YILLIK_INDIRIM_ORANI = 0.10

/** Paket tipi bilgileri */
export const PAKET_TIPLERI: Record<PaketTipi, { ad: string; aciklama: string }> = {
  starter: {
    ad: 'Başlangıç',
    aciklama: 'Küçük tesisler için temel yönetim paketi',
  },
  pro: {
    ad: 'Profesyonel',
    aciklama: 'Büyüyen tesisler için gelişmiş özellikler',
  },
  enterprise: {
    ad: 'Kurumsal',
    aciklama: 'Büyük organizasyonlar için tam çözüm',
  },
}

/**
 * Kademe tablosu
 * Her kademe için paket tipine göre birim fiyat (₺/öğrenci/ay)
 */
export const KADEME_TABLO: KademeSatir[] = [
  {
    ust: 100,
    etiket: '1-100 öğrenci',
    birimFiyat: { starter: 30, pro: 45, enterprise: 60 },
  },
  {
    ust: 150,
    etiket: '101-150 öğrenci',
    birimFiyat: { starter: 25, pro: 38, enterprise: 50 },
  },
  {
    ust: 200,
    etiket: '151-200 öğrenci',
    birimFiyat: { starter: 22, pro: 33, enterprise: 44 },
  },
  {
    ust: 250,
    etiket: '201-250 öğrenci',
    birimFiyat: { starter: 18, pro: 27, enterprise: 36 },
  },
  {
    ust: 500,
    etiket: '251-500 öğrenci',
    birimFiyat: { starter: 15, pro: 22, enterprise: 30 },
  },
]

// ─── Hesaplama ───────────────────────────────────────────────────────────────

/**
 * Öğrenci sayısı ve paket tipine göre kademeli fiyat hesaplar.
 *
 * @param ogrenciSayisi - Toplam öğrenci sayısı (1-500)
 * @param paketTipi     - Paket tipi: 'starter' | 'pro' | 'enterprise'
 * @returns FiyatSonuc  - Hesaplanmış fiyat bilgisi
 */
export function calculatePrice(
  ogrenciSayisi: number,
  paketTipi: PaketTipi,
): FiyatSonuc {
  const sayi = Math.max(1, Math.min(500, Math.round(ogrenciSayisi)))

  // Uygun kademeyi bul
  const kademe =
    KADEME_TABLO.find((k) => sayi <= k.ust) ??
    KADEME_TABLO[KADEME_TABLO.length - 1]

  const birimFiyat = kademe.birimFiyat[paketTipi]
  const aylikFiyat = sayi * birimFiyat
  const yillikFiyat = Math.round(aylikFiyat * 12 * (1 - YILLIK_INDIRIM_ORANI))

  return {
    ogrenciSayisi: sayi,
    paketTipi,
    birimFiyat,
    aylikFiyat,
    yillikFiyat,
    kademeEtiket: kademe.etiket,
    yillikIndirimOrani: YILLIK_INDIRIM_ORANI,
  }
}

/**
 * Slider için minimum ve maximum öğrenci sayısı
 */
export const SLIDER_MIN = 1
export const SLIDER_MAX = 500
export const SLIDER_STEP = 1

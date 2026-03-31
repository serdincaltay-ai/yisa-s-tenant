/**
 * GOREV #26: Referans araliklari ve olcum dogrulama
 * Yas grubu bazli normal deger tablolari ve validasyon mantigi
 */

export type YasGrubu = '6-8' | '9-11' | '12-14' | '15-17'

export type ReferansAraligi = {
  parametre: string
  parametre_label: string
  birim: string
  yas_min: number
  yas_max: number
  deger_min: number
  deger_max: number
  brans: string
}

export type ValidasyonSonucu = {
  parametre: string
  deger: number
  durum: 'normal' | 'dusuk' | 'yuksek' | 'cok_dusuk' | 'cok_yuksek'
  referans_min: number
  referans_max: number
  mesaj: string | null
  renk: 'yesil' | 'sari' | 'kirmizi'
}

/** Yas hesaplama */
export function yasHesapla(birthDate: string | null): number | null {
  if (!birthDate) return null
  const diff = new Date().getTime() - new Date(birthDate).getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
}

/** Yas grubunu belirle */
export function yasGrubunuBelirle(yas: number): YasGrubu | null {
  if (yas >= 6 && yas <= 8) return '6-8'
  if (yas >= 9 && yas <= 11) return '9-11'
  if (yas >= 12 && yas <= 14) return '12-14'
  if (yas >= 15 && yas <= 17) return '15-17'
  return null
}

/** Varsayilan referans araliklari (client-side fallback) */
const VARSAYILAN_REFERANSLAR: Record<YasGrubu, Record<string, { min: number; max: number; label: string; birim: string }>> = {
  '6-8': {
    mekik: { min: 8, max: 15, label: 'Mekik', birim: 'adet' },
    esneklik: { min: 10, max: 20, label: 'Esneklik', birim: 'cm' },
    sprint: { min: 5, max: 7, label: '20m Sprint', birim: 'sn' },
    boy: { min: 110, max: 135, label: 'Boy', birim: 'cm' },
    kilo: { min: 18, max: 30, label: 'Kilo', birim: 'kg' },
    dikey_sicrama: { min: 12, max: 22, label: 'Dikey Sıçrama', birim: 'cm' },
    denge: { min: 5, max: 15, label: 'Denge', birim: 'sn' },
    koordinasyon: { min: 3, max: 7, label: 'Koordinasyon', birim: 'puan' },
    kuvvet: { min: 2, max: 6, label: 'Kuvvet', birim: 'puan' },
    dayaniklilik: { min: 2, max: 6, label: 'Dayanıklılık', birim: 'puan' },
  },
  '9-11': {
    mekik: { min: 12, max: 25, label: 'Mekik', birim: 'adet' },
    esneklik: { min: 15, max: 25, label: 'Esneklik', birim: 'cm' },
    sprint: { min: 4.5, max: 6, label: '20m Sprint', birim: 'sn' },
    boy: { min: 125, max: 155, label: 'Boy', birim: 'cm' },
    kilo: { min: 25, max: 45, label: 'Kilo', birim: 'kg' },
    dikey_sicrama: { min: 18, max: 30, label: 'Dikey Sıçrama', birim: 'cm' },
    denge: { min: 10, max: 25, label: 'Denge', birim: 'sn' },
    koordinasyon: { min: 4, max: 8, label: 'Koordinasyon', birim: 'puan' },
    kuvvet: { min: 3, max: 7, label: 'Kuvvet', birim: 'puan' },
    dayaniklilik: { min: 3, max: 7, label: 'Dayanıklılık', birim: 'puan' },
  },
  '12-14': {
    mekik: { min: 20, max: 35, label: 'Mekik', birim: 'adet' },
    esneklik: { min: 18, max: 30, label: 'Esneklik', birim: 'cm' },
    sprint: { min: 4, max: 5.5, label: '20m Sprint', birim: 'sn' },
    boy: { min: 140, max: 175, label: 'Boy', birim: 'cm' },
    kilo: { min: 35, max: 60, label: 'Kilo', birim: 'kg' },
    dikey_sicrama: { min: 22, max: 38, label: 'Dikey Sıçrama', birim: 'cm' },
    denge: { min: 15, max: 35, label: 'Denge', birim: 'sn' },
    koordinasyon: { min: 5, max: 9, label: 'Koordinasyon', birim: 'puan' },
    kuvvet: { min: 4, max: 8, label: 'Kuvvet', birim: 'puan' },
    dayaniklilik: { min: 4, max: 8, label: 'Dayanıklılık', birim: 'puan' },
  },
  '15-17': {
    mekik: { min: 25, max: 45, label: 'Mekik', birim: 'adet' },
    esneklik: { min: 20, max: 35, label: 'Esneklik', birim: 'cm' },
    sprint: { min: 3.5, max: 5, label: '20m Sprint', birim: 'sn' },
    boy: { min: 155, max: 190, label: 'Boy', birim: 'cm' },
    kilo: { min: 45, max: 80, label: 'Kilo', birim: 'kg' },
    dikey_sicrama: { min: 28, max: 48, label: 'Dikey Sıçrama', birim: 'cm' },
    denge: { min: 20, max: 45, label: 'Denge', birim: 'sn' },
    koordinasyon: { min: 6, max: 10, label: 'Koordinasyon', birim: 'puan' },
    kuvvet: { min: 5, max: 9, label: 'Kuvvet', birim: 'puan' },
    dayaniklilik: { min: 5, max: 9, label: 'Dayanıklılık', birim: 'puan' },
  },
}

/** Client-side referans araligi getir */
export function getReferansAraligi(yas: number, parametre: string): { min: number; max: number; label: string; birim: string } | null {
  const grup = yasGrubunuBelirle(yas)
  if (!grup) return null
  return VARSAYILAN_REFERANSLAR[grup]?.[parametre] ?? null
}

/** Client-side referans tablosunu getir (yas grubuna gore) */
export function getReferansTablosu(yas: number): Record<string, { min: number; max: number; label: string; birim: string }> | null {
  const grup = yasGrubunuBelirle(yas)
  if (!grup) return null
  return VARSAYILAN_REFERANSLAR[grup] ?? null
}

/**
 * Deger dogrulama: normal, sinirda veya disinda
 * Sprint icin ters mantik: dusuk sure daha iyidir
 */
export function degerDogrula(
  parametre: string,
  deger: number,
  referansMin: number,
  referansMax: number
): ValidasyonSonucu {
  const aralik = referansMax - referansMin
  const tolerans = aralik * 0.2 // %20 tolerans sinirda bolgesi icin
  const sprintTipi = parametre === 'sprint' || parametre === 'sure_20m'

  let durum: ValidasyonSonucu['durum']
  let renk: ValidasyonSonucu['renk']
  let mesaj: string | null = null

  if (sprintTipi) {
    // Sprint icin dusuk sure = iyi, yuksek sure = kotu
    if (deger >= referansMin && deger <= referansMax) {
      durum = 'normal'
      renk = 'yesil'
    } else if (deger < referansMin) {
      // Cok hizli (iyi) - ama belki yanlis girilmis
      if (deger < referansMin - tolerans) {
        durum = 'cok_dusuk'
        renk = 'kirmizi'
        mesaj = `Bu değer çok düşük. Doğru mu? (Yaş grubu ortalaması: ${referansMin}-${referansMax} ${sprintTipi ? 'sn' : ''})`
      } else {
        durum = 'dusuk'
        renk = 'sari'
      }
    } else {
      // Cok yavas
      if (deger > referansMax + tolerans) {
        durum = 'cok_yuksek'
        renk = 'kirmizi'
        mesaj = `Bu değer çok yüksek. Doğru mu? (Yaş grubu ortalaması: ${referansMin}-${referansMax} sn)`
      } else {
        durum = 'yuksek'
        renk = 'sari'
      }
    }
  } else {
    // Normal parametreler (yuksek = iyi)
    if (deger >= referansMin && deger <= referansMax) {
      durum = 'normal'
      renk = 'yesil'
    } else if (deger < referansMin) {
      if (deger < referansMin - tolerans) {
        durum = 'cok_dusuk'
        renk = 'kirmizi'
        mesaj = `Bu değer çok düşük. Doğru mu? (Yaş grubu ortalaması: ${referansMin}-${referansMax})`
      } else {
        durum = 'dusuk'
        renk = 'sari'
      }
    } else {
      if (deger > referansMax + tolerans) {
        durum = 'cok_yuksek'
        renk = 'kirmizi'
        mesaj = `Bu değer çok yüksek. Doğru mu? (Yaş grubu ortalaması: ${referansMin}-${referansMax})`
      } else {
        durum = 'yuksek'
        renk = 'sari'
      }
    }
  }

  return {
    parametre,
    deger,
    durum,
    referans_min: referansMin,
    referans_max: referansMax,
    mesaj,
    renk,
  }
}

/** Parametre anahtar → ölçüm alanı eşlemesi (sprint → sure_20m) */
export const PARAMETRE_ESLEMESI: Record<string, string> = {
  mekik: 'mekik',
  esneklik: 'esneklik',
  sprint: 'sure_20m',
  sure_20m: 'sure_20m',
  boy: 'boy',
  kilo: 'kilo',
  dikey_sicrama: 'dikey_sicrama',
  denge: 'denge',
  koordinasyon: 'koordinasyon',
  kuvvet: 'kuvvet',
  dayaniklilik: 'dayaniklilik',
}

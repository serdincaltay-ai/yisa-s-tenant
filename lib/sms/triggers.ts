/**
 * SMS Tetikleyicileri — Otomatik SMS gönderim fonksiyonları
 * Her fonksiyon belirli bir iş akışı tetikleyicisine karşılık gelir.
 */

import { sendSMS, isSmsConfigured } from './provider'

/**
 * Yoklama: Sporcu gelmedi → Veli'ye SMS
 * @param veliTelefon — Veli telefon numarası (E.164)
 * @param cocukAdi — Sporcunun adı
 * @param tarih — Yoklama tarihi (YYYY-MM-DD)
 * @param meta — tenant_id, athlete_id
 */
export async function yoklamaGelmediSMS(
  veliTelefon: string,
  cocukAdi: string,
  tarih: string,
  meta?: { tenant_id?: string; athlete_id?: string }
) {
  if (!isSmsConfigured()) {
    console.warn('[sms/triggers] SMS yapılandırılmamış — yoklama SMS gönderilmedi')
    return { ok: false, error: 'SMS yapılandırılmamış' }
  }

  const gun = formatTarih(tarih)
  const message = `YİSA-S Bilgi: ${cocukAdi} ${gun} tarihli derse katılmadı. Detaylar için veli panelinizi kontrol ediniz.`

  return sendSMS(veliTelefon, message, {
    tenant_id: meta?.tenant_id,
    trigger_type: 'yoklama_gelmedi',
    athlete_id: meta?.athlete_id,
  })
}

/**
 * Aidat hatırlatma → Veli'ye SMS
 * @param veliTelefon — Veli telefon numarası (E.164)
 * @param tutar — Ödenmemiş tutar (TL)
 * @param sonOdeme — Son ödeme tarihi (YYYY-MM-DD)
 * @param meta — tenant_id
 */
export async function aidatHatirlatmaSMS(
  veliTelefon: string,
  tutar: number,
  sonOdeme: string,
  meta?: { tenant_id?: string }
) {
  if (!isSmsConfigured()) {
    console.warn('[sms/triggers] SMS yapılandırılmamış — aidat SMS gönderilmedi')
    return { ok: false, error: 'SMS yapılandırılmamış' }
  }

  const gun = formatTarih(sonOdeme)
  const message = `YİSA-S Hatırlatma: ${tutar.toLocaleString('tr-TR')} TL tutarında ödenmemiş aidatınız bulunmaktadır. Son ödeme tarihi: ${gun}. Detaylar için veli panelinizi kontrol ediniz.`

  return sendSMS(veliTelefon, message, {
    tenant_id: meta?.tenant_id,
    trigger_type: 'aidat_hatirlatma',
  })
}

/**
 * Duyuru → Veli'ye SMS
 * @param veliTelefon — Veli telefon numarası (E.164)
 * @param baslik — Duyuru başlığı
 * @param meta — tenant_id
 */
export async function duyuruSMS(
  veliTelefon: string,
  baslik: string,
  meta?: { tenant_id?: string }
) {
  if (!isSmsConfigured()) {
    console.warn('[sms/triggers] SMS yapılandırılmamış — duyuru SMS gönderilmedi')
    return { ok: false, error: 'SMS yapılandırılmamış' }
  }

  const message = `YİSA-S Duyuru: ${baslik}. Detaylar için veli panelinizi kontrol ediniz.`

  return sendSMS(veliTelefon, message, {
    tenant_id: meta?.tenant_id,
    trigger_type: 'duyuru',
  })
}

/** YYYY-MM-DD → "5 Mart 2026" formatına çevir */
function formatTarih(tarih: string): string {
  try {
    const d = new Date(tarih + 'T00:00:00')
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return tarih
  }
}

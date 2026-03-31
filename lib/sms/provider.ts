/**
 * SMS Provider — Twilio entegrasyonu
 * sendSMS(to, message) fonksiyonu ile SMS gönderir.
 * Tüm gönderimler sms_logs tablosuna kaydedilir.
 */

import twilio from 'twilio'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export interface SmsResult {
  ok: boolean
  sid?: string
  error?: string
}

/** Twilio client oluştur (lazy — ilk çağrıda) */
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) {
    throw new Error('Twilio kimlik bilgileri yapılandırılmamış')
  }
  return twilio(accountSid, authToken)
}

/** Supabase service client (log yazma için) */
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createServiceClient(url, key)
}

/**
 * SMS gönder + sms_logs tablosuna kaydet
 * @param to — Alıcı telefon numarası (E.164 formatı: +905xx...)
 * @param message — SMS içeriği
 * @param meta — Opsiyonel metadata (tenant_id, trigger_type vb.)
 */
export async function sendSMS(
  to: string,
  message: string,
  meta?: { tenant_id?: string; trigger_type?: string; athlete_id?: string }
): Promise<SmsResult> {
  const fromNumber = process.env.TWILIO_PHONE_NUMBER
  if (!fromNumber) {
    return { ok: false, error: 'SMS gönderici numarası yapılandırılmamış' }
  }

  // Numara temizle — sadece rakam ve + kalsın
  const cleanTo = to.replace(/[^+\d]/g, '')
  if (!cleanTo || cleanTo.length < 10) {
    return { ok: false, error: `Geçersiz telefon numarası: ${to}` }
  }

  let status: 'sent' | 'failed' = 'failed'
  let sid: string | undefined
  let errorMsg: string | undefined

  try {
    const client = getTwilioClient()
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: cleanTo,
    })
    sid = result.sid
    status = 'sent'
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[sms/provider] Gönderim hatası:', errorMsg)
  }

  // Log kaydet (hata olsa bile)
  try {
    const service = getServiceClient()
    if (service) {
      await service.from('sms_logs').insert({
        to_number: cleanTo,
        message,
        status,
        provider: 'twilio',
        provider_sid: sid ?? null,
        error_message: errorMsg ?? null,
        tenant_id: meta?.tenant_id ?? null,
        trigger_type: meta?.trigger_type ?? null,
        athlete_id: meta?.athlete_id ?? null,
      })
    }
  } catch (logErr) {
    console.error('[sms/provider] Log kayıt hatası:', logErr)
  }

  if (status === 'sent') {
    return { ok: true, sid }
  }
  return { ok: false, error: errorMsg }
}

/** Twilio yapılandırmasını kontrol et */
export function isSmsConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  )
}

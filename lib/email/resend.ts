/**
 * Resend Email Service
 * Resend SDK entegrasyonu ile email gonderimi.
 * .env: RESEND_API_KEY gerekli.
 */

import { Resend } from 'resend'

let resendInstance: Resend | null = null

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY ortam değişkeni tanımlanmamış.')
    }
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export interface SendEmailResult {
  ok: boolean
  id?: string
  error?: string
}

/**
 * Email gonder.
 * @param to - Alici email adresi veya adresleri
 * @param subject - Email konusu
 * @param html - HTML icerik
 * @param options - Opsiyonel: from, replyTo
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  options?: { from?: string; replyTo?: string }
): Promise<SendEmailResult> {
  try {
    const resend = getResend()

    const fromAddress = options?.from ?? process.env.RESEND_FROM_EMAIL ?? 'YiSA-S <noreply@yisa-s.com>'

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(options?.replyTo ? { replyTo: options.replyTo } : {}),
    })

    if (error) {
      console.error('[email/resend] Gönderim hatası:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true, id: data?.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[email/resend] Hata:', msg)
    return { ok: false, error: msg }
  }
}

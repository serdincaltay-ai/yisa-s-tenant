/**
 * Acil Alarm Cekirdek Mantigi
 * 
 * Hem /api/alarm/acil route hem de uc-duvar.ts tarafindan dogrudan cagirilir.
 * HTTP self-call yerine dogrudan fonksiyon cagrisi — serverless ortamlarda
 * guvenilir calisir ve auth/cookie sorunlarindan etkilenmez.
 */

import { createSecurityLog } from '@/lib/db/security-logs'
import { sendEmail } from '@/lib/email/resend'
import { getUserSubscriptions } from '@/lib/db/push-subscriptions'
import { sendPushNotification, type PushSubscriptionData } from '@/lib/notifications/web-push'
import { getSupabaseServer } from '@/lib/supabase'
import { PATRON_EMAIL } from '@/lib/auth/roles'

// ─── Types ──────────────────────────────────────────────────────────────────

export type AcilAlarmType = 'sistem_hatasi' | 'guvenlik_ihlali'

export interface AcilAlarmParams {
  type: AcilAlarmType
  message: string
  details?: string
  source?: string
}

export interface AcilAlarmResult {
  ok: boolean
  alarm: {
    type: AcilAlarmType
    message: string
    details?: string
    source: string
    tarih: string
    log_id: string | undefined
  }
  bildirimler: {
    email: boolean
    push: number
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const VALID_TYPES: AcilAlarmType[] = ['sistem_hatasi', 'guvenlik_ihlali']

const ALARM_TYPE_LABELS: Record<AcilAlarmType, string> = {
  sistem_hatasi: 'Sistem Hatasi',
  guvenlik_ihlali: 'Guvenlik Ihlali',
}

/** HTML ozel karakterlerini escape eder (XSS/injection onlemi) */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─── Core Logic ─────────────────────────────────────────────────────────────

/**
 * Acil alarm cekirdek fonksiyonu.
 * security_logs'a kaydeder, Patron'a email + push bildirim gonderir.
 * 
 * Dogrudan cagrilabilir — HTTP endpoint gerektirmez.
 */
export async function executeAcilAlarm(params: AcilAlarmParams): Promise<AcilAlarmResult> {
  const type = params.type
  const message = typeof params.message === 'string' ? params.message.trim() : ''
  const details = typeof params.details === 'string' ? params.details.trim() : undefined
  const source = typeof params.source === 'string' ? params.source.trim() : 'bilinmiyor'

  // Validasyon
  if (!VALID_TYPES.includes(type)) {
    throw new Error(`Gecersiz alarm tipi. Gecerli tipler: ${VALID_TYPES.join(', ')}`)
  }

  if (!message) {
    throw new Error('message alani zorunludur.')
  }

  const tarih = new Date().toISOString()
  const alarmLabel = ALARM_TYPE_LABELS[type]

  // 1) security_logs'a kaydet (severity='acil')
  const logResult = await createSecurityLog({
    event_type: `acil_alarm_${type}`,
    severity: 'acil',
    description: `[ACIL ALARM] ${alarmLabel}: ${message}${details ? ` | Detay: ${details}` : ''} | Kaynak: ${source}`,
    blocked: type === 'guvenlik_ihlali',
  })

  // 2) Patron'a email gonder
  let emailSent = false
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">&#x1F6A8; ACIL ALARM</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">${escapeHtml(alarmLabel)}</p>
        </div>
        <div style="background: #1e293b; color: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px;">
          <div style="background: #0f172a; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">Mesaj:</p>
            <p style="margin: 8px 0 0; font-size: 16px; font-weight: bold;">${escapeHtml(message)}</p>
          </div>
          ${details ? `
          <div style="background: #0f172a; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">Detay:</p>
            <p style="margin: 8px 0 0; font-size: 14px;">${escapeHtml(details)}</p>
          </div>
          ` : ''}
          <div style="display: flex; gap: 16px; margin-top: 16px;">
            <div style="flex: 1; background: #0f172a; padding: 12px; border-radius: 8px;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">Kaynak</p>
              <p style="margin: 4px 0 0; font-size: 14px;">${escapeHtml(source)}</p>
            </div>
            <div style="flex: 1; background: #0f172a; padding: 12px; border-radius: 8px;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">Tarih</p>
              <p style="margin: 4px 0 0; font-size: 14px;">${new Date(tarih).toLocaleString('tr-TR')}</p>
            </div>
          </div>
          <p style="margin: 24px 0 0; font-size: 12px; color: #64748b; text-align: center;">
            Bu alarm YiSA-S Acil Destek Sistemi tarafindan otomatik gonderilmistir.
          </p>
        </div>
      </div>
    `

    const emailResult = await sendEmail(
      PATRON_EMAIL,
      `[ACIL ALARM] ${alarmLabel}: ${message.slice(0, 80)}`,
      emailHtml
    )
    emailSent = emailResult.ok
  } catch (emailErr) {
    console.error('[acil-alarm] Email gonderilemedi:', emailErr)
  }

  // 3) Patron'a push bildirim gonder
  let pushSent = 0
  try {
    const db = getSupabaseServer()
    if (db) {
      const { data: patronUsers } = await db
        .from('auth_users_view')
        .select('id')
        .eq('email', PATRON_EMAIL)
        .limit(1)

      let patronUserId: string | undefined
      if (patronUsers && patronUsers.length > 0) {
        patronUserId = patronUsers[0].id
      } else {
        const { data: patronFromTenants } = await db
          .from('user_tenants')
          .select('user_id')
          .eq('role', 'patron')
          .limit(1)

        if (patronFromTenants && patronFromTenants.length > 0) {
          patronUserId = patronFromTenants[0].user_id
        }
      }

      if (patronUserId) {
        const { data: subscriptions } = await getUserSubscriptions(patronUserId)
        if (subscriptions && subscriptions.length > 0) {
          for (const sub of subscriptions) {
            const pushSub: PushSubscriptionData = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys_p256dh,
                auth: sub.keys_auth,
              },
            }
            const result = await sendPushNotification(pushSub, {
              title: `ACIL ALARM: ${alarmLabel}`,
              body: message.slice(0, 200),
              notification_type: 'duyuru',
              url: '/patron',
            })
            if (result.ok) pushSent++
          }
        }
      }
    }
  } catch (pushErr) {
    console.error('[acil-alarm] Push bildirimi gonderilemedi:', pushErr)
  }

  return {
    ok: true,
    alarm: {
      type,
      message,
      details,
      source,
      tarih,
      log_id: logResult.id,
    },
    bildirimler: {
      email: emailSent,
      push: pushSent,
    },
  }
}

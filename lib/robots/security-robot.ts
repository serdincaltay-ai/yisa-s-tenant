/**
 * YİSA-S Security Robot (Katman 2 - Siber Güvenlik)
 * Her işlemde güvenlik kontrolü, FORBIDDEN_FOR_AI engeli, şüpheli aktivite logu.
 * 4 seviye alarm: Sarı, Turuncu, Kırmızı, Acil
 */

import { isForbiddenForAI, checkPatronLock, type PatronLockCheck } from '@/lib/security/patron-lock'
import { createSecurityLog, type SecuritySeverity } from '@/lib/db/security-logs'

export type SecurityCheckResult = PatronLockCheck & {
  severity?: SecuritySeverity
  logged?: boolean
}

/** Alarm seviyesi: yasak = acil, onay gerekli = kirmizi, şüpheli = turuncu, bilgi = sari */
export function severityForCheck(check: PatronLockCheck): SecuritySeverity {
  if (!check.allowed) return 'acil'
  if (check.requiresApproval) return 'kirmizi'
  return 'sari'
}

/**
 * Mesajı güvenlik kontrolünden geçirir; yasaksa engeller ve loglar.
 */
export async function securityCheck(params: {
  message: string
  action?: string
  userId?: string
  ipAddress?: string
  logToDb?: boolean
}): Promise<SecurityCheckResult> {
  const { message, action, userId, ipAddress, logToDb = true } = params
  const check = checkPatronLock(message, action)
  const severity = severityForCheck(check)

  if (logToDb) {
    await createSecurityLog({
      event_type: check.allowed ? 'security_check' : 'forbidden_blocked',
      severity,
      description: check.allowed
        ? (check.requiresApproval ? 'Patron onayı gerekli' : 'Kontrol OK')
        : (check.reason ?? 'Yasak komut'),
      user_id: userId,
      ip_address: ipAddress,
      blocked: !check.allowed,
    })
  }

  return {
    ...check,
    severity,
    logged: logToDb,
  }
}

/**
 * Sadece yasak mı kontrolü (log yok).
 */
export function isForbidden(message: string): boolean {
  return isForbiddenForAI(message)
}

/**
 * Yasak alanlar ve Patron onayı gerektiren işlemler
 * Talimat: CURSOR TALİMATI SEÇENEK 2 — Kalite Optimize
 * Kaynak: lib/security/patron-lock.ts
 */

export {
  FORBIDDEN_FOR_AI,
  REQUIRE_PATRON_APPROVAL,
  PATRON_APPROVAL_REQUIRED,
  isForbiddenForAI,
  requiresPatronApproval,
  checkPatronLock,
} from './patron-lock'

export type { PatronLockCheck, PatronDecision } from './patron-lock'

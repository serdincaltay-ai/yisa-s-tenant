// YİSA-S Patron Robot - Lock System
// Owner Lock + Destructive Lock

export interface LockStatus {
  ownerLockOk: boolean
  destructiveLockOk: boolean
  currentOwner: string | null
}

const OWNER_ENV_KEY = "YISA_OWNER_KEY"
const EXPECTED_OWNER = "PATRON_SERDINC"

export function checkOwnerLock(): boolean {
  const envOwner = process.env[OWNER_ENV_KEY]
  return envOwner === EXPECTED_OWNER
}

export function getLockStatus(): LockStatus {
  const currentOwner = process.env[OWNER_ENV_KEY] || null
  const ownerLockOk = currentOwner === EXPECTED_OWNER

  const destructiveLockOk = true

  return {
    ownerLockOk,
    destructiveLockOk,
    currentOwner,
  }
}

export function validateLocks(): { ok: boolean; reason?: string } {
  const status = getLockStatus()

  if (!status.ownerLockOk) {
    return { ok: false, reason: "Owner key geçersiz veya eksik (YISA_OWNER_KEY)" }
  }

  return { ok: true }
}

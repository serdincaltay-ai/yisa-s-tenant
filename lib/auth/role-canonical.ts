export type CanonicalRole =
  | 'platform_owner'
  | 'tenant_owner'
  | 'branch_manager'
  | 'sports_director'
  | 'coach'
  | 'assistant_coach'
  | 'registration_staff'
  | 'cashier'
  | 'cleaning_staff'
  | 'security_staff'
  | 'parent'
  | 'athlete'

const MAP: Record<CanonicalRole, string[]> = {
  platform_owner: ['platform_owner', 'patron', 'rol-0'],
  tenant_owner: ['tenant_owner', 'owner', 'franchise', 'firma_sahibi', 'rol-1'],
  branch_manager: ['branch_manager', 'manager', 'mudur', 'tesis_muduru', 'isletme_muduru', 'tesis_sahibi'],
  sports_director: ['sports_director', 'sportif_direktor', 'sportif direktor', 'sportif direktör'],
  coach: ['coach', 'antrenor', 'antrenör', 'trainer'],
  assistant_coach: ['assistant_coach', 'yardimci_antrenor', 'yardimci/stajyer', 'stajyer_antrenor'],
  registration_staff: ['registration_staff', 'kayit_gorevlisi', 'kayit_personeli', 'receptionist'],
  cashier: ['cashier', 'kasa'],
  cleaning_staff: ['cleaning_staff', 'cleaning', 'temizlik', 'temizlik_personeli'],
  security_staff: ['security_staff', 'guvenlik', 'guvenlik_personeli'],
  parent: ['parent', 'veli', 'rol-10'],
  athlete: ['athlete', 'sporcu', 'ogrenci', 'rol-11'],
}

export function canonicalizeRole(raw: string | null | undefined): CanonicalRole | null {
  if (!raw || typeof raw !== 'string') return null
  const r = raw.trim().toLowerCase()
  for (const [canonical, variants] of Object.entries(MAP) as Array<[CanonicalRole, string[]]>) {
    if (variants.some((v) => r === v || r.includes(v))) return canonical
  }
  return null
}

export function hasCanonicalRole(raw: string | null | undefined, allowed: CanonicalRole[]): boolean {
  const c = canonicalizeRole(raw)
  return c ? allowed.includes(c) : false
}

/** Backward-compatible alias */
export function canonicalRoleFromRaw(raw: string | null | undefined): CanonicalRole {
  return canonicalizeRole(raw) ?? 'parent'
}

/** Backward-compatible alias */
export function toCanonicalRole(raw: string | null | undefined): CanonicalRole | null {
  return canonicalizeRole(raw)
}

/** Legacy helper used by layouts */
export function normalizeCanonicalRole(raw: string | null | undefined): CanonicalRole | '' {
  return canonicalizeRole(raw) ?? ''
}

/** Legacy helper used by sportif direktör layout */
export function normalizeRoleCode(raw: string | null | undefined): CanonicalRole | '' {
  return normalizeCanonicalRole(raw)
}

export function isSportsDirectorLikeRole(role: string | null | undefined): boolean {
  return canonicalizeRole(role) === 'sports_director'
}

export function isTenantOwnerLikeRole(role: string | null | undefined): boolean {
  const c = canonicalizeRole(role)
  return c === 'tenant_owner' || c === 'branch_manager'
}

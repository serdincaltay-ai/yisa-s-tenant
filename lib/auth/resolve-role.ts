/**
 * Giriş sonrası rol çözümleme — tek kaynak
 * Öncelik: PATRON_EMAIL > kullanicilar/roller > profiles > user_metadata
 */

import { PATRON_EMAIL } from './roles'

export type ResolvedRole =
  | 'patron'
  | 'tenant_owner'
  | 'firma_sahibi'
  | 'isletme_muduru'
  | 'tesis_sahibi'
  | 'assistant_coach'
  | 'security_staff'
  | 'coach'
  | 'sportif_direktor'
  | 'temizlik'
  | 'kayit_gorevlisi'
  | 'veli'

const PATRON_VARIANTS = ['patron', 'Patron', 'PATRON', 'ROL-0', 'rol-0']
const FRANCHISE_VARIANTS = ['tenant_owner', 'franchise', 'firma_sahibi', 'owner', 'Franchise Sahibi', 'ROL-1', 'rol-1']
const VELI_VARIANTS = ['veli', 'Veli', 'ROL-10', 'rol-10']

function normalizeRole(raw: string | undefined | null): ResolvedRole | null {
  if (!raw || typeof raw !== 'string') return null
  const r = raw.trim().toLowerCase()
  if (PATRON_VARIANTS.some((v) => v.toLowerCase() === r)) return 'patron'
  if (FRANCHISE_VARIANTS.some((v) => v.toLowerCase() === r)) return 'tenant_owner'
  if (['isletme_muduru', 'tesis_sahibi', 'tesis müdürü'].some((v) => r.includes(v.replace(/\s/g, '')))) return 'tesis_sahibi'
  if (['sportif_direktor', 'sportif direktor', 'sportif direktör'].some((v) => r.includes(v))) return 'sportif_direktor'
  if (['assistant_coach', 'yardimci_antrenor', 'yardımcı antrenör', 'yardimci coach', 'yardimci', 'stajyer'].some((v) => r.includes(v))) return 'assistant_coach'
  if (['security_staff', 'guvenlik', 'güvenlik'].some((v) => r.includes(v))) return 'security_staff'
  if (['coach', 'antrenor', 'antrenör', 'trainer'].some((v) => r.includes(v))) return 'coach'
  if (['temizlik', 'cleaning', 'temizlik_personeli'].some((v) => r.includes(v))) return 'temizlik'
  if (['kayit_gorevlisi', 'kayit_personeli', 'kayıt personeli', 'kayit gorevlisi'].some((v) => r.includes(v))) return 'kayit_gorevlisi'
  if (VELI_VARIANTS.some((v) => v.toLowerCase() === r)) return 'veli'
  return null
}

export interface ResolveRoleInput {
  userId: string
  email?: string | null
  userMetadata?: Record<string, unknown>
  profilesRole?: string | null
  kullanicilarRolKod?: string | null
  userTenantsRole?: string | null
}

/**
 * Giriş sonrası rolü çözümle — panel yönlendirmesi için
 */
export function resolveLoginRole(input: ResolveRoleInput): ResolvedRole {
  const { email, userMetadata, profilesRole, kullanicilarRolKod } = input

  // 1. Patron e-posta (en yüksek öncelik)
  if (email && email.toLowerCase() === PATRON_EMAIL.toLowerCase()) {
    return 'patron'
  }

  // 2. kullanicilar.roller.kod (veritabanı rolü)
  const fromKullanici = normalizeRole(kullanicilarRolKod ?? undefined)
  if (fromKullanici) return fromKullanici

  // 3. profiles.role
  const fromProfile = normalizeRole(profilesRole ?? undefined)
  if (fromProfile) return fromProfile

  // 4. user_tenants.role (tenant bazlı rol)
  const fromUserTenants = normalizeRole(input.userTenantsRole ?? undefined)
  if (fromUserTenants) return fromUserTenants

  // 5. user_metadata.role
  const metaRole = userMetadata?.role as string | undefined
  const fromMeta = normalizeRole(metaRole)
  if (fromMeta) return fromMeta

  return 'veli'
}

/** Rol → yönlendirme yolu */
export const ROLE_TO_PATH: Record<ResolvedRole, string> = {
  patron: '/dashboard',
  tenant_owner: '/franchise',
  firma_sahibi: '/franchise',
  isletme_muduru: '/isletme-muduru',
  tesis_sahibi: '/isletme-muduru',
  coach: '/antrenor',
  assistant_coach: '/assistant-coach',
  security_staff: '/security-staff',
  sportif_direktor: '/sportif-direktor',
  temizlik: '/temizlik',
  kayit_gorevlisi: '/kayit',
  veli: '/veli',
}

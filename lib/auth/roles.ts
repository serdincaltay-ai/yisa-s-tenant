/**
 * YİSA-S Rol bazlı erişim (13 seviye)
 * Talimat Bölüm 1.3: 0 Ziyaretçi … 12 Misafir Sporcu
 */

/** Talimat uyumlu 13 rol (referans) */
export const ROLE_SYSTEM_13 = [
  'Ziyaretçi',
  'Alt Admin',
  'Tesis Müdürü',
  'İPTAL',
  'Sportif Direktör',
  'Uzman Antrenör',
  'Antrenör',
  'Yardımcı/Stajyer',
  'Kayıt Personeli',
  'Temizlik Personeli',
  'Veli',
  'Sporcu',
  'Misafir Sporcu',
] as const

export const ROLE_LEVELS = [
  'Ziyaretçi',
  'Ücretsiz Üye',
  'Ücretli Üye',
  'Deneme Üyesi',
  'Eğitmen',
  'Tesis Yöneticisi',
  'Tesis Sahibi',
  'Bölge Müdürü',
  'Franchise Sahibi',
  'Franchise Yöneticisi',
  'Sistem Admini',
  'Süper Admin',
  'Patron',
] as const

export type RoleName = (typeof ROLE_LEVELS)[number]

/** Dashboard'a giriş izni olan roller */
export const DASHBOARD_ALLOWED_ROLES: RoleName[] = [
  'Patron',
  'Süper Admin',
  'Sistem Admini',
]

/**
 * Flow (CEO/CELF/onay kuyruğu) tetikleyebilen roller.
 * Doküman: "Patron (ve üst roller) dışında flow tetikleyemez."
 */
export const FLOW_ALLOWED_ROLES: RoleName[] = [
  'Patron',
  'Süper Admin',
  'Sistem Admini',
]

/**
 * Kullanıcı flow tetikleyebilir mi? (Şirket işi / CEO / CELF / onay kuyruğu)
 */
export function canTriggerFlow(user: {
  email?: string | null
  user_metadata?: { role?: string }
} | null): boolean {
  if (!user) return false
  if (user.email === PATRON_EMAIL) return true
  const role = user.user_metadata?.role as RoleName | undefined
  if (!role) return false
  return FLOW_ALLOWED_ROLES.includes(role)
}

/** Patron e-postası — .env'de NEXT_PUBLIC_PATRON_EMAIL tanımlanabilir */
export const PATRON_EMAIL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PATRON_EMAIL) || 'serdincaltay@gmail.com'

/** Kullanıcı Patron mu? (En üst yetki — onay/bekleyen iş kontrolleri uygulanmaz) */
export function isPatron(user: { email?: string | null } | null): boolean {
  return !!user?.email && user.email.toLowerCase() === PATRON_EMAIL.toLowerCase()
}

/**
 * Kullanıcının dashboard'a erişimi var mı?
 * Patron email veya izinli rol gerekir.
 */
export function canAccessDashboard(user: {
  email?: string | null
  user_metadata?: { role?: string }
} | null): boolean {
  if (!user) return false
  if (user.email === PATRON_EMAIL) return true
  const role = user.user_metadata?.role as RoleName | undefined
  if (!role) return false
  return DASHBOARD_ALLOWED_ROLES.includes(role)
}

/** Rol açıklaması (Users sayfası için) */
export const ROLE_DESCRIPTIONS: Record<RoleName, string> = {
  'Ziyaretçi': 'Giriş yapmamış, sınırlı görüntüleme',
  'Ücretsiz Üye': 'Temel üyelik, sınırlı özellikler',
  'Ücretli Üye': 'Tam üyelik, tüm üye özellikleri',
  'Deneme Üyesi': 'Deneme süresi, ücretli özellikler geçici',
  'Eğitmen': 'Antrenman verme, kendi sporcuları',
  'Tesis Yöneticisi': 'Tek tesis yönetimi',
  'Tesis Sahibi': 'Kendi tesis(ler) yönetimi',
  'Bölge Müdürü': 'Bölge genelinde tesisler',
  'Franchise Sahibi': 'Franchise sahipliği',
  'Franchise Yöneticisi': 'Franchise operasyon yönetimi',
  'Sistem Admini': 'Sistem ayarları, kullanıcı/rol yönetimi',
  'Süper Admin': 'Tam yetki, tüm panel erişimi',
  'Patron': 'En üst yetki, tüm kararlar',
}

/**
 * Anayasa uyumlu ROL kodları (role_permissions tablosu ile eşleşir)
 * ROL-0: Patron (Serdinç Altay)
 * ROL-1: Asistan (AI katmanı)
 * ROL-2 - ROL-11: Tesis hiyerarşisi
 * ROL-12: Misafir Sporcu
 */
export const ANAYASA_ROL_KODLARI: Record<string, { kod: string; isim: string; hiyerarsi: number }> = {
  'Patron': { kod: 'ROL-0', isim: 'Patron', hiyerarsi: 0 },
  'Asistan': { kod: 'ROL-1', isim: 'Patron Asistanı', hiyerarsi: 1 },
  'Alt Admin': { kod: 'ROL-2', isim: 'Alt Admin', hiyerarsi: 2 },
  'Tesis Müdürü': { kod: 'ROL-3', isim: 'Tesis Müdürü', hiyerarsi: 3 },
  'Sportif Direktör': { kod: 'ROL-4', isim: 'Sportif Direktör', hiyerarsi: 4 },
  'Uzman Antrenör': { kod: 'ROL-5', isim: 'Uzman Antrenör', hiyerarsi: 5 },
  'Antrenör': { kod: 'ROL-6', isim: 'Antrenör', hiyerarsi: 6 },
  'Yardımcı/Stajyer': { kod: 'ROL-7', isim: 'Yardımcı/Stajyer Antrenör', hiyerarsi: 7 },
  'Kayıt Personeli': { kod: 'ROL-8', isim: 'Kayıt Personeli', hiyerarsi: 8 },
  'Temizlik Personeli': { kod: 'ROL-9', isim: 'Temizlik/Bakım Personeli', hiyerarsi: 9 },
  'Veli': { kod: 'ROL-10', isim: 'Veli', hiyerarsi: 10 },
  'Sporcu': { kod: 'ROL-11', isim: 'Sporcu', hiyerarsi: 11 },
  'Misafir Sporcu': { kod: 'ROL-12', isim: 'Misafir Sporcu', hiyerarsi: 12 },
}

/**
 * Kullanıcının veritabanı rol kodunu döndür
 */
export function getRolKodu(roleName: string): string {
  return ANAYASA_ROL_KODLARI[roleName]?.kod ?? 'ROL-12'
}

/**
 * Rol kodundan hiyerarşi seviyesi
 */
export function getHiyerarsiFromKod(rolKodu: string): number {
  for (const entry of Object.values(ANAYASA_ROL_KODLARI)) {
    if (entry.kod === rolKodu) return entry.hiyerarsi
  }
  return 99 // Bilinmeyen rol
}

/**
 * Kullanıcı belirli bir hiyerarşi seviyesinin üstünde mi?
 */
export function isAboveHierarchy(userRolKodu: string, requiredLevel: number): boolean {
  const userLevel = getHiyerarsiFromKod(userRolKodu)
  return userLevel <= requiredLevel // Düşük sayı = yüksek yetki
}

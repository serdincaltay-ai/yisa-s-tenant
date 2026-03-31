/**
 * Robot Kota / Limit Sistemi
 *
 * Her tenant icin robot kullanim kotalarini yonetir.
 * robot_usage tablosundan mevcut kullanimi okur, limitlerle karsilastirir.
 *
 * Kullanim:
 *   import { checkQuota, ROBOT_LIMITLERI } from '@/lib/robots/quota'
 *   const sonuc = await checkQuota(tenantId, 'celf')
 */

import { createClient } from '@supabase/supabase-js'

// ─── Tipler ──────────────────────────────────────────────────────────────────

export type RobotType =
  | 'celf'
  | 'veri'
  | 'guvenlik'
  | 'sosyal'
  | 'coo'
  | 'whatsapp'
  | 'strateji'

export interface RobotLimit {
  /** Robot tipi */
  robotType: RobotType
  /** Robot goruntulenen adi */
  ad: string
  /** Aylik maksimum kullanim (komut sayisi) */
  aylikLimit: number
  /** Gunluk maksimum kullanim */
  gunlukLimit: number
}

export interface KotaSonuc {
  /** Kota uygun mu? */
  pirinc: boolean
  /** Kalan aylik kullanim */
  kalanAylik: number
  /** Kalan gunluk kullanim */
  kalanGunluk: number
  /** Bu ayki toplam kullanim */
  aylikKullanim: number
  /** Bugunki kullanim */
  gunlukKullanim: number
  /** Aylik limit */
  aylikLimit: number
  /** Gunluk limit */
  gunlukLimit: number
  /** Yuzde olarak kullanim (0-100) */
  kullanimYuzdesi: number
  /** Hata mesaji (kota asildiginda) */
  mesaj?: string
}

// ─── Sabitler ────────────────────────────────────────────────────────────────

/** Varsayilan robot limitleri (Starter paket bazinda) */
export const ROBOT_LIMITLERI: Record<RobotType, RobotLimit> = {
  celf: { robotType: 'celf', ad: 'CELF Görev Robotu', aylikLimit: 100, gunlukLimit: 10 },
  veri: { robotType: 'veri', ad: 'Veri Robotu', aylikLimit: 200, gunlukLimit: 20 },
  guvenlik: { robotType: 'guvenlik', ad: 'Güvenlik Robotu', aylikLimit: 50, gunlukLimit: 5 },
  sosyal: { robotType: 'sosyal', ad: 'Sosyal Medya Robotu', aylikLimit: 150, gunlukLimit: 15 },
  coo: { robotType: 'coo', ad: 'COO Robotu', aylikLimit: 100, gunlukLimit: 10 },
  whatsapp: { robotType: 'whatsapp', ad: 'WhatsApp Robotu', aylikLimit: 300, gunlukLimit: 30 },
  strateji: { robotType: 'strateji', ad: 'Strateji Robotu', aylikLimit: 50, gunlukLimit: 5 },
}

/** Paket tipine gore limit carpanlari */
export const PAKET_CARPANLARI: Record<string, number> = {
  starter: 1,
  pro: 3,
  enterprise: 10,
}

// ─── Yardimci ────────────────────────────────────────────────────────────────

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase ayarlari eksik')
  return createClient(url, key)
}

/**
 * Belirli bir tenant ve robot tipi icin kota kontrolu yapar.
 *
 * @param tenantId  - Tenant UUID
 * @param robotType - Robot tipi
 * @param paketTipi - Tenant paket tipi (varsayilan: 'starter')
 * @returns KotaSonuc
 */
export async function checkQuota(
  tenantId: string,
  robotType: RobotType,
  paketTipi: string = 'starter',
): Promise<KotaSonuc> {
  const supabase = getSupabaseAdmin()
  const limit = ROBOT_LIMITLERI[robotType]
  const carpan = PAKET_CARPANLARI[paketTipi] ?? 1
  const aylikLimit = limit.aylikLimit * carpan
  const gunlukLimit = limit.gunlukLimit * carpan

  // Bu ayin baslangici
  const now = new Date()
  const ayBaslangic = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Bugunun baslangici
  const gunBaslangic = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  // Aylik kullanim
  const { count: aylikKullanim } = await supabase
    .from('robot_usage')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('robot_type', robotType)
    .gte('created_at', ayBaslangic)

  // Gunluk kullanim
  const { count: gunlukKullanim } = await supabase
    .from('robot_usage')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('robot_type', robotType)
    .gte('created_at', gunBaslangic)

  const aylik = aylikKullanim ?? 0
  const gunluk = gunlukKullanim ?? 0

  const kalanAylik = Math.max(0, aylikLimit - aylik)
  const kalanGunluk = Math.max(0, gunlukLimit - gunluk)
  const kullanimYuzdesi = aylikLimit > 0 ? Math.round((aylik / aylikLimit) * 100) : 0

  const pirinc = kalanAylik > 0 && kalanGunluk > 0

  return {
    pirinc,
    kalanAylik,
    kalanGunluk,
    aylikKullanim: aylik,
    gunlukKullanim: gunluk,
    aylikLimit,
    gunlukLimit,
    kullanimYuzdesi,
    mesaj: !pirinc
      ? kalanAylik <= 0
        ? `${limit.ad} aylık kotası doldu (${aylik}/${aylikLimit})`
        : `${limit.ad} günlük kotası doldu (${gunluk}/${gunlukLimit})`
      : undefined,
  }
}

/**
 * Robot kullanimi kaydet (robot_usage tablosuna INSERT)
 */
export async function recordUsage(
  tenantId: string,
  robotType: RobotType,
  meta?: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('robot_usage').insert({
    tenant_id: tenantId,
    robot_type: robotType,
    meta: meta ?? {},
  })
  if (error) throw new Error(`Robot kullanım kaydı hatası: ${error.message}`)
}

/**
 * Tum robot tipleri icin kota ozeti getir
 */
export async function getQuotaSummary(
  tenantId: string,
  paketTipi: string = 'starter',
): Promise<Record<RobotType, KotaSonuc>> {
  const results = {} as Record<RobotType, KotaSonuc>
  const robotTypes = Object.keys(ROBOT_LIMITLERI) as RobotType[]

  await Promise.all(
    robotTypes.map(async (rt) => {
      results[rt] = await checkQuota(tenantId, rt, paketTipi)
    }),
  )

  return results
}

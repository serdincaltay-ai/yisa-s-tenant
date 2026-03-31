/**
 * Tenant Branding Settings Helper
 * DB'den (tenants tablosu) branding ayarlarını okur,
 * yoksa tenant-template-config.ts'deki statik config'e fallback yapar.
 *
 * Kullanım: tenant-site sayfasında TenantConfig override'ı için.
 */

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantConfig, getDefaultTenantConfig, type TenantConfig } from './tenant-template-config'

/** DB'den gelen branding alanları */
interface TenantBrandingRow {
  slug: string | null
  name: string | null
  package_type: string | null
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  instagram_url: string | null
  whatsapp_number: string | null
  google_maps_url: string | null
  facebook_url: string | null
  twitter_url: string | null
  phone: string | null
  email: string | null
  address: string | null
  working_hours: Record<string, string> | string | null
}

/**
 * Slug'a göre DB'den branding verisi çek, statik config ile birleştir.
 * DB değerleri varsa statik config'in üzerine yazar.
 */
export async function getTenantConfigWithOverrides(slug: string): Promise<TenantConfig> {
  const staticConfig = getTenantConfig(slug) ?? getDefaultTenantConfig()

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return staticConfig

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('tenants')
      .select('slug, name, package_type, logo_url, primary_color, secondary_color, accent_color, instagram_url, whatsapp_number, google_maps_url, facebook_url, twitter_url, phone, email, address, working_hours')
      .eq('slug', slug)
      .maybeSingle()

    if (error || !data) return staticConfig

    const row = data as TenantBrandingRow
    return mergeTenantConfig(staticConfig, row)
  } catch (e) {
    console.error('[tenant-settings-helper] Error fetching overrides:', e)
    return staticConfig
  }
}

/** DB row'undaki dolu alanları statik config'in üzerine yaz */
function mergeTenantConfig(base: TenantConfig, row: TenantBrandingRow): TenantConfig {
  return {
    ...base,
    // Temel bilgiler (DB varsa override)
    ad: row.name ?? base.ad,
    template: mapPackageToTemplate(row.package_type) ?? base.template,

    // İletişim (DB varsa override — null ise fallback, boş string korunur)
    telefon: row.phone ?? base.telefon,
    email: row.email ?? base.email,
    adres: row.address ?? base.adres,
    calisma: row.working_hours != null
      ? (typeof row.working_hours === 'object'
        ? Object.entries(row.working_hours).map(([k, v]) => `${k}: ${v}`).join(', ')
        : row.working_hours)
      : base.calisma,

    // Sosyal medya (DB varsa override — null ise fallback, boş string korunur)
    instagramUrl: row.instagram_url ?? base.instagramUrl,
    whatsapp: row.whatsapp_number ?? base.whatsapp,
    harita: row.google_maps_url ?? base.harita,

    // Logo (DB varsa override — logoBadge statik kalır)
    // Not: logo_url ayrı bir alan olarak template'lere geçilecek
  }
}

/** package_type → TemplateType mapping */
function mapPackageToTemplate(packageType: string | null): TenantConfig['template'] | null {
  switch (packageType) {
    case 'standard':
    case 'starter':
      return 'standard'
    case 'medium':
    case 'growth':
      return 'medium'
    case 'premium':
    case 'enterprise':
      return 'premium'
    default:
      return null
  }
}

/** Tenant branding renkleri — CSS custom property olarak kullanılacak */
export interface TenantBrandingColors {
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

/** DB'den branding renklerini getir (null ise default döner) */
export async function getTenantBrandingColors(slug: string): Promise<TenantBrandingColors> {
  const defaults: TenantBrandingColors = {
    primaryColor: '#06b6d4',
    secondaryColor: '#0e7490',
    accentColor: '#22d3ee',
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return defaults

    const service = createServiceClient(url, key)
    const { data } = await service
      .from('tenants')
      .select('primary_color, secondary_color, accent_color')
      .eq('slug', slug)
      .maybeSingle()

    if (!data) return defaults

    return {
      primaryColor: (data as { primary_color: string | null }).primary_color || defaults.primaryColor,
      secondaryColor: (data as { secondary_color: string | null }).secondary_color || defaults.secondaryColor,
      accentColor: (data as { accent_color: string | null }).accent_color || defaults.accentColor,
    }
  } catch {
    return defaults
  }
}

/** Tenant logo URL'sini DB'den getir */
export async function getTenantLogoUrl(slug: string): Promise<string | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return null

    const service = createServiceClient(url, key)
    const { data } = await service
      .from('tenants')
      .select('logo_url')
      .eq('slug', slug)
      .maybeSingle()

    return (data as { logo_url: string | null } | null)?.logo_url ?? null
  } catch {
    return null
  }
}

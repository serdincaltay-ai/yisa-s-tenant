/**
 * Tenant White-Label Service
 * Domain -> tenant mapping, theme loading, embed widget support
 * Subdomain: bjktuzlacimnastik.yisa-s.com
 * Custom domain: CNAME -> tenant mapping
 * Embed: iframe widget for external sites
 */

import { createClient } from "@supabase/supabase-js"

export interface TenantThemeConfig {
  primary_color: string
  accent_color: string
  bg_color: string
  font: string
  logo_url?: string
  favicon_url?: string
}

export interface TenantDomain {
  id: string
  tenant_id: string
  domain: string
  domain_type: "subdomain" | "custom" | "embed"
  custom_domain: string | null
  is_verified: boolean
  theme_config: TenantThemeConfig
  meta: Record<string, unknown>
}

const DEFAULT_THEME: TenantThemeConfig = {
  primary_color: "#22d3ee",
  accent_color: "#f97316",
  bg_color: "#09090b",
  font: "Inter",
}

/**
 * Domain'den tenant bilgisi cozumle
 * 1. tenant_domains tablosunda domain ara
 * 2. custom_domain alaninda ara
 * 3. Subdomain'den slug cikar, tenants tablosundan bul
 */
export async function resolveTenantFromDomain(
  hostname: string
): Promise<TenantDomain | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  const cleanHost = hostname.split(":")[0].toLowerCase()
  const supabase = createClient(url, key)

  // 1. Direct domain match
  const { data: directMatch } = await supabase
    .from("tenant_domains")
    .select("*")
    .eq("domain", cleanHost)
    .maybeSingle()

  if (directMatch) {
    return {
      ...directMatch,
      theme_config: {
        ...DEFAULT_THEME,
        ...(directMatch.theme_config as TenantThemeConfig),
      },
    } as TenantDomain
  }

  // 2. Custom domain match
  const { data: customMatch } = await supabase
    .from("tenant_domains")
    .select("*")
    .eq("custom_domain", cleanHost)
    .eq("is_verified", true)
    .maybeSingle()

  if (customMatch) {
    return {
      ...customMatch,
      theme_config: {
        ...DEFAULT_THEME,
        ...(customMatch.theme_config as TenantThemeConfig),
      },
    } as TenantDomain
  }

  // 3. Subdomain extraction fallback
  if (cleanHost.endsWith(".yisa-s.com")) {
    const slug = cleanHost.replace(".yisa-s.com", "")
    if (slug && slug !== "www" && slug !== "app" && slug !== "veli") {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .maybeSingle()

      if (tenant?.id) {
        return {
          id: "",
          tenant_id: tenant.id as string,
          domain: cleanHost,
          domain_type: "subdomain",
          custom_domain: null,
          is_verified: true,
          theme_config: DEFAULT_THEME,
          meta: {},
        }
      }
    }
  }

  return null
}

/**
 * Tenant theme CSS degiskenleri olustur
 */
export function generateThemeCSS(theme: TenantThemeConfig): string {
  return `
    :root {
      --tenant-primary: ${theme.primary_color};
      --tenant-accent: ${theme.accent_color};
      --tenant-bg: ${theme.bg_color};
      --tenant-font: '${theme.font}', 'Segoe UI', sans-serif;
    }
  `.trim()
}

/**
 * Embed widget HTML snippet olustur
 * Disaridan iframe ile embed edilebilir
 */
export function generateEmbedSnippet(tenantSlug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tenant.yisa-s.com"
  return `<!-- YiSA-S Embed Widget -->
<iframe
  src="${baseUrl}/embed/${tenantSlug}"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; border-radius: 12px; max-width: 480px;"
  allow="clipboard-write"
  title="YiSA-S Widget"
></iframe>`
}

/**
 * Demo tenant olustur (seed data)
 */
export const DEMO_TENANTS = [
  {
    slug: "demo",
    domain: "demo.yisa-s.com",
    name: "Demo Spor Okulu",
    theme: DEFAULT_THEME,
  },
  {
    slug: "bjktuzlacimnastik",
    domain: "bjktuzlacimnastik.yisa-s.com",
    name: "BJK Tuzla Cimnastik Okulu",
    theme: {
      ...DEFAULT_THEME,
      primary_color: "#000000",
      accent_color: "#ffffff",
    },
  },
] as const

/**
 * Turkish-aware slug utility for tenant/franchise slug generation
 * Handles Turkish characters (ç, ğ, ı, ö, ş, ü) properly
 */

const TURKISH_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c',
  ğ: 'g', Ğ: 'g',
  ı: 'i', İ: 'i',
  ö: 'o', Ö: 'o',
  ş: 's', Ş: 's',
  ü: 'u', Ü: 'u',
}

/**
 * Convert a Turkish string to a URL-safe slug
 * "BJK Tuzla Cimnastik" → "bjk-tuzla-cimnastik"
 * "Fenerbahçe Ataşehir" → "fenerbahce-atasehir"
 */
export function slugify(text: string): string {
  let result = text.trim().toLowerCase()

  // Replace Turkish characters
  for (const [from, to] of Object.entries(TURKISH_MAP)) {
    result = result.replace(new RegExp(from, 'g'), to)
  }

  return result
    .replace(/[^a-z0-9]+/g, '-')  // non-alphanumeric → dash
    .replace(/^-+|-+$/g, '')       // trim leading/trailing dashes
    || 'tesis'                     // fallback
}

/**
 * Generate a unique tenant slug from name + optional ID suffix
 * "ABC Spor İstanbul" + "a1b2c3d4" → "abc-spor-istanbul-a1b2c3d4"
 */
export function generateTenantSlug(name: string, idPrefix?: string): string {
  const base = slugify(name)
  if (idPrefix) {
    const suffix = idPrefix.replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase()
    return suffix ? `${base}-${suffix}` : base
  }
  return base
}

/**
 * Generate a subdomain-safe slug (no dashes, lowercase alphanumeric only)
 * Used for franchise_subdomains entries
 * "BJK Tuzla Cimnastik" → "bjktuzlacimnastik"
 */
export function subdomainSlug(text: string): string {
  let result = text.trim().toLowerCase()

  for (const [from, to] of Object.entries(TURKISH_MAP)) {
    result = result.replace(new RegExp(from, 'g'), to)
  }

  return result.replace(/[^a-z0-9]/g, '') || 'tesis'
}

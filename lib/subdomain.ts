/**
 * Subdomain tabanlı panel tespiti
 * app.yisa-s.com → Patron
 * www.yisa-s.com → Franchise listesi (spor okulları, işletmeler)
 * bjktuzlacimnastik.yisa-s.com, fenerbahceatasehir.yisa-s.com, kartalcimnastik.yisa-s.com → Her franchise'ın kendi sitesi
 * franchise.yisa-s.com → www'ye yönlendir
 * veli.yisa-s.com → Veli
 */

export type PanelType = 'patron' | 'franchise' | 'franchise_site' | 'veli' | 'www'

/** Varsayılan subdomain'ler (DB yoksa veya boşsa) */
export const FRANCHISE_SUBDOMAINS_DEFAULT = ['bjktuzlacimnastik', 'fenerbahceatasehir', 'feneratasehir', 'kartalcimnastik', 'demotesis'] as const
export type FranchiseSubdomain = (typeof FRANCHISE_SUBDOMAINS_DEFAULT)[number]

export function getPanelFromHost(host: string | null, subdomains?: string[]): PanelType {
  if (!host) return 'www'
  const h = host.split(':')[0].toLowerCase()
  const base = h.split('.')[0]
  if (base === 'app') return 'patron'
  if (base === 'franchise') return 'franchise'
  if (base === 'veli') return 'veli'
  if (base === 'www' || base === '' || h === 'yisa-s.com') return 'www'
  if (h.endsWith('.yisa-s.com') && base.length > 0) return 'franchise_site'
  const list = subdomains ?? [...FRANCHISE_SUBDOMAINS_DEFAULT]
  if (list.some((s) => h.startsWith(s + '.'))) return 'franchise_site'
  return 'www'
}

/** Subdomain'den franchise slug — tüm franchise subdomain'leri için base döner */
export function getFranchiseSlugFromHost(host: string | null, _subdomains?: string[]): string | null {
  if (!host) return null
  const h = host.split(':')[0].toLowerCase()
  const base = h.split('.')[0]
  if (base === 'app' || base === 'www' || base === 'franchise' || base === 'veli' || base === '') return null
  if (h.endsWith('.yisa-s.com') && base.length > 0) return base
  return null
}

/** Panel için varsayılan path */
export const PANEL_DEFAULT_PATH: Record<PanelType, string> = {
  patron: '/dashboard',
  franchise: '/franchise',
  franchise_site: '/franchise',
  veli: '/veli',
  www: '/',
}

/** Panel için giriş path */
export const PANEL_LOGIN_PATH: Record<PanelType, string> = {
  patron: '/auth/login',
  franchise: '/auth/login',
  franchise_site: '/auth/login',
  veli: '/auth/login',
  www: '/',
}

const APP_BASE = 'https://app.yisa-s.com'

/** Panel için PWA başlangıç URL */
export const PANEL_START_URL: Record<PanelType, string> = {
  patron: '/dashboard',
  franchise: '/franchise',
  franchise_site: '/franchise',
  veli: '/veli',
  www: `${APP_BASE}/dashboard`,
}

/** Panel için PWA uygulama adı */
export const PANEL_PWA_NAME: Record<PanelType, string> = {
  patron: 'YİSA-S Patron Paneli',
  franchise: 'YİSA-S Franchise Paneli',
  franchise_site: 'YİSA-S Spor Okulu',
  veli: 'YİSA-S Veli Paneli',
  www: 'YİSA-S',
}

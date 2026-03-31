import { NextRequest } from 'next/server'
import {
  getPanelFromHost,
  PANEL_START_URL,
  PANEL_PWA_NAME,
} from '@/lib/subdomain'
import { getFranchiseSubdomains } from '@/lib/db/franchise-subdomains'

const APP_BASE = 'https://app.yisa-s.com'

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const subdomains = await getFranchiseSubdomains()
  const panel = getPanelFromHost(host, subdomains)

  const startUrl = PANEL_START_URL[panel]
  const useAbsoluteScope = panel === 'www' && startUrl.startsWith('http')
  const scope = useAbsoluteScope ? `${APP_BASE}/` : '/'

  const manifest = {
    name: PANEL_PWA_NAME[panel],
    short_name: 'YİSA-S',
    description:
      panel === 'patron'
        ? 'YİSA-S Patron Komuta Merkezi'
        : panel === 'franchise' || panel === 'franchise_site'
          ? 'YİSA-S Franchise Paneli — Tesisinizi yönetin'
          : panel === 'veli'
            ? 'YİSA-S Veli Paneli — Çocuk takibi'
            : 'YİSA-S Spor Tesisi Yönetim Sistemi',
    start_url: startUrl,
    scope,
    display: 'standalone',
    background_color: '#0a0e17',
    theme_color: '#06b6d4',
    orientation: 'portrait',
    lang: 'tr',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    categories: ['business', 'productivity'],
  }

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

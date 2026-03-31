import type { MetadataRoute } from 'next'
import { TENANT_CONFIGS } from '@/lib/tenant-template-config'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yisa-s.com'

/** Ana sayfalar (vitrin, demo, fuar, giriş vb.) */
const ANA_SAYFALAR: Array<{ path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }> = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: 'vitrin', priority: 0.9, changeFrequency: 'monthly' },
  { path: 'demo', priority: 0.9, changeFrequency: 'monthly' },
  { path: 'fuar', priority: 0.8, changeFrequency: 'monthly' },
  { path: 'fiyatlar', priority: 0.8, changeFrequency: 'monthly' },
  { path: 'auth/login', priority: 0.5, changeFrequency: 'yearly' },
  { path: 'uye-ol', priority: 0.5, changeFrequency: 'yearly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const { path, priority, changeFrequency } of ANA_SAYFALAR) {
    entries.push({
      url: path ? `${baseUrl}/${path}` : baseUrl,
      lastModified: now,
      changeFrequency,
      priority,
    })
  }

  const tenantSlugs = Object.keys(TENANT_CONFIGS)
  for (const slug of tenantSlugs) {
    entries.push({
      url: `${baseUrl}/tesis/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })
  }

  return entries
}

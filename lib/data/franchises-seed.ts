/**
 * YİSA-S Franchise seed verisi — Satış yapılacak / demo franchise'lar
 * Patron panelinde Supabase'de veri yokken veya merge için kullanılır.
 * Tarih: 29 Ocak 2026
 */

export interface FranchiseSeedItem {
  id: string
  name: string
  slug: string
  region?: string
  package?: string
  members_count?: number
  athletes_count?: number
  status: 'lead' | 'demo' | 'active'
  contact_name: string
  contact_email?: string
  contact_phone?: string
  created_at: string
  notes?: string
}

/** Satış yapılacak franchise'lar — Tuzla Beşiktaş Cimnastik Okulu (Merve Görmezer) */
export const FRANCHISE_SEED: FranchiseSeedItem[] = [
  {
    id: 'seed-tuzla-besiktas-cimnastik',
    name: 'Tuzla Beşiktaş Cimnastik Okulu',
    slug: 'tuzla-besiktas-cimnastik',
    region: 'Tuzla / İstanbul',
    package: 'Temel Paket (satış öncesi)',
    members_count: 0,
    athletes_count: 0,
    status: 'lead',
    contact_name: 'Merve Görmezer',
    contact_email: 'merve.gormezer@tuzlabesiktascimnastik.com',
    contact_phone: '',
    created_at: new Date().toISOString(),
    notes: 'Franchise firması olarak satış yapılacak. Yetkili: Merve Görmezer.',
  },
]

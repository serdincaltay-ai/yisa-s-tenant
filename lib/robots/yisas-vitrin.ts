/**
 * YİSA-S Vitrin Robotları - Franchise satış vitrin yönetimi
 * Katman 7: YİSA-S Vitrin
 * Vitrin oluşturma, güncelleme, franchise satış sayfaları
 * Tarih: 28 Ocak 2026
 */

export type VitrinAction = 'create' | 'update' | 'list' | 'preview' | 'unknown'

export const VITRIN_ACTIONS: Record<VitrinAction, { label: string; keywords: string[] }> = {
  create: { label: 'Vitrin oluştur', keywords: ['oluştur', 'yeni vitrin', 'create', 'ekle'] },
  update: { label: 'Vitrin güncelle', keywords: ['güncelle', 'düzenle', 'update', 'edit'] },
  list: { label: 'Vitrin listele', keywords: ['listele', 'liste', 'tüm vitrinler', 'list'] },
  preview: { label: 'Vitrin önizleme', keywords: ['önizle', 'preview', 'görüntüle'] },
  unknown: { label: 'Belirsiz', keywords: [] },
}

export interface VitrinConfig {
  franchiseId: string
  templateId?: string
  title?: string
  slug?: string
  isPublic?: boolean
}

/**
 * Vitrin komutundan aksiyon çıkarır.
 */
export function resolveVitrinAction(input: string): VitrinAction {
  const lower = input.toLowerCase().trim()
  for (const [action, config] of Object.entries(VITRIN_ACTIONS)) {
    if (action === 'unknown') continue
    if (config.keywords.some((k) => lower.includes(k))) return action as VitrinAction
  }
  return 'unknown'
}

/**
 * Vitrin slug üretir (basit kural tabanlı).
 */
export function generateVitrinSlug(franchiseName: string, region?: string): string {
  const base = franchiseName
    .toLowerCase()
    .replace(/[^a-z0-9çğıöşü\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
  return region ? `${base}-${region}` : base
}

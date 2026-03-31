/**
 * SSOT (Single Source of Truth) — Ortak Tip Tanımları
 *
 * Bu dosya tenant-yisa-s ve yisa-s-com arasında paylaşılan
 * veri modellerini tanımlar. Her iki repo aynı tipleri kullanır.
 *
 * Veri sahipliği:
 *   - TenantProfile  → tenants tablosu (Supabase, tenant-yisa-s)
 *   - TemplateConfig  → ceo_templates / tenant ayarları (tenant-yisa-s)
 *   - VitrinSlot      → vitrin_slots tablosu (tenant-yisa-s)
 *   - PageContent     → pages tablosu (tenant-yisa-s)
 *
 * Vitrin (yisa-s.com) bu verileri /api/tenant/[id] üzerinden okur.
 * Kendi veritabanında tenant verisi TUTMAZ.
 */

// ─── TenantProfile ─────────────────────────────────────────────────────────

/** Bir spor okulu/tesis hakkında tüm temel bilgiler */
export interface TenantProfile {
  /** Tenant UUID (Supabase tenants.id) */
  id: string
  /** URL-dostu benzersiz anahtar (ör. "bjktuzlacimnastik") */
  slug: string
  /** Kurum adı */
  name: string
  /** Kısa ad (navbar/badge) */
  shortName: string | null
  /** Slogan */
  slogan: string | null
  /** Açıklama metni */
  description: string | null
  /** Durum: aktif | pasif | askida */
  status: string
  /** Paket tipi: starter | growth | premium | enterprise */
  packageType: string | null

  /** İletişim bilgileri */
  contact: TenantContact
  /** Marka/görsel ayarları */
  branding: TenantBranding
  /** Çalışma saatleri */
  workingHours: Record<string, { open: string | null; close: string | null }> | null
  /** Branş (ör. "Artistik Cimnastik", "Çok Branşlı") */
  branch: string | null
  /** Federasyon bilgileri (opsiyonel) */
  federationInfo: FederationInfo | null
}

/** İletişim bilgileri alt tipi */
export interface TenantContact {
  phone: string | null
  email: string | null
  address: string | null
  addressShort: string | null
  instagramUrl: string | null
  whatsappNumber: string | null
  googleMapsUrl: string | null
  googleMapsEmbed: string | null
  facebookUrl: string | null
  twitterUrl: string | null
  website: string | null
}

/** Marka/görsel alt tipi */
export interface TenantBranding {
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string | null
  accentColor: string | null
  /** Logo rozeti (ör. "BJK", "FB") */
  logoBadge: string | null
  /** Üst başlık (kurum adı) */
  headerTitle: string | null
}

/** Federasyon bilgileri */
export interface FederationInfo {
  ilTemsilcisi: string | null
  yarismaKulupleri: string[]
}

// ─── TemplateConfig ─────────────────────────────────────────────────────────

/** Şablon tipi: vitrin sayfasının görsel teması */
export type TemplateType = 'standard' | 'medium' | 'premium'

/** Tenant'a atanmış şablon yapılandırması */
export interface TemplateConfig {
  /** Şablon tipi */
  type: TemplateType
  /** Tema renkleri (CSS custom property olarak uygulanır) */
  theme: {
    primaryColor: string
    accentColor: string
    bgColor: string
    font: string
  }
  /** Özel CSS sınıfları (opsiyonel) */
  customCSS: string | null
}

// ─── VitrinSlot ─────────────────────────────────────────────────────────────

/** Vitrin sayfasında gösterilecek içerik slotları */
export interface VitrinSlot {
  /** Slot UUID */
  id: string
  /** İlişkili tenant UUID */
  tenantId: string
  /** Slot anahtarı (ör. "hero", "features", "pricing", "schedule") */
  slotKey: string
  /** Slot başlığı */
  title: string | null
  /** İçerik (JSON) */
  content: Record<string, unknown>
  /** Sıralama */
  sortOrder: number
  /** Görünür mü? */
  isVisible: boolean
  /** Son güncelleme */
  updatedAt: string
}

// ─── PageContent ────────────────────────────────────────────────────────────

/** Tenant'a ait sayfa içerikleri (hakkında, iletişim, vb.) */
export interface PageContent {
  /** Sayfa UUID */
  id: string
  /** İlişkili tenant UUID */
  tenantId: string
  /** Sayfa slug'ı (ör. "hakkimizda", "iletisim", "kvkk") */
  pageSlug: string
  /** Sayfa başlığı */
  title: string
  /** HTML veya Markdown içerik */
  body: string
  /** SEO meta description */
  metaDescription: string | null
  /** Yayında mı? */
  isPublished: boolean
  /** Son güncelleme */
  updatedAt: string
}

// ─── API Response Tipleri ───────────────────────────────────────────────────

/** /api/tenant/[id] yanıt tipi */
export interface TenantAPIResponse {
  ok: boolean
  tenant: TenantProfile | null
  template: TemplateConfig | null
  vitrinSlots: VitrinSlot[]
  pages: PageContent[]
  /** Hata mesajı (ok=false ise) */
  error?: string
  /** Veri zamanı (cache kontrolü) */
  timestamp: string
}

/** Webhook payload: tenant değişikliğinde vitrin'e gönderilir */
export interface TenantChangeWebhookPayload {
  /** Olay tipi */
  event: 'tenant.updated' | 'tenant.created' | 'tenant.deleted' | 'vitrin.slot_updated' | 'page.updated'
  /** İlişkili tenant UUID */
  tenantId: string
  /** Tenant slug */
  slug: string
  /** Değişen alanlar (opsiyonel) */
  changedFields?: string[]
  /** Olay zamanı */
  timestamp: string
}

/** Webhook yanıt tipi */
export interface WebhookResponse {
  ok: boolean
  revalidated: string[]
  error?: string
}

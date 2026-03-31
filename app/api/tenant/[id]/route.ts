import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type {
  TenantProfile,
  TenantContact,
  TenantBranding,
  TemplateConfig,
  TemplateType,
  VitrinSlot,
  PageContent,
  TenantAPIResponse,
  FederationInfo,
} from '@/types/ssot'
import { getTenantConfig, getDefaultTenantConfig } from '@/lib/tenant-template-config'

export const dynamic = 'force-dynamic'

/**
 * SSOT Tenant API — Tek Doğru Kaynak
 *
 * GET /api/tenant/:id
 *   - id: tenant UUID veya slug
 *   - Vitrin (yisa-s.com) bu endpoint'ten okur
 *   - Kendi veritabanında tenant verisi tutmaz
 *
 * Döndürür: TenantAPIResponse
 */

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

/** package_type → TemplateType (null ise staticConfig fallback kullanılır) */
function resolveTemplateType(packageType: string | null): TemplateType | null {
  switch (packageType) {
    case 'premium':
    case 'enterprise':
      return 'premium'
    case 'medium':
    case 'growth':
    case 'pro':
      return 'medium'
    case 'starter':
    case 'standard':
      return 'standard'
    default:
      return null
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Tenant ID veya slug gerekli', tenant: null, template: null, vitrinSlots: [], pages: [], timestamp: new Date().toISOString() } satisfies TenantAPIResponse,
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: 'Sunucu yapılandırma hatası', tenant: null, template: null, vitrinSlots: [], pages: [], timestamp: new Date().toISOString() } satisfies TenantAPIResponse,
        { status: 500 }
      )
    }

    // UUID mi yoksa slug mı?
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    // 1. Tenant'ı bul
    const query = supabase
      .from('tenants')
      .select('id, slug, name, ad, description, durum, package_type, phone, email, address, primary_color, secondary_color, accent_color, logo_url, instagram_url, whatsapp_number, google_maps_url, facebook_url, twitter_url, working_hours')

    const { data: tenantRow, error: tenantErr } = isUUID
      ? await query.eq('id', id).maybeSingle()
      : await query.eq('slug', id.toLowerCase()).maybeSingle()

    if (tenantErr || !tenantRow) {
      return NextResponse.json(
        { ok: false, error: 'Tenant bulunamadı', tenant: null, template: null, vitrinSlots: [], pages: [], timestamp: new Date().toISOString() } satisfies TenantAPIResponse,
        { status: 404 }
      )
    }

    // Statik config (fallback değerler)
    const slug = (tenantRow.slug as string) ?? id
    const staticConfig = getTenantConfig(slug) ?? getDefaultTenantConfig()

    // 2. Federasyon bilgilerini çek
    let federationInfo: FederationInfo | null = null
    try {
      const { data: fedRows } = await supabase
        .from('federation_info')
        .select('*')
        .eq('tenant_id', tenantRow.id)
        .limit(1)
        .maybeSingle()

      if (fedRows) {
        federationInfo = {
          ilTemsilcisi: (fedRows as Record<string, unknown>).il_temsilcisi as string | null,
          yarismaKulupleri: Array.isArray((fedRows as Record<string, unknown>).yarisma_kulupleri) ? (fedRows as Record<string, unknown>).yarisma_kulupleri as string[] : [],
        }
      } else if (staticConfig.federationInfo) {
        federationInfo = {
          ilTemsilcisi: staticConfig.federationInfo.ilTemsilcisi ?? null,
          yarismaKulupleri: staticConfig.federationInfo.yarismaKulupleri ?? [],
        }
      }
    } catch {
      // federation_info tablosu yoksa statik config'e düş
      if (staticConfig.federationInfo) {
        federationInfo = {
          ilTemsilcisi: staticConfig.federationInfo.ilTemsilcisi ?? null,
          yarismaKulupleri: staticConfig.federationInfo.yarismaKulupleri ?? [],
        }
      }
    }

    // 3. TenantProfile oluştur
    const contact: TenantContact = {
      phone: (tenantRow.phone as string | null) ?? staticConfig.telefon,
      email: (tenantRow.email as string | null) ?? staticConfig.email,
      address: (tenantRow.address as string | null) ?? staticConfig.adres,
      addressShort: staticConfig.adresKisa,
      instagramUrl: (tenantRow.instagram_url as string | null) ?? staticConfig.instagramUrl,
      whatsappNumber: (tenantRow.whatsapp_number as string | null) ?? staticConfig.whatsapp,
      googleMapsUrl: (tenantRow.google_maps_url as string | null) ?? staticConfig.harita,
      googleMapsEmbed: staticConfig.haritaEmbed,
      facebookUrl: (tenantRow.facebook_url as string | null) ?? null,
      twitterUrl: (tenantRow.twitter_url as string | null) ?? null,
      website: null,
    }

    const branding: TenantBranding = {
      logoUrl: (tenantRow.logo_url as string | null) ?? null,
      primaryColor: (tenantRow.primary_color as string | null) ?? '#06b6d4',
      secondaryColor: (tenantRow.secondary_color as string | null) ?? null,
      accentColor: (tenantRow.accent_color as string | null) ?? null,
      logoBadge: staticConfig.logoBadge,
      headerTitle: staticConfig.ustBaslik,
    }

    const tenant: TenantProfile = {
      id: tenantRow.id as string,
      slug,
      name: (tenantRow.name as string | null) ?? (tenantRow.ad as string | null) ?? staticConfig.ad,
      shortName: staticConfig.kisa,
      slogan: staticConfig.slogan,
      description: (tenantRow.description as string | null) ?? staticConfig.aciklama,
      status: (tenantRow.durum as string) ?? 'aktif',
      packageType: (tenantRow.package_type as string | null) ?? null,
      contact,
      branding,
      workingHours: tenantRow.working_hours as TenantProfile['workingHours'],
      branch: staticConfig.brans,
      federationInfo,
    }

    // 4. TemplateConfig
    const templateType = resolveTemplateType(tenantRow.package_type as string | null) ?? staticConfig.template ?? 'standard'
    const template: TemplateConfig = {
      type: templateType,
      theme: {
        primaryColor: branding.primaryColor,
        accentColor: branding.accentColor ?? '#f97316',
        bgColor: '#09090b',
        font: 'Inter',
      },
      customCSS: null,
    }

    // 5. VitrinSlot'ları çek (varsa)
    let vitrinSlots: VitrinSlot[] = []
    try {
      const { data: slotRows } = await supabase
        .from('vitrin_slots')
        .select('id, tenant_id, slot_key, title, content, sort_order, is_visible, updated_at')
        .eq('tenant_id', tenantRow.id)
        .eq('is_visible', true)
        .order('sort_order')

      if (Array.isArray(slotRows) && slotRows.length > 0) {
        vitrinSlots = slotRows.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          tenantId: row.tenant_id as string,
          slotKey: row.slot_key as string,
          title: (row.title as string | null) ?? null,
          content: (row.content as Record<string, unknown>) ?? {},
          sortOrder: (row.sort_order as number) ?? 0,
          isVisible: (row.is_visible as boolean) ?? true,
          updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
        }))
      }
    } catch {
      // vitrin_slots tablosu henüz yoksa boş dizi
    }

    // 6. PageContent'leri çek (varsa)
    let pages: PageContent[] = []
    try {
      const { data: pageRows } = await supabase
        .from('pages')
        .select('id, tenant_id, page_slug, title, body, meta_description, is_published, updated_at')
        .eq('tenant_id', tenantRow.id)
        .eq('is_published', true)
        .order('page_slug')

      if (Array.isArray(pageRows) && pageRows.length > 0) {
        pages = pageRows.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          tenantId: row.tenant_id as string,
          pageSlug: row.page_slug as string,
          title: (row.title as string) ?? '',
          body: (row.body as string) ?? '',
          metaDescription: (row.meta_description as string | null) ?? null,
          isPublished: (row.is_published as boolean) ?? true,
          updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
        }))
      }
    } catch {
      // pages tablosu henüz yoksa boş dizi
    }

    const response: TenantAPIResponse = {
      ok: true,
      tenant,
      template,
      vitrinSlots,
      pages,
      timestamp: new Date().toISOString(),
    }

    // Cache header: 60s stale-while-revalidate, webhook ile invalidate edilir
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (e) {
    console.error('[api/tenant/[id] GET]', e)
    return NextResponse.json(
      { ok: false, error: 'Sunucu hatası', tenant: null, template: null, vitrinSlots: [], pages: [], timestamp: new Date().toISOString() } satisfies TenantAPIResponse,
      { status: 500 }
    )
  }
}

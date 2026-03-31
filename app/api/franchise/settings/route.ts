/**
 * Franchise tesis ayarları: personel hedefleri, aidat kademeleri,
 * branding (logo, renkler), sosyal medya, iletişim bilgileri
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function getTenantId(userId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const service = createServiceClient(url, key)
  const { data: ut } = await service.from('user_tenants').select('tenant_id').eq('user_id', userId).limit(1).maybeSingle()
  if (ut?.tenant_id) return ut.tenant_id
  const { data: t } = await service.from('tenants').select('id').eq('owner_id', userId).limit(1).maybeSingle()
  return t?.id ?? null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    const { data: tenant, error } = await service
      .from('tenants')
      .select('id, name, slug, package_type, antrenor_hedef, temizlik_hedef, mudur_hedef, aidat_tiers, kredi_paketleri, logo_url, primary_color, secondary_color, accent_color, instagram_url, whatsapp_number, google_maps_url, facebook_url, twitter_url, phone, email, address, working_hours')
      .eq('id', tenantId)
      .single()

    if (error || !tenant) return NextResponse.json({ error: 'Tesis bulunamadı' }, { status: 404 })
    return NextResponse.json({
      tenant: {
        ...tenant,
        aidat_tiers: tenant.aidat_tiers ?? { '25': 500, '45': 700, '60': 900 },
      },
    })
  } catch (e) {
    console.error('[franchise/settings]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json()
    const update: Record<string, unknown> = {}
    if (typeof body.antrenor_hedef === 'number') update.antrenor_hedef = body.antrenor_hedef
    if (typeof body.temizlik_hedef === 'number') update.temizlik_hedef = body.temizlik_hedef
    if (typeof body.mudur_hedef === 'number') update.mudur_hedef = body.mudur_hedef
    if (body.aidat_tiers != null && typeof body.aidat_tiers === 'object') update.aidat_tiers = body.aidat_tiers
    if (Array.isArray(body.kredi_paketleri)) update.kredi_paketleri = body.kredi_paketleri

    // Branding & renk paleti — doğrulama ile
    const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/
    const MAX_TEXT_LEN = 500

    const colorFields = ['primary_color', 'secondary_color', 'accent_color'] as const
    for (const field of colorFields) {
      if (typeof body[field] === 'string') {
        if (!HEX_COLOR_RE.test(body[field])) {
          return NextResponse.json({ error: `Geçersiz renk formatı: ${field}. #RRGGBB formatında olmalı.` }, { status: 400 })
        }
        update[field] = body[field]
      }
    }

    const urlFields = ['instagram_url', 'google_maps_url', 'facebook_url', 'twitter_url'] as const
    for (const field of urlFields) {
      if (typeof body[field] === 'string') {
        const val = body[field].trim()
        if (val !== '' && !val.startsWith('https://')) {
          return NextResponse.json({ error: `Geçersiz URL: ${field}. https:// ile başlamalı.` }, { status: 400 })
        }
        update[field] = val
      }
    }

    // logo_url: Normalde /api/franchise/logo ile yüklenir, ama PATCH ile de https:// URL gönderilebilir
    if (typeof body.logo_url === 'string') {
      const logoVal = body.logo_url.trim()
      if (logoVal !== '' && !logoVal.startsWith('https://')) {
        return NextResponse.json({ error: 'Geçersiz logo URL. https:// ile başlamalı.' }, { status: 400 })
      }
      update.logo_url = logoVal
    }

    // WhatsApp: + ve rakam
    if (typeof body.whatsapp_number === 'string') {
      const wVal = body.whatsapp_number.trim()
      if (wVal !== '' && !/^\+?[0-9\s\-()]+$/.test(wVal)) {
        return NextResponse.json({ error: 'Geçersiz WhatsApp numarası. Sadece rakam, +, boşluk, tire.' }, { status: 400 })
      }
      update.whatsapp_number = wVal
    }

    // Serbest metin alanları (uzunluk sınırlı)
    const textFields = ['phone', 'email', 'address'] as const
    for (const field of textFields) {
      if (typeof body[field] === 'string') {
        const val = body[field].trim()
        if (val.length > MAX_TEXT_LEN) {
          return NextResponse.json({ error: `${field} çok uzun. Maksimum ${MAX_TEXT_LEN} karakter.` }, { status: 400 })
        }
        update[field] = val
      }
    }

    // working_hours: JSONB olarak saklanır — string geldiyse "Gün: Saat" formatından objeye çevir
    if (body.working_hours != null) {
      if (typeof body.working_hours === 'string') {
        const val = body.working_hours.trim()
        if (val.length > MAX_TEXT_LEN) {
          return NextResponse.json({ error: `working_hours çok uzun. Maksimum ${MAX_TEXT_LEN} karakter.` }, { status: 400 })
        }
        // "Pazartesi: 09:00-21:00\nSalı: ..." formatını JSONB objesine çevir
        const lines = val.split('\n').filter((l: string) => l.includes(':'))
        if (lines.length > 0) {
          const obj: Record<string, string> = {}
          for (const line of lines) {
            const idx = line.indexOf(':')
            const k = line.slice(0, idx).trim()
            const v = line.slice(idx + 1).trim()
            if (k) obj[k] = v
          }
          update.working_hours = obj
        } else {
          update.working_hours = val || null
        }
      } else if (typeof body.working_hours === 'object') {
        update.working_hours = body.working_hours
      }
    }

    if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    const { error } = await service.from('tenants').update(update).eq('id', tenantId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/settings]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

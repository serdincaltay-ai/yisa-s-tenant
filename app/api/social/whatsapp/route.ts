/**
 * WhatsApp Business Entegrasyon API
 * GET  — Tenant'ın WhatsApp konfigürasyonunu döner
 * POST — WhatsApp Business hesabı bağla / güncelle
 * Kullanım: 0530 710 46 24 gibi iş hatlarını yönetmek için
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { requireAuth } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

async function getTenantId(): Promise<string | null> {
  const h = await headers()
  return h.get('x-tenant-id')
}

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const tenantId = await getTenantId()
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant bulunamadı.' }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Sunucu yapılandırma hatası.' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('social_media_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('platform', 'whatsapp')
    .maybeSingle()

  if (error) {
    console.error('[social/whatsapp] GET error:', error)
    return NextResponse.json({ error: 'Veri alınamadı.' }, { status: 500 })
  }

  return NextResponse.json({
    config: data ?? null,
    defaults: {
      platform: 'whatsapp',
      phone: '05307104624',
      features: [
        'Otomatik hoş geldin mesajı',
        'Randevu hatırlatma bildirimleri',
        'Ödeme hatırlatma bildirimleri',
        'Ölçüm sonuç paylaşımı',
        'Ders programı değişiklik bildirimi',
        'Lead toplama (WhatsApp → demo_requests)',
        'Toplu mesaj gönderimi (şablon bazlı)',
      ],
    },
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const tenantId = await getTenantId()
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant bulunamadı.' }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Sunucu yapılandırma hatası.' }, { status: 500 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON.' }, { status: 400 })
  }

  const accountName = typeof body.account_name === 'string' ? body.account_name.trim() : ''
  const accountId = typeof body.account_id === 'string' ? body.account_id.trim() : ''
  const accessToken = typeof body.access_token === 'string' ? body.access_token.trim() : ''
  const config = typeof body.config === 'object' && body.config !== null ? body.config : {}

  const { data, error } = await supabase
    .from('social_media_configs')
    .upsert(
      {
        tenant_id: tenantId,
        platform: 'whatsapp',
        account_name: accountName || null,
        account_id: accountId || null,
        access_token: accessToken || null,
        config,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,platform' }
    )
    .select('id')
    .single()

  if (error) {
    console.error('[social/whatsapp] POST error:', error)
    return NextResponse.json({ error: 'Kayıt sırasında hata oluştu.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data?.id })
}

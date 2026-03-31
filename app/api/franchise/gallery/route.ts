import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase ayarları eksik')
  return createServiceClient(url, key)
}

/**
 * GET /api/franchise/gallery
 * Tenant galerisini listeler.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const tip = searchParams.get('tip') // 'image' | 'video' | null (hepsi)

    const service = getSupabaseAdmin()
    let query = service
      .from('tenant_gallery')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('aktif', true)
      .order('siralama', { ascending: true })
      .order('created_at', { ascending: false })

    if (tip === 'image' || tip === 'video') {
      query = query.eq('dosya_tipi', tip)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, medya: data })
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: mesaj }, { status: 500 })
  }
}

/**
 * POST /api/franchise/gallery
 * Galeriye yeni medya ekler.
 * Body: { baslik, aciklama?, dosya_url, dosya_tipi, dosya_boyutu?, etiketler? }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const body = await req.json()
    const { baslik, aciklama, dosya_url, dosya_tipi, dosya_boyutu, etiketler } = body as {
      baslik?: string
      aciklama?: string
      dosya_url?: string
      dosya_tipi?: string
      dosya_boyutu?: number
      etiketler?: string[]
    }

    if (!baslik || !dosya_url || !dosya_tipi) {
      return NextResponse.json(
        { error: 'baslik, dosya_url ve dosya_tipi zorunludur' },
        { status: 400 },
      )
    }

    if (dosya_tipi !== 'image' && dosya_tipi !== 'video') {
      return NextResponse.json(
        { error: 'dosya_tipi "image" veya "video" olmalıdır' },
        { status: 400 },
      )
    }

    const service = getSupabaseAdmin()

    // Sıralama: mevcut en yüksek + 1
    const { data: maxRow } = await service
      .from('tenant_gallery')
      .select('siralama')
      .eq('tenant_id', tenantId)
      .order('siralama', { ascending: false })
      .limit(1)
      .maybeSingle()

    const siralama = ((maxRow?.siralama as number) ?? 0) + 1

    const { data, error } = await service
      .from('tenant_gallery')
      .insert({
        tenant_id: tenantId,
        baslik: baslik.trim(),
        aciklama: aciklama ?? null,
        dosya_url,
        dosya_tipi,
        dosya_boyutu: dosya_boyutu ?? 0,
        etiketler: etiketler ?? [],
        yukleyen_id: user.id,
        siralama,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, medya: data }, { status: 201 })
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: mesaj }, { status: 500 })
  }
}

/**
 * DELETE /api/franchise/gallery?id=xxx
 * Galeri öğesi siler (soft delete: aktif=false).
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Medya ID zorunludur' }, { status: 400 })
    }

    const service = getSupabaseAdmin()
    const { error } = await service
      .from('tenant_gallery')
      .update({ aktif: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: mesaj }, { status: 500 })
  }
}

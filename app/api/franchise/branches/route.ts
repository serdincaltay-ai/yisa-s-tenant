import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth/api-auth'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase ayarları eksik')
  return createClient(url, key)
}

/**
 * GET /api/franchise/branches
 * Tenant şubelerini listeler.
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('tenant_branches')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('varsayilan', { ascending: false })
      .order('ad', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, subeler: data })
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: mesaj }, { status: 500 })
  }
}

/**
 * POST /api/franchise/branches
 * Yeni şube ekler.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const { ad, adres, telefon, email, sehir, ilce, calisma_saatleri, renk } = body as {
      ad?: string
      adres?: string
      telefon?: string
      email?: string
      sehir?: string
      ilce?: string
      calisma_saatleri?: Record<string, unknown>
      renk?: string
    }

    if (!ad || ad.trim().length === 0) {
      return NextResponse.json({ error: 'Şube adı zorunludur' }, { status: 400 })
    }

    const slug = ad
      .toLowerCase()
      .replace(/ş/g, 's')
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ü/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const supabase = getSupabaseAdmin()

    // İlk şube otomatik varsayılan olur
    const { count } = await supabase
      .from('tenant_branches')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    const varsayilan = (count ?? 0) === 0

    const { data, error } = await supabase
      .from('tenant_branches')
      .insert({
        tenant_id: tenantId,
        ad: ad.trim(),
        slug,
        adres: adres ?? null,
        telefon: telefon ?? null,
        email: email ?? null,
        sehir: sehir ?? null,
        ilce: ilce ?? null,
        calisma_saatleri: calisma_saatleri ?? {},
        renk: renk ?? '#06b6d4',
        varsayilan,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, sube: data }, { status: 201 })
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: mesaj }, { status: 500 })
  }
}

/**
 * PUT /api/franchise/branches
 * Şube günceller (body.id gerekli).
 */
export async function PUT(request: Request) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body as { id?: string; [key: string]: unknown }

    if (!id) {
      return NextResponse.json({ error: 'Şube ID zorunludur' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Varsayılan şube değiştiriliyorsa, önce hedef şubeyi doğrula, sonra mevcut varsayılanı kaldır
    if (updates.varsayilan === true) {
      const { data: targetBranch } = await supabase
        .from('tenant_branches')
        .select('id')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single()

      if (!targetBranch) {
        return NextResponse.json({ error: 'Şube bulunamadı' }, { status: 404 })
      }

      const { error: clearError } = await supabase
        .from('tenant_branches')
        .update({ varsayilan: false, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .eq('varsayilan', true)
        .neq('id', id)

      if (clearError) {
        return NextResponse.json({ error: clearError.message }, { status: 500 })
      }
    }

    const { data, error } = await supabase
      .from('tenant_branches')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, sube: data })
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: mesaj }, { status: 500 })
  }
}

/**
 * DELETE /api/franchise/branches
 * Şube siler (query param: id).
 */
export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Şube ID zorunludur' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('tenant_branches')
      .delete()
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

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
 * GET /api/franchise/federation-info
 * Tenant federasyon bilgilerini listeler.
 * Query params: ?branch=jimnastik (opsiyonel)
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const branch = searchParams.get('branch')

    const supabase = getSupabaseAdmin()
    let query = supabase
      .from('federation_info')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('branch', { ascending: true })

    if (branch) {
      query = query.eq('branch', branch)
    }

    const { data, error } = await query

    if (error) {
      console.error('[federation-info GET]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, items: data })
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: mesaj }, { status: 500 })
  }
}

/**
 * POST /api/franchise/federation-info
 * Yeni federasyon bilgisi ekler.
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
    const {
      branch,
      il,
      ilce,
      temsilci_adi,
      temsilci_bransi,
      temsilci_telefonu,
      federasyon_adi,
      yarisma_kulupleri,
    } = body as {
      branch?: string
      il?: string
      ilce?: string
      temsilci_adi?: string
      temsilci_bransi?: string
      temsilci_telefonu?: string
      federasyon_adi?: string
      yarisma_kulupleri?: unknown[]
    }

    if (!branch || branch.trim().length === 0) {
      return NextResponse.json({ error: 'Branş zorunludur' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('federation_info')
      .insert({
        tenant_id: tenantId,
        branch: branch.trim(),
        il: il ?? null,
        ilce: ilce ?? null,
        temsilci_adi: temsilci_adi ?? null,
        temsilci_bransi: temsilci_bransi ?? null,
        temsilci_telefonu: temsilci_telefonu ?? null,
        federasyon_adi: federasyon_adi ?? null,
        yarisma_kulupleri: yarisma_kulupleri ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('[federation-info POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, item: data }, { status: 201 })
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: mesaj }, { status: 500 })
  }
}

/**
 * PATCH /api/franchise/federation-info
 * Federasyon bilgisi günceller (body.id gerekli).
 */
export async function PATCH(request: Request) {
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
      return NextResponse.json({ error: 'Federasyon bilgisi ID zorunludur' }, { status: 400 })
    }

    // Sadece izin verilen alanları güncelle
    const allowedFields = [
      'branch', 'il', 'ilce', 'temsilci_adi', 'temsilci_bransi',
      'temsilci_telefonu', 'federasyon_adi', 'yarisma_kulupleri',
    ]
    const filteredUpdates: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in updates) {
        filteredUpdates[key] = updates[key]
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek alan bulunamadı' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('federation_info')
      .update({ ...filteredUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('[federation-info PATCH]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, item: data })
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: mesaj }, { status: 500 })
  }
}

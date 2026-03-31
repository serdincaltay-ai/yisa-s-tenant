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
 * GET /api/franchise/branslar
 * Tenant'a özel branş listesini döner.
 * Global sports_branches tablosu ile tenant_sports_branches junction tablosu birleştirilir.
 * Henüz tenant_sports_branches kaydı olmayan branşlar varsayılan olarak aktif kabul edilir.
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

    // Global branşları çek
    const { data: allBranches, error: branchError } = await supabase
      .from('sports_branches')
      .select('*')
      .order('sira', { ascending: true })

    if (branchError) {
      return NextResponse.json({ error: branchError.message }, { status: 500 })
    }

    // Tenant'a özel override'ları çek
    const { data: tenantOverrides, error: overrideError } = await supabase
      .from('tenant_sports_branches')
      .select('sports_branch_id, aktif')
      .eq('tenant_id', tenantId)

    if (overrideError) {
      return NextResponse.json({ error: overrideError.message }, { status: 500 })
    }

    // Override map oluştur
    const overrideMap = new Map<string, boolean>()
    if (tenantOverrides) {
      for (const o of tenantOverrides) {
        overrideMap.set(o.sports_branch_id, o.aktif)
      }
    }

    // Birleştir: tenant override varsa onu kullan, yoksa global aktif değerini kullan
    const branslar = (allBranches ?? []).map((b) => ({
      ...b,
      aktif: overrideMap.has(b.id) ? overrideMap.get(b.id) : b.aktif,
    }))

    return NextResponse.json({ ok: true, branslar })
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: mesaj }, { status: 500 })
  }
}

/**
 * PUT /api/franchise/branslar
 * Tenant'a özel branş aktif/pasif durumunu günceller.
 * tenant_sports_branches junction tablosuna upsert yapar.
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
    const { id, aktif } = body as { id?: string; aktif?: boolean }

    if (!id) {
      return NextResponse.json({ error: 'Branş ID zorunludur' }, { status: 400 })
    }

    if (typeof aktif !== 'boolean') {
      return NextResponse.json({ error: 'aktif alanı zorunludur (true/false)' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Upsert into tenant_sports_branches (per-tenant scope)
    const { data, error } = await supabase
      .from('tenant_sports_branches')
      .upsert(
        {
          tenant_id: tenantId,
          sports_branch_id: id,
          aktif,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,sports_branch_id' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, brans: data })
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: mesaj }, { status: 500 })
  }
}

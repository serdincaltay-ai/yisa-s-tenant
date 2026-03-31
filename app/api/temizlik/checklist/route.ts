import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

/**
 * GET /api/temizlik/checklist?tarih=YYYY-MM-DD
 * Belirtilen tarihe ait checklist'i getirir (yoksa bos doner)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ checklist: null, message: 'Tenant atanmamis' })

    const { searchParams } = new URL(req.url)
    const tarih = searchParams.get('tarih') || new Date().toISOString().slice(0, 10)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ checklist: null })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('cleaning_checklists')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .eq('tarih', tarih)
      .maybeSingle()

    if (error) return NextResponse.json({ checklist: null, error: error.message })
    return NextResponse.json({ checklist: data })
  } catch (e) {
    console.error('[temizlik/checklist GET]', e)
    return NextResponse.json({ checklist: null })
  }
}

/**
 * POST /api/temizlik/checklist
 * Body: { tarih: string, items: ChecklistItem[] }
 * Upsert: ayni gun + user + tenant icin gunceller veya yeni olusturur
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamis' }, { status: 403 })

    const body = await req.json()
    const { tarih, items } = body as { tarih?: string; items?: unknown[] }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: '\u00d6\u011feler alan\u0131 gerekli (dizi olmal\u0131)' }, { status: 400 })
    }

    const checklistTarih = tarih || new Date().toISOString().slice(0, 10)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('cleaning_checklists')
      .upsert(
        {
          tenant_id: tenantId,
          user_id: user.id,
          tarih: checklistTarih,
          items,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,user_id,tarih' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, checklist: data })
  } catch (e) {
    console.error('[temizlik/checklist POST]', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}

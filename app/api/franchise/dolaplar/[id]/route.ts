/**
 * PATCH /api/franchise/dolaplar/[id]
 * Durum güncelle (bos, arizali, rezerve) veya boşalt (bos + null kiralayan)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const DURUMLAR = ['bos', 'kirali', 'arizali', 'rezerve'] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = (await req.json()) as Record<string, unknown>
    const durum = typeof body.durum === 'string' && DURUMLAR.includes(body.durum as (typeof DURUMLAR)[number]) ? body.durum : null
    const bosalt = body.bosalt === true

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    const { data: locker, error: findErr } = await service
      .from('lockers')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (findErr || !locker) return NextResponse.json({ error: 'Dolap bulunamadı' }, { status: 404 })

    const updates: Record<string, unknown> = {}
    if (bosalt) {
      updates.durum = 'bos'
      updates.kiralayan_athlete_id = null
      updates.kiralama_baslangic = null
      updates.kiralama_bitis = null
      updates.aylik_ucret = null
    } else if (durum) {
      updates.durum = durum
      if (durum === 'bos') {
        updates.kiralayan_athlete_id = null
        updates.kiralama_baslangic = null
        updates.kiralama_bitis = null
        updates.aylik_ucret = null
      }
    }

    if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true })

    const { error: updErr } = await service
      .from('lockers')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/dolaplar PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

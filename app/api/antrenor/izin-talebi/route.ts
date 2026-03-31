/**
 * @deprecated Bu endpoint kullanımdan kaldırıldı.
 * Resmi endpoint: /api/antrenor/izin (staff_leave_requests tablosu)
 * Bu dosya geriye dönük uyumluluk için korunuyor; yeni geliştirmelerde kullanmayın.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  console.warn('[DEPRECATED] /api/antrenor/izin-talebi kullanıldı. Lütfen /api/antrenor/izin kullanın.')
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ items: [] })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)

    const { data } = await service
      .from('leave_requests')
      .select('id, start_date, end_date, reason, status, created_at')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[antrenor/izin-talebi GET]', e)
    return NextResponse.json({ items: [] })
  }
}

/** Antrenör izin talebi (deprecated — /api/antrenor/izin kullanın). Resmi endpoint: /api/antrenor/izin → staff_leave_requests. */
export async function POST(req: NextRequest) {
  console.warn('[DEPRECATED] /api/antrenor/izin-talebi kullanıldı. Lütfen /api/antrenor/izin kullanın.')
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json()
    const start_date = body.start_date
    const end_date = body.end_date ?? body.start_date
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

    if (!start_date) return NextResponse.json({ error: 'Başlangıç tarihi zorunludur' }, { status: 400 })
    if (!reason) return NextResponse.json({ error: 'Sebep zorunludur' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' })

    const service = createServiceClient(url, key)

    const { data, error } = await service
      .from('leave_requests')
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        start_date,
        end_date,
        reason,
        status: 'pending',
      })
      .select('id, start_date, end_date, reason, status')
      .single()

    if (error) {
      console.error('[izin-talebi insert]', error)
      return NextResponse.json({ ok: false, error: 'İzin talebi gönderilemedi' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, talebi: data })
  } catch (e) {
    console.error('[antrenor/izin-talebi POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

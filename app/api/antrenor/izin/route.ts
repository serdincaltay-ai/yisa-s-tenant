/**
 * Antrenör izin talebi: POST (yeni talep) + GET (kendi talepleri)
 * Ölçüm günlerinde uyarı kontrolü
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 400 })

    const { data, error } = await service
      .from('staff_leave_requests')
      .select('id, leave_date, reason, status, is_olcum_day, substitute_needed, requested_at, reviewed_at')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .order('requested_at', { ascending: false })
      .limit(20)

    if (error) return NextResponse.json({ error: 'Talepler yüklenemedi' }, { status: 500 })

    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[antrenor/izin GET]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 400 })

    const body = await req.json()
    const leaveDate = body.leave_date
    if (!leaveDate || typeof leaveDate !== 'string') {
      return NextResponse.json({ error: 'İzin tarihi gerekli' }, { status: 400 })
    }

    // Geçmiş tarih kontrolü
    const today = new Date().toISOString().slice(0, 10)
    if (leaveDate < today) {
      return NextResponse.json({ error: 'Geçmiş tarih için izin talebi oluşturulamaz' }, { status: 400 })
    }

    // staff kaydını bul
    const { data: staffRow } = await service
      .from('staff')
      .select('id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (!staffRow) return NextResponse.json({ error: 'Personel kaydı bulunamadı' }, { status: 404 })

    // Ölçüm günü kontrolü: gelisim_olcum tablosunda o tarihte kayıt var mı
    let isOlcumDay = false
    const { count: olcumCount } = await service
      .from('gelisim_olcum')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('olcum_tarihi', leaveDate)

    if (olcumCount && olcumCount > 0) {
      isOlcumDay = true
    }

    const { error } = await service
      .from('staff_leave_requests')
      .insert({
        tenant_id: tenantId,
        staff_id: staffRow.id,
        user_id: user.id,
        leave_date: leaveDate,
        reason: typeof body.reason === 'string' ? body.reason.trim() : null,
        is_olcum_day: isOlcumDay,
        substitute_needed: body.substitute_needed ?? true,
      })

    if (error) return NextResponse.json({ error: 'Talep oluşturulamadı' }, { status: 500 })

    return NextResponse.json({ ok: true, is_olcum_day: isOlcumDay })
  } catch (e) {
    console.error('[antrenor/izin POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

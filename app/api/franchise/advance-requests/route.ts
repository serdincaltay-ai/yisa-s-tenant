/**
 * Franchise panel: avans talepleri listele (GET) + onayla/reddet (PATCH)
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

    // Rol yetki kontrolü
    const { data: roleCheck } = await service
      .from('user_tenants')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .maybeSingle()
    const rr = String(roleCheck?.role ?? '').toLowerCase()
    const canManageAdvances = ['patron', 'tenant_owner', 'branch_manager', 'owner', 'admin', 'manager', 'tesis_muduru', 'kasa'].includes(rr)
    if (!roleCheck || !canManageAdvances) {
      return NextResponse.json({ error: 'Yetki yetersiz' }, { status: 403 })
    }

    const { data, error } = await service
      .from('staff_advance_requests')
      .select('id, amount, reason, status, requested_at, reviewed_at, staff_id, user_id')
      .eq('tenant_id', tenantId)
      .order('requested_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: 'Talepler yüklenemedi' }, { status: 500 })

    // staff isimlerini ekle
    const staffIds = [...new Set((data ?? []).map((d: { staff_id: string }) => d.staff_id))]
    let staffMap: Record<string, string> = {}
    if (staffIds.length > 0) {
      const { data: staffRows } = await service
        .from('staff')
        .select('id, name')
        .in('id', staffIds)
      if (staffRows) {
        staffMap = Object.fromEntries(staffRows.map((s: { id: string; name: string }) => [s.id, s.name]))
      }
    }

    const items = (data ?? []).map((d: { id: string; amount: number; reason: string | null; status: string; requested_at: string; reviewed_at: string | null; staff_id: string }) => ({
      ...d,
      staff_name: staffMap[d.staff_id] ?? 'Bilinmeyen',
    }))

    return NextResponse.json({ items })
  } catch (e) {
    console.error('[franchise/advance-requests GET]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
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

    // Rol yetki kontrolü
    const { data: roleCheck } = await service
      .from('user_tenants')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .maybeSingle()
    const rr = String(roleCheck?.role ?? '').toLowerCase()
    const canManageAdvances = ['patron', 'tenant_owner', 'branch_manager', 'owner', 'admin', 'manager', 'tesis_muduru', 'kasa'].includes(rr)
    if (!roleCheck || !canManageAdvances) {
      return NextResponse.json({ error: 'Yetki yetersiz' }, { status: 403 })
    }

    const body = await req.json()
    const { id, status } = body

    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
    }

    const { error } = await service
      .from('staff_advance_requests')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/advance-requests PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

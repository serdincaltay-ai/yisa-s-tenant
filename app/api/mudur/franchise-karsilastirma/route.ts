/**
 * Mudur franchise karsilastirma: tesisler arasi performans karsilastirmasi
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })

    const service = createServiceClient(url, key)

    // Mudur/owner rol kontrolu — sadece yetkili kullanicilar erisebilir
    const { data: userRole } = await service
      .from('user_tenants')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['tenant_owner', 'owner', 'manager'])
      .limit(1)
      .maybeSingle()
    if (!userRole) return NextResponse.json({ error: 'Yetki yok' }, { status: 403 })

    // Kullanicinin manager/owner oldugu tenant'lari bul (sadece yetkili tenant'lar)
    const { data: userTenants } = await service
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .in('role', ['tenant_owner', 'owner', 'manager'])

    const { data: ownedTenants } = await service
      .from('tenants')
      .select('id')
      .eq('owner_id', user.id)

    const tenantIds = [
      ...new Set([
        ...(userTenants ?? []).map((t: { tenant_id: string }) => t.tenant_id),
        ...(ownedTenants ?? []).map((t: { id: string }) => t.id),
      ]),
    ]

    if (tenantIds.length === 0) {
      return NextResponse.json({ tesisler: [] })
    }

    // Her tenant icin istatistik topla
    const tesisler = []
    for (const tid of tenantIds) {
      const [tenantRes, athleteRes, scheduleRes, attendanceRes] = await Promise.all([
        service.from('tenants').select('id, name, slug, city').eq('id', tid).single(),
        service.from('athletes').select('id', { count: 'exact', head: true }).eq('tenant_id', tid),
        service.from('tenant_schedule').select('id', { count: 'exact', head: true }).eq('tenant_id', tid),
        service.from('attendance').select('status').eq('tenant_id', tid).limit(100),
      ])

      const yoklamalar = attendanceRes.data ?? []
      const geldi = yoklamalar.filter((a: { status: string }) => a.status === 'present').length
      const devamOrani = yoklamalar.length > 0 ? Math.round((geldi / yoklamalar.length) * 100) : 0

      tesisler.push({
        id: tid,
        ad: tenantRes.data?.name ?? 'Bilinmeyen',
        slug: tenantRes.data?.slug ?? '',
        sehir: tenantRes.data?.city ?? '',
        sporcuSayisi: athleteRes.count ?? 0,
        dersSayisi: scheduleRes.count ?? 0,
        devamOrani,
      })
    }

    return NextResponse.json({ tesisler })
  } catch (e) {
    console.error('[mudur/franchise-karsilastirma]', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}

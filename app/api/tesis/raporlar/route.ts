import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'
import { checkTesisRole } from '@/lib/auth/tesis-role'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    // Rol dogrulama
    const roleCheck = await checkTesisRole(user.id)
    if (!roleCheck.allowed) return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamis' }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })

    const service = createServiceClient(url, key)

    // Ogrenci sayilari
    const { data: athletes } = await service
      .from('athletes')
      .select('id, status, branch, created_at')
      .eq('tenant_id', tenantId)

    const allAthletes = athletes ?? []
    const aktifOgrenci = allAthletes.filter((a: Record<string, unknown>) => a.status === 'active').length
    const pasifOgrenci = allAthletes.filter((a: Record<string, unknown>) => a.status === 'inactive').length
    const denemeOgrenci = allAthletes.filter((a: Record<string, unknown>) => a.status === 'trial').length

    // Bu ayki yeni kayitlar
    const buAyBaslangic = new Date()
    buAyBaslangic.setDate(1)
    buAyBaslangic.setHours(0, 0, 0, 0)
    const buAyYeniKayit = allAthletes.filter((a: Record<string, unknown>) => {
      const d = a.created_at ? new Date(a.created_at as string) : null
      return d && d >= buAyBaslangic
    }).length

    // Brans dagilimi
    const bransDagilimi: Record<string, number> = {}
    for (const a of allAthletes) {
      const b = (a as Record<string, unknown>).branch as string | null
      const key2 = b || 'Belirtilmemis'
      bransDagilimi[key2] = (bransDagilimi[key2] || 0) + 1
    }

    // Ders sayisi
    const { data: schedule } = await service
      .from('tenant_schedule')
      .select('id')
      .eq('tenant_id', tenantId)
    const dersSayisi = (schedule ?? []).length

    // Antrenor sayisi
    const { data: staff } = await service
      .from('staff')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('role', ['coach', 'trainer'])
      .eq('is_active', true)
    const antrenorSayisi = (staff ?? []).length

    // Saglik kaydi sayisi
    const athleteIds = allAthletes.map((a: Record<string, unknown>) => a.id as string)
    let saglikKaydiSayisi = 0
    if (athleteIds.length > 0) {
      const { data: healthRecords } = await service
        .from('athlete_health_records')
        .select('id')
        .in('athlete_id', athleteIds)
      saglikKaydiSayisi = (healthRecords ?? []).length
    }

    return NextResponse.json({
      toplamOgrenci: allAthletes.length,
      aktifOgrenci,
      pasifOgrenci,
      denemeOgrenci,
      buAyYeniKayit,
      bransDagilimi,
      dersSayisi,
      antrenorSayisi,
      saglikKaydiSayisi,
    })
  } catch (e) {
    console.error('[tesis/raporlar GET]', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}

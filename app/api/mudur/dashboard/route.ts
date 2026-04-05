/**
 * Mudur dashboard: tesis ozet istatistikleri (sporcu, antrenor, ders, gelir, devam, odemeler)
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
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamis' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })

    const service = createServiceClient(url, key)

    // Mudur/owner rol kontrolu — sadece yetkili kullanicilar erisebilir
    const { data: userRole } = await service
      .from('user_tenants')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .in('role', ['tenant_owner', 'owner', 'manager'])
      .limit(1)
      .maybeSingle()
    if (!userRole) return NextResponse.json({ error: 'Yetki yok' }, { status: 403 })

    const ayBaslangic = new Date()
    ayBaslangic.setDate(1)
    const ayStr = ayBaslangic.toISOString().slice(0, 10)

    const [athletesRes, coachesRes, schedulesRes, paymentsRes, attendanceRes] = await Promise.all([
      service.from('athletes').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      service.from('user_tenants').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).in('role', ['coach', 'antrenor', 'trainer']),
      service.from('tenant_schedule').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      service.from('payments').select('amount, status').eq('tenant_id', tenantId).gte('created_at', ayStr),
      service.from('attendance').select('status').eq('tenant_id', tenantId).gte('lesson_date', ayStr),
    ])

    const toplamSporcu = athletesRes.count ?? 0
    const toplamAntrenor = coachesRes.count ?? 0
    const aktifDersSayisi = schedulesRes.count ?? 0

    const odemeler = paymentsRes.data ?? []
    const aylikGelir = odemeler
      .filter((p: { status: string }) => p.status === 'paid' || p.status === 'completed')
      .reduce((s: number, p: { amount: number }) => s + (Number(p.amount) || 0), 0)
    const bekleyenOdemeler = odemeler.filter((p: { status: string }) => p.status === 'pending').length

    const yoklamalar = attendanceRes.data ?? []
    const geldi = yoklamalar.filter((a: { status: string }) => a.status === 'present').length
    const devamOrani = yoklamalar.length > 0 ? Math.round((geldi / yoklamalar.length) * 100) : 0

    // Son etkinlikler: son 10 yoklama + odeme
    const { data: sonYoklamalar } = await service
      .from('attendance')
      .select('id, athlete_id, lesson_date, status')
      .eq('tenant_id', tenantId)
      .order('lesson_date', { ascending: false })
      .limit(5)

    const sonEtkinlikler = (sonYoklamalar ?? []).map((y: { id: string; athlete_id: string; lesson_date: string; status: string }) => ({
      id: y.id,
      baslik: `Yoklama: ${y.status === 'present' ? 'Geldi' : y.status === 'excused' ? 'Izinli' : 'Gelmedi'}`,
      tarih: y.lesson_date,
      tip: 'Yoklama',
    }))

    return NextResponse.json({
      toplamSporcu,
      toplamAntrenor,
      aktifDersSayisi,
      aylikGelir,
      devamOrani,
      bekleyenOdemeler,
      sonEtkinlikler,
    })
  } catch (e) {
    console.error('[mudur/dashboard]', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
